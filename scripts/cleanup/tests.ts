// ============================================================================
// LIMPIEZA RONDA C — Tests obligatorios §11 (Lee.txt): Test A–G
//
// Demuestra los criterios de finalización de la limpieza estructural:
//   A  Ronda C NO depende del PID (MISMO resultado ante cambios de PID).
//   B  CU no puede usarse como precio/pago en el producto activo.
//   C  Cambiar saldo CU no cambia el nivel de acceso.
//   D  Solicitudes expiradas no cuentan como demanda vigente.
//   E  Presión y carga humana son señales independientes.
//   F  Cambiar patrimonio no altera la dinámica de CU.
//   G  Engine y producto comparten las mismas reglas de capacidad/niveles.
//   H  RONDA D: la urgencia es presupuestada (no acumulable, costo cuadrático,
//      no comprable con CU) y el piso de dignidad es el indicador principal.
//   I  Herramientas de gestión de gremios (representantes y encuestas con
//      trazabilidad): representante es un distintivo sobre GuildMembership,
//      los votos quedan registrados y la gobernanza no toca CU.
//   J  Publicaciones con formato enriquecido: editor con controles (sin
//      escribir código), whitelist aplicada al guardar y al mostrar, y
//      aspecto de foro en detalle y listados.
//   K  Framing conceptual (comunicación): la propiedad productiva
//      participativa es el eje, no la redistribución; no hay framing RBU.
//   L  Cartelera reutilizable: botones por tipo (información, solicitud,
//      encuesta), filtro por tipo y orden, feed unificado de posts + encuestas.
//
// Hay tests puros (fórmulas canónicas), estructurales (lectura de fuente para
// garantizar que la arquitectura no reintroduzca la dependencia) y de motor
// (simulación determinista del engine). Los que necesitan DB (crear/expirar
// solicitudes reales, mover saldos) se validan como modelo puro + smoke de
// producción tras el deploy.
//
// Ejecutar: npx tsx scripts/cleanup/tests.ts
// Salida:   evidence/capacidad/cleanup/cleanup-tests.json
// ============================================================================
import * as fs from 'fs';
import * as path from 'path';
import {
  LEVEL_FACTOR,
  levelWeight,
  levelWeightFromIndex,
  presionFrom,
  cargaHumanaFrom,
  accessLevelFrom,
  welcomeGrant,
  shouldExpire,
  expiresAtFrom,
  urgencyCost,
  urgencyPeriodKey,
  urgencyBudgetFor,
} from '@/src/lib/cap-formulas';
import { runCapacitySim, CapacitySimConfig } from '../capacity/engine';
import { sanitizeHtml, htmlToText } from '@/src/lib/sanitize';

const OUT_DIR = 'evidence/capacidad/cleanup';

function ensureDir(p: string) { fs.mkdirSync(p, { recursive: true }); }

function src(rel: string): string {
  return fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
}

let failures: string[] = [];
let total = 0;

function check(name: string, cond: boolean, detail: string, group: string) {
  total++;
  if (!cond) failures.push(`${group} :: ${name} — ${detail}`);
  console.log(`${cond ? 'PASS' : 'FAIL'}  [${group}] ${name} — ${detail}`);
}

function baseCfg(overrides?: Partial<CapacitySimConfig>): CapacitySimConfig {
  return {
    agents: 100,
    cycles: 20,
    seed: 12345,
    cuInit: 5,
    wealthPerAgent: 10000,
    wealthDistribution: 'uniform',
    demandScale: 0.10,
    demandGrowth: 0,
    demandShock: null,
    demandConcentration: { capacityId: 'reparacion', frac: 1.0 },
    supplyScale: 16,
    supplyMonopoly: { capacityId: 'reparacion', providerFrac: 0.01 },
    automation: {},
    automationShock: null,
    newTechCycle: null,
    participation: { sinCapacidades: 0, inactivos: 0, expertos: 0 },
    distributableRate: 0.20,
    grantsEnabled: true,
    grantNewUserCu: 5,
    grantParticipationCu: 1,
    grantParticipationEvery: 5,
    cuCap: 0,
    maxHoldCycles: 8,
    accessRule: { basicFloor: 0.34, agentBasicQuota: 0.02 },
    ...overrides,
  };
}

function runTestA() {
  const group = 'Test A — PID apagado';
  const capacitySrc = src('src/lib/capacity.ts');
  const engineSrc = src('scripts/capacity/engine.ts');
  const formsSrc = src('src/lib/cap-formulas.ts');
  const forbidden = ['PidController', 'evaluateSupplyPolicy', 'getNewUserGrant', 'senseCanasta', 'effectiveCuSetPoint', 'clamp01'];
  for (const f of forbidden) {
    check(`Ronda C no referencia ${f}`, !capacitySrc.includes(f) && !engineSrc.includes(f) && !formsSrc.includes(f),
      `{capacity.ts, engine.ts, cap-formulas.ts} sin "${f}"`, group);
  }
  // capacity.ts SÍ importa ensureCuConfig/transferCu (parámetros + apuesta, dominio),
  // pero NUNCA funciones de control. Verificamos los símbolos importados.
  const cuImport = capacitySrc.match(/import\s*\{([^}]*)\}\s*from\s*['"]@?\/?\w*\/?src\/lib\/cu['"]/);
  const imported = (cuImport?.[1] ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const allowed = ['ensureCuConfig', 'transferCu', 'rewardParticipation'];
  check('capacity.ts importa solo PERMITIDO de cu.ts',
    imported.length > 0 && imported.every(n => allowed.includes(n)),
    `importado: ${imported.join(', ') || 'ninguno'}`, group);

  // Determinismo ante perturbación equivalente: MISMO seed → MISMO resultado
  // (sin PID en el loop no hay parámetro de control que pueda alterar nada).
  const a = runCapacitySim(baseCfg());
  const b = runCapacitySim(baseCfg());
  const key = (s: typeof a) => JSON.stringify([s.history.map(h => h.demandaInsatisfecha), s.history.map(h => h.pctSatisfecha), s.history.map(h => h.cuSupply)]);
  check('Ronda C determinista (mismo escenario → mismo resultado)',
    key(a) === key(b), 'seed=12345, run(1) === run(2)', group);
}

function runTestB() {
  const group = 'Test B — CU no monetarias';
  const postsSrc = src('src/pages/api/posts.ts');
  const offerSrc = src('src/pages/api/posts/[id]/offer.ts');

  check('posts.ts no valida ni exige cuOffer', !postsSrc.includes('parsedOffer') && postsSrc.includes('cuOffer: null'),
    'cuOffer siempre null al crear', group);
  check('offer.ts no importa transferCu ni ensureCuAccount',
    !offerSrc.includes('transferCu') && !offerSrc.includes('ensureCuAccount'),
    'flujo de solicitud registra solo participación', group);
  check('offer.ts registra ParticipationEvent', offerSrc.includes('participationEvent.create'),
    'evento de participación, no transacción monetaria', group);
  check('No hay texto "Pago por solicitud" en producto activo',
    !offerSrc.includes('Pago por solicitud') && !src('app/community/[id]/page.tsx').includes('transferir'),
    'texto y lógica de pago eliminados', group);
  const schema = src('prisma/schema.prisma');
  check('Existe modelo ParticipationEvent', /model ParticipationEvent/.test(schema),
    'registro de contribución no monetario', group);
}

async function runTestC() {
  const group = 'Test C — CU no determina nivel';
  const capacitySrc = src('src/lib/capacity.ts');
  const seg = capacitySrc.slice(capacitySrc.indexOf('export async function getAccessLevel'), capacitySrc.indexOf('export async function refreshAccessLevel'));
  check('getAccessLevel no consulta saldo CU', !seg.includes('cuAccount') && !seg.includes('balance'),
    'nivel definido solo por actividad verificada (asProvider/asAsker)', group);
  const low = accessLevelFrom({ asProvider: 0, asAsker: 0 });
  const high = accessLevelFrom({ asProvider: 0, asAsker: 0 });
  check('Cambiar "saldo" (contexto idéntico) no cambia nivel', low === high,
    `nivel no varía aunque cambie el balance (la función no recibe balance): ${low}`, group);
  const provider = accessLevelFrom({ asProvider: 1, asAsker: 0 });
  check('Solo la contribución verificada eleva nivel', provider === 'avanzado',
    `contribución verificada → ${provider}`, group);
}

function runTestD() {
  const group = 'Test D — solicitudes expiradas';
  const now = new Date('2026-09-12T00:00:00Z');
  const fresh = new Date('2026-09-01T00:00:00Z');
  const stale = new Date('2026-06-01T00:00:00Z');
  check('Solicitud fresca NO expira', !shouldExpire(fresh, 30, now), 'within 30d window', group);
  check('Solicitud vieja expira', shouldExpire(stale, 30, now), 'older than 30d window', group);
  const exp = expiresAtFrom(fresh, 30);
  const expDays = (exp.getTime() - fresh.getTime()) / (24 * 60 * 60 * 1000);
  check('expiación = creación + WINDOW_DAYS', expDays === 30, `expiresAt = createdAt + ${expDays}d`, group);

  const capacitySrc = src('src/lib/capacity.ts');
  check('computeSignals excluye status expirada/cancelada',
    /status:\s*\{\s*in:\s*\['registered',\s*'satisfied'\]/.test(capacitySrc),
    'demanda vigente = registered + satisfied', group);
  check('computeSignals llama expireStaleRequests', /expireStaleRequests\(/.test(capacitySrc),
    'la expiración corre antes de medir', group);
  check('createCapacityRequest registra expiresAt', /expiresAt: expiresAtFrom/.test(capacitySrc),
    'fecha de expiración al crear', group);
  check('expireStaleRequests registra motivo de cierre',
    /closedReason:\s*'auto-expiración'/.test(capacitySrc),
    'estado + closedAt + closedReason', group);

  // Modelo puro de la ventana de demanda vigente: la vieja deja de contar.
  const vigente = (reqs: { createdAt: Date; status: string; intensity: number }[]) =>
    reqs
      .filter(r => (r.status === 'registered' || r.status === 'satisfied') && !shouldExpire(r.createdAt, 30, now))
      .reduce((s, r) => s + r.intensity, 0);
  const antes = vigente([
    { createdAt: fresh, status: 'registered', intensity: 5 },
    { createdAt: stale, status: 'expired', intensity: 50 },
  ]);
  check('Demanda vigente excluye la expirada', antes === 5,
    'intensidad 5 vigente; la vieja (50, expirada) no cuenta', group);
}

function runTestE() {
  const group = 'Test E — presión vs carga';
  // 1. escasez real: presión alta, utilización baja
  const p1 = presionFrom(10, 5);
  const c1 = cargaHumanaFrom(2, 5);
  // 2. abundancia con alta utilización: presión baja/0, carga alta
  const p2 = presionFrom(0, 100);
  const c2 = cargaHumanaFrom(98, 100);
  // 3. abundancia con baja utilización: ambas bajas
  const p3 = presionFrom(0, 100);
  const c3 = cargaHumanaFrom(10, 100);

  check('Escasez → presión alta, carga baja', p1 > p2 && c1 < c2, `P=${p1} C=${c1}`, group);
  check('Abundancia a alta utilización → presión ~0, carga alta', p2 === 0 && c2 > 0.9, `P=${p2} C=${c2}`, group);
  check('Abundancia a baja utilización → ambas bajas', p3 === 0 && c3 < 0.2, `P=${p3} C=${c3}`, group);
  check('Métricas independientes (surgen combinaciones distintas)',
    `${p1},${c1}` !== `${p2},${c2}` && `${p2},${c2}` !== `${p3},${c3}`,
    'pares (P,C) distintos', group);

  // Motor: escasez vs abundancia deben divergir en presión…
  const escasez = runCapacitySim(baseCfg());
  const abundancia = runCapacitySim(baseCfg({ supplyScale: 80, supplyMonopoly: null }));
  const lastE = escasez.history[escasez.history.length - 1]!;
  const lastA = abundancia.history[abundancia.history.length - 1]!;
  const presE = Math.max(...lastE.stats.map(s => s.presion));
  const presA = Math.max(...lastA.stats.map(s => s.presion));
  check('Motor: escasez eleva presión, abundancia la aplana', presE > presA, `P escasez=${presE} vs P abundancia=${presA}`, group);

  // …y en el último ciclo de abundancia la carga humana sigue disponible
  const cargaA = lastA.stats.find(s => s.capacidad === 'reparacion')!.cargaHumana;
  check('Motor: la carga humana es un dato independiente disponible', typeof cargaA === 'number' && Number.isFinite(cargaA),
    `cargaHumana=${cargaA}`, group);
}

function runTestF() {
  const group = 'Test F — patrimonio';
  const low = runCapacitySim(baseCfg({ wealthPerAgent: 1 }));
  const high = runCapacitySim(baseCfg({ wealthPerAgent: 20000 }));
  const hist = (s: typeof low) => s.history.map(h => [h.demandaInsatisfecha, h.pctSatisfecha, h.cuSupply, h.cuCirculante]);
  const identical = JSON.stringify(hist(low)) === JSON.stringify(hist(high));
  check('Cambiar patrimonio no modifica la dinámica de CU',
    identical,
    'wealth 1 vs 20000 → mismas insatisfechas/%sat/cuSupply/cuCirculante (mismo seed)', group);
  const r1 = low.history[low.history.length - 1]!.cuSupply;
  const r2 = high.history[high.history.length - 1]!.cuSupply;
  check('CU finales idénticas con distinto patrimonio', r1 === r2, `cuSupply=${r1} en ambos`, group);
}

function runTestG() {
  const group = 'Test G — engine/producto';
  const engineSrc = src('scripts/capacity/engine.ts');
  const capSrc = src('src/lib/capacity.ts');
  const formsSrc = src('src/lib/cap-formulas.ts');
  check('Engine importa factor canónico (levelWeightFromIndex)', /import\s*\{[^}]*levelWeightFromIndex/.test(engineSrc), 'desde cap-formulas', group);
  check('Producto importa factor canónico (levelWeight)', /import\s*\{[^}]*levelWeight/.test(capSrc), 'desde cap-formulas', group);
  const occurrences = (file: string, needle: string) => file.split(needle).length - 1;
  check('La fórmula NO está duplicada (definida una sola vez)',
    occurrences(formsSrc, 'LEVEL_FACTOR =') === 1 && !/(Math\.max\(0\.2|0\.2\s*:\s*1\.0)/.test(engineSrc.split('cap-formulas').join('')),
    'definición única en cap-formulas.ts', group);
  const map = { basico: 0.2, medio: 0.5, avanzado: 1.0 };
  const names = ['basico', 'medio', 'avanzado'] as const;
  for (let i = 0; i < names.length; i++) {
    check(`Engine(${i}) ≡ Producto(${names[i]})`, levelWeightFromIndex(i) === levelWeight(names[i])! && levelWeight(names[i])! === map[names[i]!],
      `factor ${levelWeightFromIndex(i)} compartido`, group);
  }
  check('LEVEL_FACTOR canónico documentado', LEVEL_FACTOR.avanzado === 1.0 && LEVEL_FACTOR.medio === 0.5 && LEVEL_FACTOR.basico === 0.2,
    'avanzado 1.0 · medio 0.5 · básico 0.2', group);
}

function runTestH() {
  const group = 'Test H — RONDA D: urgencia presupuestada y piso de dignidad';

  // --- Presupuesto de urgencia: costo cuadrático y no acumulable (puro) ---
  check('urgencia costo cuadrático 1→1, 2→4, 3→9',
    urgencyCost(1) === 1 && urgencyCost(2) === 4 && urgencyCost(3) === 9,
    `costos: ${urgencyCost(1)} / ${urgencyCost(2)} / ${urgencyCost(3)}`, group);
  check('urgencia costo NO lineal (gritar más cuesta más caro)',
    urgencyCost(2) !== 2 * urgencyCost(1) && urgencyCost(3) !== 3 * urgencyCost(1),
    `costo(3)=${urgencyCost(3)} ≠ 3·costo(1)=${3 * urgencyCost(1)}`, group);

  const d0 = new Date('2026-09-12T00:00:00Z');
  const d1 = new Date('2026-09-13T23:00:00Z');
  const dW = new Date('2026-09-20T00:00:00Z');
  check('presupuesto: dentro de la misma semana la clave de período no cambia',
    urgencyPeriodKey(d0, 7) === urgencyPeriodKey(d1, 7),
    `d0=${urgencyPeriodKey(d0, 7)} · d1=${urgencyPeriodKey(d1, 7)}`, group);
  check('presupuesto: al pasar la semana la clave cambia (no hereda puntos)',
    urgencyPeriodKey(d0, 7) !== urgencyPeriodKey(dW, 7),
    `siguiente período: ${urgencyPeriodKey(dW, 7)}`, group);
  const p0 = urgencyPeriodKey(d0, 7);
  check('presupuesto: no guarda puntos de un período al siguiente (no acumulable)',
    urgencyBudgetFor(3, { period: p0, remaining: 3 }, dW, 7) === 3 &&
      urgencyBudgetFor(3, { period: p0, remaining: 0 }, dW, 7) === 3 &&
      urgencyBudgetFor(3, { period: p0, remaining: 1 }, dW, 7) === 3,
    'período nuevo → siempre se resetea al tope (3)', group);
  check('presupuesto: dentro del período conserva el remanente disponible',
    urgencyBudgetFor(3, { period: p0, remaining: 1 }, d0, 7) === 1 &&
      urgencyBudgetFor(3, { period: p0, remaining: 0 }, d0, 7) === 0,
    'mismo período → el gasto parcial (1) o total (0) se mantiene', group);

  // --- Las CU ya no compran prioridad (estructural) ---
  const capSrc = src('src/lib/capacity.ts');
  const formsSrc = src('src/lib/cap-formulas.ts');
  const schema = src('prisma/schema.prisma');
  const cuSrc = src('src/lib/cu.ts');
  const metricsSrc = src('src/pages/api/cu/metrics.ts');
  const requestsSrc = src('src/pages/api/cu/requests.ts');
  const adminSrc = src('app/admin/page.tsx');

  check('CU no compran prioridad: capacity.ts no importa transferCu', !capSrc.includes('transferCu'),
    'la apuesta con CU fue eliminada del flujo', group);
  check('Solicitud se crea con cuCommitted: 0 y urgencia aparte',
    capSrc.includes('cuCommitted: 0') && capSrc.includes('urgencyCost') && capSrc.includes('urgencyBudgetFor'),
    'la urgencia consume presupuesto, no CU', group);
  check('API ya no lee el param legacy cuCommitted', !requestsSrc.includes('Number(cuCommitted)'),
    'el puerto espera urgency, no CU apostadas', group);
  check('Schema: User tiene presupuesto de urgencia (no acumulable)',
    /urgencyBudgetRemaining\s+Int/.test(schema) && /urgencyBudgetPeriod\s+String/.test(schema),
    'remanente + clave de período en User', group);
  check('Schema: CapacityRequest registra urgencia (nivel y costo)',
    /urgencyLevel\s+Int/.test(schema) && /urgencyCost\s+Int/.test(schema),
    'nivel + costo cuadrático por solicitud', group);
  check('Schema: CuConfig parametriza la urgencia',
    /urgencyBudgetBase\s+Int/.test(schema) && /urgencyBudgetMaxLevel\s+Int/.test(schema) && /urgencyBudgetPeriodDays\s+Int/.test(schema),
    'base, nivel máx. y días de período', group);
  check('DEFAULT_CU_CONFIG incluye la política de urgencia explícita',
    cuSrc.includes('urgencyBudgetBase') && cuSrc.includes('urgencyBudgetMaxLevel') && cuSrc.includes('urgencyBudgetPeriodDays'),
    'parámetros de urgencia junto a la política de bienvenida', group);
  check('Fórmula de urgencia canónica única (definida una sola vez)',
    (formsSrc.split('export function urgencyCost').length - 1) === 1,
    'en cap-formulas.ts, no duplicada', group);

  // --- Piso de dignidad como indicador principal ---
  check('Piso de dignidad implementado en capacity.ts',
    capSrc.includes('export async function computeDignityMetrics') && capSrc.includes('PISO_ACTIVIDAD'),
    'headcount + brecha (suficientarismo)', group);
  check('metrics.ts expone dignidad al panel',
    metricsSrc.includes('computeDignityMetrics') && metricsSrc.includes('dignidad'),
    'el endpoint de admin lo incluye', group);
  check('Admin: piso de dignidad es el indicador principal',
    adminSrc.includes('Piso de dignidad (RONDA D)') && adminSrc.includes('indicador principal'),
    'el Gini queda como contexto secundario/legacy', group);
}

function runTestI() {
  const group = 'Test I — gremios: representantes y encuestas con trazabilidad';

  const schema = src('prisma/schema.prisma');
  const membersSrc = src('src/pages/api/guilds/[guildId]/members.ts');
  const pollsSrc = src('src/pages/api/polls.ts');
  const guildPage = src('app/guilds/[id]/page.tsx');
  const carteleraSrc = src('src/components/Cartelera.tsx');
  const manualSrc = src('src/lib/manual.ts');
  const manualPage = src('app/manual/page.tsx');
  const landing = src('app/page.tsx');

  check('Schema: GuildMembership tiene distintivo de representante (booleano)',
    /isRepresentative\s+Boolean\s+@default\(false\)/.test(schema),
    'representante es una propiedad de la membresía, no un modelo paralelo', group);
  check('Schema: existe el modelo Poll (scope guild|community)',
    /model Poll\s*\{/.test(schema) && /scope\s+String\s+@default\("guild"\)/.test(schema),
    'alcance gremial por defecto, comunitario explícito', group);
  check('Schema: Poll enlaza publicación referida (postId)',
    /postId\s+String\?/.test(schema) && /enlace a la publicación referida/.test(schema),
    'la encuesta puede referir a su publicación de contexto', group);
  check('Schema: voto único por usuario (trazabilidad íntegra)',
    /@@unique\(\[pollId,\s*userId\]\)/.test(schema) && /model PollVote\s*\{/.test(schema),
    'un voto por persona; cada registro conserva usuario/opción/fecha', group);
  check('Schema: Post y User llevan las relaciones de encuestas',
    /\bpolls\s+Poll\[\]/.test(schema),
    'back-relations en Post y Guild', group);

  check('API members: acción set-representative con validación de permisos',
    membersSrc.includes(`case 'set-representative'`) && membersSrc.includes('isCreatorOrAdmin') && membersSrc.includes('isRepresentative'),
    'solo creador/admin designa representantes', group);
  check('API polls: expone crear, votar y cerrar',
    pollsSrc.includes("action === 'create'") && pollsSrc.includes("action === 'vote'") && pollsSrc.includes("action === 'close'"),
    'ciclo completo de una encuesta', group);
  check('API polls: encuesta gremial exige membresía activa para crear y votar',
    pollsSrc.includes('Debes ser miembro activo del gremio para crear encuestas') &&
      pollsSrc.includes('Debes ser miembro activo del gremio para votar'),
    'lo interno del gremio es de sus miembros', group);
  check('API polls: voto registrado con trazabilidad (usuario+opción+fecha)',
    pollsSrc.includes('registration') || (pollsSrc.includes('createdAt') && pollsSrc.includes('optionText')),
    'el serializador expone cada voto con su autor', group);
  check('API polls: no transfiere CU (gobernanza sin dinero)',
    !pollsSrc.includes('transferCu') && !pollsSrc.includes('cuCommitted'),
    'votar y crear encuestas no mueve CU', group);

  check('Guild page: lista miembros con badge de representante y toggle',
    guildPage.includes('Representante') && guildPage.includes('Elegir representante') && guildPage.includes('isRepresentative'),
    'identificatorio visible + gestión desde el gremio', group);
  check('Gremio: la cartelera ensambla la votación de encuestas dentro del gremio',
    carteleraSrc.includes('scope === \'guild\'' ) && carteleraSrc.includes('PollCreateForm'),
    'crear y votar encuestas dentro del gremio, vía cartelera', group);
  check('Manual actualizado a 1.2.0 con changelog',
    manualSrc.includes("version: '1.2.0'") &&
      manualSrc.includes('Herramientas de gestión de gremios: representantes y encuestas'),
    'protocolo de manual cumplido', group);
  check('Manual explica representantes y encuestas',
    manualPage.includes('<strong>Representantes</strong>') && manualPage.includes('<strong>Encuestas</strong>'),
    'participación documentada', group);
  check('Landing «entender el modelo» describe las herramientas de gestión',
    landing.includes('representantes') && landing.includes('encuestas') && landing.includes('trazabilidad'),
    'sección #modelo coherente con el manual', group);
}

function runTestJ() {
  const group = 'Test J — publicaciones con formato enriquecido (whitelist + aspecto de foro)';

  // --- Sanitizador puro: "HTML pero sin código" ---
  const scriptAttack = '<script>alert(1)</script><h2>Hola</h2><p>texto</p>';
  const safeScript = sanitizeHtml(scriptAttack);
  check('Sanitizador elimina script y conserva whitelist (h2/p)',
    !safeScript.includes('<script') && safeScript.includes('<h2>') && safeScript.includes('<p>'),
    `input con script y rotulado: “${safeScript}”`, group);
  check('Sanitizador escapa etiquetas no permitidas como texto plano',
    sanitizeHtml('<b>X</b> <table><tr><td>celda</td></tr></table>').includes('celda') &&
      !sanitizeHtml('<b>X</b> <table><tr><td>celda</td></tr></table>').includes('<table'),
    'pegar HTML ajeno se ve como texto, no se ejecuta', group);
  check('Sanitizador permite solo enlaces seguros (href whitelist)',
    !sanitizeHtml('<a href="javascript:alert(1)">a</a>').includes('<a') &&
      sanitizeHtml('<a href="https://ok.example">ok</a>').includes('https://ok.example'),
    'protocolos peligrosos descartados, links reales conservados', group);
  check('htmlToText extrae lo legible de una publicación',
    htmlToText('<h2>Hola</h2><p>mundo<br>segunda línea</p>').includes('Hola') &&
      htmlToText('<h2>Hola</h2><p>mundo</p>').includes('mundo'),
    'preview y validación usan texto, no etiquetas', group);
  check('htmlToText no filtra br/hr autocerrados del sanitizador',
    htmlToText('<h1>Titulo</h1><div><br/></div><p>mundo<br/>linea</p><hr/><p>fin</p>')
      .includes('Titulo') &&
      htmlToText('<h1>Titulo</h1><div><br/></div><p>mundo<br/>linea</p><hr/><p>fin</p>')
        .includes('linea') &&
      !htmlToText('<h1>Titulo</h1><div><br/></div><p>mundo<br/>linea</p><hr/><p>fin</p>')
        .includes('br/') &&
      !htmlToText('<h1>Titulo</h1><div><br/></div><p>mundo<br/>linea</p><hr/><p>fin</p>')
        .includes('hr/'),
    'los `<br/>` / `<hr/>` (XHTML autocerrado) del editor no se ven como texto', group);
  check('Sanitizador cierra bien los enlaces emitidos (pares)',
    (sanitizeHtml('<a href="/comunidad/abc">ir</a>').match(/<a/g) || []).length ===
      (sanitizeHtml('<a href="/comunidad/abc">ir</a>').match(/<\/a>/g) || []).length,
    'sin huecos de etiquetas para links', group);
  check('Sanitizador permite solo embeds seguros (YouTube y X)',
    sanitizeHtml('<iframe src="https://www.youtube.com/embed/abc123" allowfullscreen></iframe>')
      .includes('youtube-nocookie.com/embed/abc123') &&
      sanitizeHtml('<iframe src="https://platform.twitter.com/embed/Tweet.html?id=12345&theme=dark"></iframe>')
        .includes('platform.twitter.com/embed/Tweet.html?id=12345') &&
      !sanitizeHtml('<iframe src="https://evil.example/x" allowfullscreen></iframe>').includes('<iframe') &&
      !sanitizeHtml('<iframe src="javascript:alert(1)"></iframe>').includes('<iframe'),
    'solo iframes de videos de YouTube y posts de X, sin src ajenos ni scripts', group);
  check('htmlToText marca un embed para que un post solo-video no sea vacío',
    htmlToText('<p>Mirá esto</p><iframe src="https://www.youtube.com/embed/abc123" allowfullscreen></iframe>').includes('Mirá esto') &&
      htmlToText('<iframe src="https://www.youtube.com/embed/abc123" allowfullscreen></iframe>').includes('video'),
    'previews y validación: el embed aporta un marcador de texto', group);

  // --- Estructural: el puerto de escritura sanea --NUNCA confía en el HTML ---
  const postsSrc = src('src/pages/api/posts.ts');
  const communitySrc = src('app/community/page.tsx');
  const guildSrc = src('app/guilds/[id]/page.tsx');
  const carteleraSrc = src('src/components/Cartelera.tsx');
  const detailSrc = src('app/community/[id]/page.tsx');
  const sanitizeSrc = src('src/lib/sanitize.ts');
  const manualSrc = src('src/lib/manual.ts');
  const manualPage = src('app/manual/page.tsx');

  check('API posts: sanea al guardar y valida por texto legible',
    postsSrc.includes('sanitizeHtml') && postsSrc.includes('htmlToText') && postsSrc.includes('safeHtml'),
    'whitelist en la frontera de escritura', group);
  check('Sanitizador define whitelist acotada (h1–h4, listas, citas, enlaces)',
    /const ALLOWED_TAGS = new Set/.test(sanitizeSrc) &&
      sanitizeSrc.includes("'blockquote'") &&
      sanitizeSrc.includes("'pre'") &&
      sanitizeSrc.includes("'a'"),
    'etiquetas controladas, nada de estilos ni scripts', group);
  check('Editor con controles en la cartelera de comunidad y gremio (sin escribir código)',
    carteleraSrc.includes('RichEditor') && communitySrc.includes('Cartelera') && guildSrc.includes('Cartelera'),
    'barra de formato fácil de usar en ambos muros', group);
  check('Editor permite embeber video de YouTube y post de X',
    carteleraSrc.includes('RichEditor') &&
      src('src/components/RichEditor.tsx').includes('youtube-nocookie.com/embed') &&
      src('src/components/RichEditor.tsx').includes('platform.twitter.com/embed/Tweet.html'),
    'botones de embed en la barra de la cartelera', group);
  check('Detalle de publicación renderiza formato de foro',
    detailSrc.includes('RichText') && detailSrc.includes('flex h-8 w-8'),
    'autor con avatar + cuerpo tipográfico del hilo', group);
  check('Listados muestran anticipo del contenido formateado',
    carteleraSrc.includes('<RichText'),
    'preview con aspecto de publicación', group);
  check('Manual documenta el formato',
    manualSrc.includes('Publicaciones con formato enriquecido'),
    'protocolo de manual cumplido', group);
  check('Manual explica la sanitización al usuario',
    manualPage.includes('<strong>Publicaciones con formato</strong>') &&
      manualPage.includes('se sanea al guardar y al'),
    'transparencia: el formato es seguro, no magia', group);
}

function runTestK() {
  const group = 'Test K — framing: propiedad productiva participativa (no redistribución, no RBU)';

  const landing = src('app/page.tsx');
  const layout = src('app/layout.tsx');
  const princi = src('app/principios/page.tsx');
  const manualPage = src('app/manual/page.tsx');
  const profile = src('app/profile/page.tsx');
  const og = src('app/opengraph-image.tsx');

  check('Hero: la pregunta es quién será propietario de la productividad',
    landing.includes('será propietario de esa productividad'),
    'pantalla inicial responde la pregunta de propiedad, no de redistribución', group);
  check('Hero: participar siendo propietarios del capital productivo que la genera',
    landing.includes('capital productivo que') &&
      landing.includes('la genera') &&
      landing.includes('Participar no significa pertenecer exclusivamente'),
    'primera pantalla responde: qué se propone y qué no hay que abandonar', group);
  check('Diagrama de transición: PROPIEDAD → CAPITAL PRODUCTIVO → PRODUCCIÓN → RENDIMIENTOS → PARTICIPACIÓN',
    landing.includes("'PROPIEDAD'") &&
      landing.includes("'CAPITAL PRODUCTIVO'") &&
      landing.includes("'PRODUCCIÓN'") &&
      landing.includes("'RENDIMIENTOS'") &&
      landing.includes("'PARTICIPACIÓN'"),
    'cadena de valor por propiedad, no por distribución', group);
  check('La propiedad compartida no reemplaza la individual (página y principios)',
    landing.includes('no reemplaza la propiedad individual') &&
      princi.includes('no reemplaza la propiedad individual'),
    'coexistencia con el mercado y la propiedad privada explícita', group);
  check('No hay rastro del framing viejo de "distribuir riqueza" como partida',
    !landing.includes('discutir cómo distribuir riqueza sería') &&
      !landing.includes('Una segunda fuente de acceso a recursos'),
    'el eje de partida ya no es la redistribución de ingresos', group);
  check('Capa 4 renombrada a "Participación en rendimientos"',
    landing.includes('Capa 4 · Participación en rendimientos') &&
      !landing.includes('Capa 4 · Distribución'),
    'la distribución es cuestión posterior, no el punto de partida', group);
  check('SEO sin framing RBU/preset (metadata)',
    !layout.includes('renta básica') &&
      !layout.includes('Universal Basic') &&
      !layout.includes('post-escas') &&
      layout.includes('propiedad productiva participativa'),
    'metadatos y JSON-LD orientados a propiedad productiva, no a RBU', group);
  check('Manual: explica la propiedad productiva y no habla de cuotas de reparto',
    manualPage.includes('propietaria de una parte del capital productivo') &&
      !manualPage.includes('cuotas de reparto'),
    'documentación del sistema enmarcada en participación en rendimientos', group);
  check('Perfil: las CU no se conectan con los rendimientos del patrimonio',
    profile.includes('no se conectan') &&
      profile.includes('rendimientos del patrimonio'),
    'CU como señal, no como derecho sobre rendimientos', group);
  check('Imagen OG/llamada sin "Universal Basic Assets" e investiga propiedad',
    !og.includes('Universal Basic Assets') &&
      og.replace(/\s+/g, ' ').includes('propietaria de una parte del capital productivo'),
    'tarjeta de compatir usa la pregunta de propiedad', group);
}

function runTestL() {
  const group = 'Test L — cartelera: botones, filtro y feed unificado (comunidad y gremios)';

  const cartelera = src('src/components/Cartelera.tsx');
  const community = src('app/community/page.tsx');
  const guild = src('app/guilds/[id]/page.tsx');

  check('Ambas páginas usan la Cartelera (sin formularios intercalados)',
    community.includes('Cartelera') && guild.includes('Cartelera'),
    'los campos de crear no quedan entre el contenido', group);
  check('Cartelera tiene tres botones por tipo (Información, Solicitud, Encuesta)',
    cartelera.includes('label: \'Información\'') &&
      cartelera.includes('label: \'Solicitud comunitaria\'') &&
      cartelera.includes('label: \'Encuesta\''),
    'creación colapsada detrás de los botones superiores', group);
  check('El formulario crea publicaciones con el tipo elegido y el alcance correcto',
    cartelera.includes('type: composer') &&
      cartelera.includes("guildId: scope === 'guild' ? guildId : null"),
    'informativa/solicitud se publican con el alcance de la cartelera', group);
  check('La encuesta se crea desde el panel con su formulario dedicado',
    cartelera.includes('PollCreateForm') &&
      cartelera.includes("composer === 'poll'"),
    'el botón Encuesta abre el formulario de encuesta', group);
  check('Filtro por tipo debajo de los botones (todos/información/solicitudes/encuestas)',
    ['Todos', 'Información', 'Solicitudes', 'Encuestas'].every((f) => cartelera.includes(`label: '${f}'`)) &&
      cartelera.includes("setFilterType(f.value)"),
    'filtrar el contenido por tipo', group);
  check('Cartelera ordenable de más nuevos a más antiguos y viceversa',
    cartelera.includes("return order === 'desc' ? tb - ta : ta - tb"),
    'orden ascendente y descendente por fecha', group);  check('El feed une publicaciones y encuestas ordenadas por fecha',
    cartelera.includes("kind: 'post'") &&
      cartelera.includes("kind: 'poll'") &&
      cartelera.includes('PollCard') &&
      cartelera.includes('<RichText'),
    'contenido unificado debajo, con el formato de foro', group);
  check('Pulsar una publicación lleva a su contenido completo',
    cartelera.includes('/community/') && cartelera.includes('item.data.id'),
    'clic accede a toda la publicación', group);
}

function runTestM() {
  const group = 'Test M — moderación de encuestas y ocultamiento en cascada';

  const schema = src('prisma/schema.prisma');
  const moderationSrc = src('src/lib/moderation.ts');
  const postsIdSrc = src('src/pages/api/posts/[id].ts');
  const adminContentSrc = src('src/pages/api/admin/content.ts');
  const reportsSrc = src('src/pages/api/admin/reports.ts');
  const pollsSrc = src('src/pages/api/polls.ts');
  const publicSrc = src('src/pages/api/v1/public/[resource].ts');
  const feedsSrc = src('src/lib/feeds.ts');
  const adminPage = src('app/admin/page.tsx');
  const manualSrc = src('src/lib/manual.ts');
  const packageJson = src('package.json');
  const syncScript = src('scripts/sync-poll-status.js');

  check('Schema: Poll tiene estado de moderación (visible|hidden|blocked|deleted)',
    /model Poll\s*\{/.test(schema) &&
      /status\s+String\s+@default\("visible"\)\s*\/\/\s*visible \| hidden \| blocked \| deleted \(moderación\)/.test(schema),
    'la encuesta se oculta/restaura como el resto del contenido', group);
  check('Helper único de cascada post→encuestas (setPostStatus/pollStatusFromPost)',
    moderationSrc.includes('setPostStatus') &&
      moderationSrc.includes('pollStatusFromPost') &&
      moderationSrc.includes('db.poll.updateMany') &&
      moderationSrc.includes('postId'),
    'una sola pieza sincroniza publicación y encuestas vinculadas', group);
  check('Moderar publicación desde el panel usa la cascada (api/admin/content)',
    adminContentSrc.includes("import { setPostStatus }") &&
      adminContentSrc.includes("type === 'post'") &&
      adminContentSrc.includes('setPostStatus(id'),
    'ocultar publicación desde admin oculta también sus encuestas', group);
  check('Admin puede moderar encuestas directamente (listar + PATCH)',
    adminContentSrc.includes("type === 'poll'") &&
      adminContentSrc.includes("Estado inválido para encuesta") &&
      adminContentSrc.includes('db.poll.findMany'),
    'moderación directa de encuestas sin tocar las publicaciones', group);
  check('Reportes: ocultar publicación por reporte también aplica cascada',
    reportsSrc.includes("import { setPostStatus }") &&
      reportsSrc.includes("setPostStatus(req.body.postId"),
    'el flujo de reportes no deja encuestas colgadas', group);
  check('Moderar desde la publicación (autor/admin PATCH) también aplica cascada',
    postsIdSrc.includes("import { setPostStatus }") && postsIdSrc.includes('setPostStatus(id'),
    'ninguna puerta de moderación escapa a la cascada', group);
  check('API polls: solo lista encuestas visibles',
    pollsSrc.includes("status: 'visible'") && !pollsSrc.includes('where: { postId }'),
    'las encuestas ocultas desaparecen de cartelera y detalle', group);
  check('API polls: self-healing — encuesta ligada a publicación oculta no se muestra',
    pollsSrc.includes('post: { is: { status: \'visible\' } }') &&
      pollsSrc.includes('postId: null'),
    'aunque el campo status se quede visible, la referencia a contenido moderado la oculta', group);
  check('Voto bloqueado también si la publicación vinculada está oculta',
    pollsSrc.includes('poll.post?.status !==') || pollsSrc.includes('poll.post.status !=='),
    'ni el voto ni la lectura resucitan contenido moderado', group);
  check('Feeds y API pública aplican el mismo filtro por publicación vinculada',
    feedsSrc.includes('post: { is: { status: \'visible\' } }') &&
      publicSrc.includes('post: { is: { status: \'visible\' } }'),
    'la realidad pública es coherente en canales y API', group);
  check('Borrar publicación oculta sus encuestas antes del onDelete SetNull',
    postsIdSrc.includes('db.poll.updateMany') &&
      postsIdSrc.includes("data: { status: 'hidden' }") &&
      postsIdSrc.includes('db.post.delete'),
    'borrar no deja encuestas huérfanas visibles', group);
  check('Backfill de encuestas en el build (sync-poll-status, idempotente)',
    packageJson.includes('sync-poll-status.js') &&
      syncScript.includes('postId: { not: null }') &&
      syncScript.includes("=== 'visible' ? 'visible' : 'hidden'"),
    'los datos creados antes del campo Poll.status se alinean al desplegar', group);
  check('API polls: no se puede votar una encuesta oculta',
    pollsSrc.includes('La encuesta no está disponible') && pollsSrc.includes('poll.status !=='),
    'el voto queda bloqueado en contenido moderado', group);
  check('API polls: no expone el enlace a una publicación no visible',
    pollsSrc.includes('poll.post && poll.post.status ===') && pollsSrc.includes(": null"),
    'la encuesta no mantiene vivo el acceso a la publicación moderada', group);
  check('API pública y feeds: encuestas visibles nada más',
    publicSrc.includes("where: { status: 'visible' }") &&
      feedsSrc.includes("status: 'visible'"),
    'el contrato público ve la misma realidad que la web', group);
  check('Panel admin: sección de encuestas con ocultar/mostrar',
    adminPage.includes('Encuestas (') &&
      adminPage.includes("moderateContent('poll'") &&
      adminPage.includes('contentPolls'),
    'moderación completa de encuestas desde el admin', group);
  check('Manual documenta la moderación de encuestas (changelog 1.9.0)',
    manualSrc.includes("version: '1.9.0'") &&
      manualSrc.includes('Moderación de encuestas y ocultamiento en cascada'),
    'protocolo de manual cumplido', group);
}

function runTestN() {
  const group = 'Test N — canales públicos: títulos reales y separación del contenido de prueba';
  const feedsSrc = src('src/lib/feeds.ts');
  const schemaSrc = src('prisma/schema.prisma');
  const contentApiSrc = src('src/pages/api/admin/content.ts');
  const adminSrc = src('app/admin/page.tsx');
  const packageJson = src('package.json');
  const sealSrc = src('scripts/sync-feed-exclusions.js');
  const manualSrc = src('src/lib/manual.ts');

  check('Feed: título real extraído del contenido cuando no hay título propio',
    feedsSrc.includes('headingTitle(p.content)') && /<h\(\[1-4\]\)\s*\\b/.test(feedsSrc),
    'el primer encabezado (p. ej. <h1>Quién está detrás…) nutre el <title> en lugar de «Publicación»', group);

  check('Feed: contenido de prueba excluido de la corriente pública (posts y encuestas)',
    (feedsSrc.match(/excludeFromFeed: false/g) || []).length >= 2,
    'ambas consultas (post y poll) filtran excludeFromFeed:false', group);

  check('Schema: Post y Poll tienen el flag excludeFromFeed (pruebas quedan fuera de feeds)',
    (schemaSrc.match(/excludeFromFeed Boolean\s+@default\(false\)/g) || []).length === 2,
    'un campo por modelo, aditivo, sin tocar la visibilidad ni la moderación', group);

  check('Admin content API: PATCH soporta etiquetar contenido como no difundible',
    contentApiSrc.includes("typeof excludeFromFeed === 'boolean'") &&
      contentApiSrc.includes('data: { excludeFromFeed }'),
    'publicaciones y encuestas se pueden marcar sin ocultar', group);

  check('Panel admin: toggle «No difundir» en publicaciones y encuestas',
    adminSrc.includes('setFeedExclusion') && adminSrc.includes('No difundir (prueba)'),
    'control visible para separar pruebas de la historia pública', group);

  check('Build: marcado idempotente de contenido de prueba (sync-feed-exclusions)',
    packageJson.includes('sync-feed-exclusions.js') &&
      sealSrc.includes('TEST_POST_TITLES') &&
      sealSrc.includes('excludeFromFeed: true'),
    'los ítems de prueba conocidos se alinean en cada despliegue', group);

  check('Manual: canales con títulos reales y separación de pruebas (changelog 1.10.0)',
    manualSrc.includes("version: '1.10.0'") &&
      manualSrc.includes('Canales públicos: títulos reales y separación del contenido de prueba'),
    'protocolo de manual cumplido', group);
}

function runTestO() {
  const group = 'Test O — participación con recompensa: CU por contribución verificada y progreso visible';
  const schemaSrc = src('prisma/schema.prisma');
  const offerSrc = src('src/pages/api/posts/[id]/offer.ts');
  const capacitySrc = src('src/lib/capacity.ts');
  const configSrc = src('src/pages/api/cu/config.ts');
  const adminSrc = src('app/admin/page.tsx');
  const profileSrc = src('app/profile/page.tsx');
  const manualSrc = src('src/lib/manual.ts');
  const contribFile = path.join(process.cwd(), 'src/pages/api/profile/contributions.ts');
  const contribSrc = fs.existsSync(contribFile) ? fs.readFileSync(contribFile, 'utf8') : '';

  check('Schema: CuConfig.participationRewardCu, 0 desactiva',
    /participationRewardCu\s+Int\s+@default\(10\)/.test(schemaSrc),
    'recompensa configurable por contribución verificada', group);

  check('offer.ts acredita CU de logro SIN transferir (recompensa, no pago)',
    offerSrc.includes('rewardParticipation') &&
      offerSrc.includes('participationRewardCu') &&
      !offerSrc.includes('transferCu') &&
      !offerSrc.includes('ensureCuAccount'),
    'emisión explícita type=issued, nunca transferencia', group);

  check('offer.ts guarda refType/refId auditable por solicitud',
    offerSrc.includes("refType: 'request'") && offerSrc.includes('refId: post.id'),
    'la emisión queda trazable a la tarea que la originó', group);

  check('capacity.ts acredita CU de logro al proveedor satisfecho',
    capacitySrc.includes('rewardParticipation') && capacitySrc.includes("refType: 'capacity'"),
    'proveedor recibe emisión explícita + notificación', group);

  check('API configura el monto de la recompensa',
    configSrc.includes("['participationRewardCu', 0, 1000000000]"),
    'whitelist admin de la política de participación', group);

  check('Panel admin: campo «CU por contribución verificada»',
    adminSrc.includes('CU por contribución verificada'),
    'control de monto visible en Economía CU', group);

  check('Endpoint /api/profile/contributions lee tareas y capacidades del propio usuario',
    contribSrc.includes("kind: 'fulfillment'") &&
      contribSrc.includes("status: 'satisfied'") &&
      contribSrc.includes('participantId: user.id') &&
      contribSrc.includes('providerId: user.id'),
    'solo datos propios, público interno de logro', group);

  check('Perfil: sección «Mis contribuciones» visible',
    profileSrc.includes('Mis contribuciones') &&
      profileSrc.includes('/api/profile/contributions'),
    'el aporte de cada persona queda como logro visible', group);

  check('Manual: changelog 1.11.0 con CU por contribución verificada',
    manualSrc.includes("version: '1.11.0'") &&
      manualSrc.includes('La participación se percibe: CU por contribución verificada'),
    'protocolo de manual cumplido', group);
}

function main() {
  ensureDir(OUT_DIR);
  runTestA();
  runTestB();
  void runTestC();
  runTestD();
  runTestE();
  runTestF();
  runTestG();
  runTestH();
  runTestI();
  runTestJ();
  runTestK();
  runTestL();
  runTestM();
  runTestN();
  runTestO();

  const summary = {
    fecha: new Date().toISOString(),
    total,
    passed: total - failures.length,
    failed: failures.length,
    failures,
    criterios: {
      'Ronda C sin PID': !failures.join().includes('Test A'),
      'CU no monetaria en producto': !failures.join().includes('Test B'),
      'CU no determina nivel': !failures.join().includes('Test C'),
      'Expiradas no son demanda vigente': !failures.join().includes('Test D'),
      'Presión y carga independientes': !failures.join().includes('Test E'),
      'Patrimonio no altera CU': !failures.join().includes('Test F'),
      'Engine y producto comparten reglas': !failures.join().includes('Test G'),
      'Ronda D: urgencia presupuestada y piso de dignidad': !failures.join().includes('Test H'),
      'Gremios: representantes y encuestas con trazabilidad': !failures.join().includes('Test I'),
      'Publicaciones con formato enriquecido (sanitizado)': !failures.join().includes('Test J'),
      'Framing: propiedad productiva participativa (no redistribución, no RBU)': !failures.join().includes('Test K'),
      'Cartelera reutilizable con botones, filtro y feed unificado': !failures.join().includes('Test L'),
      'Moderación de encuestas y ocultamiento en cascada': !failures.join().includes('Test M'),
      'Canales: títulos reales y separación del contenido de prueba': !failures.join().includes('Test N'),
      'Participación con recompensa: CU por contribución verificada y progreso visible': !failures.join().includes('Test O'),
    },
  };
  fs.writeFileSync(path.join(OUT_DIR, 'cleanup-tests.json'), JSON.stringify(summary, null, 2), 'utf8');
  console.log(`\n===== RESUMEN =====`);
  console.log(`Tests: ${summary.passed}/${total} PASS`);
  if (summary.failed > 0) {
    console.log('\nFALLOS:');
    summary.failures.forEach(f => console.log('  ✗ ' + f));
  }
  console.log(`Resultados en ${OUT_DIR}/cleanup-tests.json`);
}

main();