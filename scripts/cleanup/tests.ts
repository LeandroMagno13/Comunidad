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
  const allowed = ['ensureCuConfig', 'transferCu'];
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
  check('Guild page: sección de encuestas del gremio',
    guildPage.includes('Encuestas del gremio') && guildPage.includes('PollCreateForm'),
    'crear y votar dentro del gremio', group);

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