import { db } from '@/src/lib/db';

// ============================================================================
// ECONOMÍA CU — MODELO EXPERIMENTAL (Capa 2)
//
// Un CU es una unidad interna de participación / "stamina" de la comunidad.
// NO es dinero, moneda, activo, acción, dividendo, deuda, inversión ni
// representación del patrimonio. NO existe conversión CU ↔ ARS/USD/cripto.
//
// ⚠️ LEGACY / NO USAR PARA REGULACIÓN EN PRODUCCIÓN (Lee.txt, limpieza RONDA C):
//   - El PID, senseCanasta, effectiveCuSetPoint, evaluateSupplyPolicy,
//     computeNewUserGrant/getNewUserGrant y getCuMetrics conservan la historia
//     experimental y la pizarra de diagnóstico, PERO NO GOBIERNAN la oferta
//     (write-only en simulación) y NO pueden modificar saldos ni emitir CU.
//   - RONDA C (src/lib/capacity.ts) no importa NINGUNA función de control de
//     este archivo salvo ensureCuConfig (parámetros) y transferCu (apuesta).
//   - El grant de bienvenida usa welcomeGrant() (src/lib/cap-formulas.ts),
//     política explícita e independiente del PID.
//
// Modelo de control (histórico, solo diagnóstico):
//   MEDICIÓN → COMPARAR (error) → PID → SEÑAL DE CORRECCIÓN → POLÍTICA DE
//   OFERTA (SupplyPolicy) → EMISIÓN / NO EMISIÓN / AJUSTE → NUEVA MEDICIÓN
//
// El PID NO determina cuánto vale una CU ni cuánto merece alguien: solamente
// regula la OFERTA RELATIVA de CU para acercar el costo de la canasta
// representativa a su set point.
//
// Principios (según Lee.txt):
//   - La señal del PID no es una emisión automática. La política decide.
//   - Toda regla económica aún hipotética queda PARAMETRIZADA y etiquetada
//     como experimental. Nunca se inventan reglas económicas definitivas.
//   - El patrimonio real y la economía CU son dos capas independientes.
//   - Los ajustes sobre saldos históricos son auditablemente separados del PID
//     y nunca confiscatorios por defecto.
//   - Mantra: MEDIR → COMPARAR → CORREGIR → VOLVER A MEDIR.
// ============================================================================

export const CU_CONFIG_ID = 'singleton';

export const DEFAULT_CU_CONFIG = {
  kp: 0.5,
  ki: 0.1,
  kd: 0.05,
  outputMin: -100,
  outputMax: 100,
  periodDays: 30,
  milestoneCu: 100,
  newUserGrantEnabled: true, // política de bienvenida: configurable, NO una emisión fija
  newUserGrantCu: 20, // cantidad "base" en equilibrio (puede ser 0)
  newUserSensitivity: 1, // cuán fuerte se reduce/aumenta la asignación según escasez/abundancia
  // Capa SupplyPolicy: la señal PID NO es emisión. La política decide.
  // v2 (control real): ganancias activas por defecto → la política actúa sobre la señal.
  expansionGain: 1, // apertura de la válvula de expansión (0 = la política no emite automáticamente)
  contractionGain: 1, // apertura de la válvula de contracción (quema proporcional ante abundancia)
  reserveShare: 0.3,
  newUserShare: 0.5,
  historicalShare: 0.2,
  maxEmissionPerCycle: 1000, // límite anti-shock de emisión absoluto por ciclo
  maxBurnPerCycle: 200, // límite anti-shock de contracción (quema) por ciclo
  // Sensor y variable de control (v2):
  accessTarget: 0.5, // fracción objetivo de cuentas que pueden acceder a la canasta
  reachableSetPoint: true, // el set point efectivo se ancla a la distribución (alcanzable, no inalcanzable)
  sensorFlowGain: 0.5, // sensibilidad del sensor al flujo neto (consumo − emisión)/oferta
  sensorAccessGain: 0.6, // sensibilidad del sensor a la brecha acceso-objetivo
  // Ajustes históricos: deshabilitados por defecto; registrados y auditables.
  adjustmentEnabled: false,
  adjustmentMode: 'none', // none | flat | proportional | manual
  adjustmentCap: 0, // si > 0, límite de |CU| por ajuste por usuario y por evento
  enabled: true,
};

export const DEFAULT_BASKET = {
  name: 'Canasta comunitaria experimental',
  description:
    'Conjunto representativo de aportes que la comunidad valora intercambiar. ' +
    'El "costo" observado de esta canasta se compara contra el set point para regular la oferta de CU.',
  targetCu: 100, // set point
  observedCu: 100, // valor observado (ver observedMethod)
  observedMethod: 'manual', // metodología del "sensor": manual | auto (TODO parametrizable)
  periodDays: 30,
  items: [
    { name: 'Diseño y desarrollo de software', weight: 0.3 },
    { name: 'Consultoría legal y administrativa', weight: 0.2 },
    { name: 'Capacitación / mentoría', weight: 0.2 },
    { name: 'Organización de eventos y logística', weight: 0.1 },
    { name: 'Ayuda técnica y soporte', weight: 0.2 },
  ],
};

function round2(v: number) {
  return Math.round(v * 100) / 100;
}

// ---------------------------------------------------------------------------
// Garantías de objetos base (idempotentes, sin lógica económica inventada).
// ---------------------------------------------------------------------------

export async function ensureCuConfig() {
  const existing = await db.cuConfig.findUnique({ where: { id: CU_CONFIG_ID } });
  if (!existing) return db.cuConfig.create({ data: { id: CU_CONFIG_ID, ...DEFAULT_CU_CONFIG } });
  // Migración v2 (control real): la política legada tenía ganancias 0 (inerte).
  // Solo se actualiza el valor "default de fábrica" 0; un 0 intencional posterior se respeta.
  if (existing.expansionGain === 0 && existing.contractionGain === 0) {
    console.warn('[cu] v2: política activada (expansionGain/contractionGain 0 → 1) — migración de control real');
    return db.cuConfig.update({
      where: { id: CU_CONFIG_ID },
      data: { expansionGain: DEFAULT_CU_CONFIG.expansionGain, contractionGain: DEFAULT_CU_CONFIG.contractionGain },
    });
  }
  return existing;
}

export async function ensureCuBasket() {
  const existing = await db.cuBasket.findFirst();
  if (existing) return existing;
  return db.cuBasket.create({
    data: {
      name: DEFAULT_BASKET.name,
      description: DEFAULT_BASKET.description,
      targetCu: DEFAULT_BASKET.targetCu,
      observedCu: DEFAULT_BASKET.observedCu,
      observedMethod: DEFAULT_BASKET.observedMethod,
      periodDays: DEFAULT_BASKET.periodDays,
      items: { create: DEFAULT_BASKET.items },
    },
    include: { items: true },
  });
}

export async function ensureCuAccount(userId: string) {
  const existing = await db.cuAccount.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.cuAccount.create({
    data: { userId },
  });
}

// ---------------------------------------------------------------------------
// Controlador PID (lazo cerrado sobre la canasta representativa).
//   error = valorObservado(canasta) - setPoint(canasta)
//   El PID produce una SEÑAL de corrección, no una cantidad de CU a emitir.
//   señal positiva => indicación de expansión de la oferta (escasez relativa).
//   señal negativa => indicación de contracción de la oferta (abundancia).
// ---------------------------------------------------------------------------

export interface PidParams {
  kp: number;
  ki: number;
  kd: number;
  outputMin: number;
  outputMax: number;
}

export class PidController {
  private kp: number;
  private ki: number;
  private kd: number;
  private outputMin: number;
  private outputMax: number;
  private integral = 0;
  private prevError = 0;
  readonly timestamp: number;

  constructor({ kp, ki, kd, outputMin, outputMax }: PidParams) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
    this.outputMin = outputMin;
    this.outputMax = outputMax;
    this.timestamp = Date.now();
  }

  update(measured: number, setPoint: number): number {
    const error = measured - setPoint;
    // anti-windup: saturar la integral ANTES de que la salida se sature
    const maxIntegral = (this.outputMax - this.kp * error) / Math.max(this.ki, 1e-9);
    const minIntegral = (this.outputMin - this.kp * error) / Math.max(this.ki, 1e-9);
    this.integral = Math.min(
      Math.max(this.integral + error, Math.min(minIntegral, maxIntegral)),
      Math.max(minIntegral, maxIntegral)
    );
    const derivative = error - this.prevError;
    this.prevError = error;
    const raw = this.kp * error + this.ki * this.integral + this.kd * derivative;
    return Math.min(Math.max(raw, this.outputMin), this.outputMax);
  }
}

// ---------------------------------------------------------------------------
// POLÍTICA DE OFERTA (SupplyPolicy) — capa independiente del PID.
//
// v2 (control real): la política NO ajusta una "emisión base" por inercia.
// Convierte la señal del PID en una APERTURA DE VÁLVULA suave (tanh), acotada
// por el tope anti-shock y por la escala de la oferta actual (≤ 20% por ciclo):
//   - señal claramente positiva  → expansión: emite CU (va mulada por cuotas).
//   - señal claramente negativa  → contracción: quema CU proporcional a saldos.
//   - señal ≈ 0                  → neutral: no inventa emisión (→ baseEmission).
// La emisión NUNCA depende de una base fija no señalada (anti-inercia).
// ---------------------------------------------------------------------------

export interface SupplyPolicyInputs {
  expansionGain: number;
  contractionGain: number;
  reserveShare: number;
  newUserShare: number;
  historicalShare: number;
  maxEmissionPerCycle: number;
  maxBurnPerCycle?: number;
  supply?: number; // oferta actual (para acotar la emisión por escala)
}

export interface SupplyPolicyDecision {
  phase: 'expansion' | 'neutral' | 'contraction';
  signal: number;
  emission: number; // decisión de la política (no la señal del PID)
  burn: number; // quema decidida por la política (0 = sin contracción)
  newUserAllocation: number; // CU disponibles para nuevos usuarios (esta señal)
  allocation: { reserve: number; newUsers: number; historical: number };
}

export function evaluateSupplyPolicy(
  inputs: SupplyPolicyInputs,
  signal: number,
  baseEmission: number
): SupplyPolicyDecision {
  const outMax = 100;
  const valve = Math.tanh((2 * signal) / Math.max(outMax, 1e-9)); // [-1, 1]
  const phase = valve > 1e-4 ? 'expansion' : valve < -1e-4 ? 'contraction' : 'neutral';
  const maxEmission = inputs.maxEmissionPerCycle > 0 ? inputs.maxEmissionPerCycle : 1e9;
  // tope relativo a la escala de la economía actual (anti-hiperinflación, permite sostener acceso)
  const supplyCap = inputs.supply != null && inputs.supply > 0 ? Math.round(inputs.supply * 0.5) : maxEmission;
  const maxBurn = inputs.maxBurnPerCycle && inputs.maxBurnPerCycle > 0 ? inputs.maxBurnPerCycle : 0;

  let emission = baseEmission;
  let burn = 0;
  if (phase === 'expansion') {
    const gain = Math.max(inputs.expansionGain, 1e-6);
    emission = Math.round(Math.tanh(Math.abs(valve) * gain) * Math.min(maxEmission, supplyCap));
  } else if (phase === 'contraction') {
    emission = 0; // la política corta la emisión antes de quemar
    if (maxBurn > 0) {
      const gain = Math.max(inputs.contractionGain, 1e-6);
      burn = Math.round(Math.tanh(Math.abs(valve) * gain) * Math.min(maxBurn, supplyCap));
    }
  }
  emission = Math.min(Math.max(0, emission), maxEmission);
  burn = Math.min(Math.max(0, burn), maxBurn);
  const allocation = {
    reserve: emission * inputs.reserveShare,
    newUsers: emission * inputs.newUserShare,
    historical: emission * inputs.historicalShare,
  };
  return {
    phase,
    signal: round2(signal),
    emission: round2(emission),
    burn: round2(burn),
    newUserAllocation: round2(allocation.newUsers),
    allocation: {
      reserve: round2(allocation.reserve),
      newUsers: round2(allocation.newUsers),
      historical: round2(allocation.historical),
    },
  };
}

// ---------------------------------------------------------------------------
// SENSOR v2 — descubrimiento de precio alcanzable (control real).
//
// v1 era un sensor CIEGO: observado anclado al sticker inicial con ganancia 0,1,
// sin importar cuántos podían acceder. v2 integra dos presiones:
//   1) flujo neto  (consumo − CU que entran)/oferta  → presión de mercado;
//   2) desvío hacia el set point EFECTIVO (alcanzable) → la canasta se acerca
//      al nivel que la distribución puede sostener (descubrimiento de precio).
// Ambos términos acotados por paso máximo → sin factor huyente ni oscilaciones.
// ---------------------------------------------------------------------------
export interface SensorOptions {
  observed: number;
  supply: number;
  consumed: number;
  suppliedIn: number; // CU que entraron a la oferta durante el ciclo (emisión + grants + inyecciones)
  effectiveSetPoint: number; // set point efectivo hacia el que converge la percepción
  sensorFlowGain: number;
  sensorAccessGain: number;
  maxStep?: number; // variación máxima de percepción por ciclo (default 0.3)
  minObserved?: number;
}

export function clamp01(v: number) {
  return Math.min(Math.max(v, 0), 1);
}

export function senseCanasta(o: SensorOptions): number {
  const maxStep = o.maxStep ?? 0.3;
  const supply = Math.max(1, o.supply);
  const eff = Math.max(o.effectiveSetPoint, 1e-9);
  const flowNet = (o.consumed - o.suppliedIn) / supply; // consumo sube presión; emisión la baja
  const pricePull = (eff - o.observed) / eff; // observado sobre el set point → delta negativo (baja)
  const delta = Math.min(
    Math.max(o.sensorFlowGain * flowNet + o.sensorAccessGain * pricePull, -maxStep),
    maxStep
  );
  const min = o.minObserved ?? 1;
  return Math.max(min, o.observed * (1 + delta));
}

// Set point EFECTIVO alcanzable: si reachable, la meta se ancla a la distribución
// (mediana) para que el precio NUNCA pida más de lo que la comunidad sostiene.
export function effectiveCuSetPoint(nominal: number, medianBalance: number, reachable: boolean): number {
  if (!reachable) return Math.max(1, nominal);
  const derived = Math.max(5, medianBalance);
  return Math.max(5, Math.min(nominal, derived));
}

// ---------------------------------------------------------------------------
// Operaciones contables (todo queda auditado en CuTransaction).
// ---------------------------------------------------------------------------

async function createNotification(userId: string, title: string, content: string, link?: string) {
  await db.notification.create({
    data: { userId, type: 'cu', title, content, link },
  });
}

async function checkMilestone(userId: string) {
  const [config, account] = await Promise.all([ensureCuConfig(), ensureCuAccount(userId)]);
  if (account.balance >= config.milestoneCu && !account.milestoneReachedAt) {
    await db.cuAccount.update({
      where: { id: account.id },
      data: { milestoneReachedAt: new Date() },
    });
    await createNotification(
      userId,
      `¡Felicidades! Alcanzaste ${account.balance} CU`,
      'Llegaste al saldo que el modelo marcó como meta en esta etapa. Recordá: las CU ' +
        'todavía no son dinero — son una unidad interna de participación. Algún día, según ' +
        'las políticas de distribución que definamos, podrían acompañarse de recursos reales. ' +
        'Seguí participando.',
      '/profile'
    );
  }
}

export async function issueCu(toUserId: string, amount: number, description: string, ref?: { refType?: string; refId?: string }) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('La cantidad de CU debe ser un entero positivo');
  }
  const account = await ensureCuAccount(toUserId);
  const updated = await db.cuAccount.update({
    where: { id: account.id },
    data: { balance: { increment: amount }, totalIssued: { increment: amount } },
  });
  await db.cuTransaction.create({
    data: {
      type: 'issued',
      amount,
      toUserId,
      description,
      refType: ref?.refType,
      refId: ref?.refId,
    },
  });
  await checkMilestone(toUserId);
  return updated;
}

export async function transferCu(fromUserId: string, toUserId: string, amount: number, description: string, ref?: { refType?: string; refId?: string }) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('La cantidad de CU debe ser un entero positivo');
  }
  const from = await ensureCuAccount(fromUserId);
  if (from.balance < amount) {
    throw new Error('Saldo de CU insuficiente para realizar la transferencia');
  }
  const to = await ensureCuAccount(toUserId);
  await db.$transaction([
    db.cuAccount.update({ where: { id: from.id }, data: { balance: { decrement: amount } } }),
    db.cuAccount.update({ where: { id: to.id }, data: { balance: { increment: amount } } }),
    db.cuTransaction.create({
      data: {
        type: 'transfer',
        amount,
        fromUserId,
        toUserId,
        description,
        refType: ref?.refType,
        refId: ref?.refId,
      },
    }),
  ]);
  await checkMilestone(toUserId);
  return db.cuAccount.findUnique({ where: { id: to.id } });
}

export async function consumeCu(userId: string, amount: number, description: string, ref?: { refType?: string; refId?: string }) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('La cantidad de CU debe ser un entero positivo');
  }
  const account = await ensureCuAccount(userId);
  if (account.balance < amount) {
    throw new Error('Saldo de CU insuficiente para consumir');
  }
  const updated = await db.cuAccount.update({
    where: { id: account.id },
    data: { balance: { decrement: amount }, totalConsumed: { increment: amount } },
  });
  await db.cuTransaction.create({
    data: {
      type: 'consume',
      amount,
      fromUserId: userId,
      description,
      refType: ref?.refType,
      refId: ref?.refId,
    },
  });
  return updated;
}

// ---------------------------------------------------------------------------
// POLÍTICA DE AJUSTE HISTÓRICO (HistoricalAdjustmentPolicy)
//
// Preparada pero deshabilitada por defecto. Toda modificación de saldos
// históricos es: parametrizada, registrada, auditable (CuTransaction
// type='adjustment') y separada del PID. No hay confiscación automática.
// ---------------------------------------------------------------------------
export async function applyHistoricalAdjustment(userId: string, delta: number, reason: string, actorUserId: string) {
  if (!Number.isInteger(delta) || delta === 0) {
    throw new Error('El ajuste histórico debe ser un entero distinto de cero');
  }
  const config = await ensureCuConfig();
  if (!config.adjustmentEnabled) {
    throw new Error('Los ajustes históricos están deshabilitados en la configuración');
  }
  if (config.adjustmentMode === 'none') {
    throw new Error('No se configuró un modo de ajuste (adjustmentMode = none)');
  }
  if (config.adjustmentCap > 0 && Math.abs(delta) > config.adjustmentCap) {
    throw new Error(`El ajuste supera el límite configurado (${config.adjustmentCap} CU)`);
  }
  const account = await ensureCuAccount(userId);
  if (account.balance + delta < 0) {
    throw new Error('El ajuste dejaría el saldo en negativo');
  }
  const updated = await db.cuAccount.update({
    where: { id: account.id },
    data: { balance: { increment: delta } },
  });
  // signo positivo: el saldo viaja del actor al usuario; negativo: del usuario al actor
  await db.cuTransaction.create({
    data: {
      type: 'adjustment',
      amount: Math.abs(delta),
      fromUserId: delta > 0 ? actorUserId : userId,
      toUserId: delta > 0 ? userId : actorUserId,
      description: `Ajuste histórico (modo ${config.adjustmentMode}): ${reason}`,
      refType: 'adjust',
    },
  });
  if (delta > 0) await checkMilestone(userId);
  return updated;
}

// ---------------------------------------------------------------------------
// ⚠️ LEGACY / HISTORICAL — Asignación a nuevos usuarios dependiente del PID.
// RONDA C usa welcomeGrant() (cap-formulas.ts): política EXPLÍCITA, no derivada
// de metrics.error/setPoint. Estas funciones se conservan solo para la pizarra
// y el harness de stress test; nada en la ruta de registro las llama.
// ---------------------------------------------------------------------------
// Política de asignación a NUEVOS USUARIOS.
//
// No es una emisión fija: depende del ESTADO DEL SISTEMA + SEÑAL PID + política.
//   ESTADO DEL SISTEMA + SEÑAL PID + POLÍTICA DE OFERTA → CU disponibles
// En equilibrio (error≈0) puede existir una cantidad base; ante escasez relativa
// la asignación se reduce (incluso a 0); ante abundancia puede aumentar.
// ---------------------------------------------------------------------------
// Fórmula pura de asignación a nuevos usuarios (reutilizada por getNewUserGrant
// y por el harness de stress test para no duplicar la regla).
export function computeNewUserGrant(cfg: { newUserGrantCu: number; newUserSensitivity: number }, error: number, setPoint: number): number {
  const sp = setPoint || 1;
  const ratio = Math.min(Math.max(error / sp, -1), 1);
  return Math.max(0, Math.round(cfg.newUserGrantCu * (1 - ratio * cfg.newUserSensitivity)));
}

// ⚠️ LEGACY: ver nota de bloque superior. No llama RONDA C.
export async function getNewUserGrant() {
  const config = await ensureCuConfig();
  if (!config.enabled || !config.newUserGrantEnabled) {
    return { enabled: config.newUserGrantEnabled, amount: 0 };
  }
  const metrics = await getCuMetrics();
  const amount = computeNewUserGrant(config, metrics.error, metrics.setPoint);
  return { enabled: config.newUserGrantEnabled, amount };
}

// ---------------------------------------------------------------------------
// Métricas del estado real de la economía de CU (MEDIR → COMPARAR → CORREGIR)
// ---------------------------------------------------------------------------

export interface CuMetrics {
  config: Awaited<ReturnType<typeof ensureCuConfig>>;
  basket: Awaited<ReturnType<typeof ensureCuBasket>>;
  supply: number;
  accounts: number;
  activeUsers: number;
  avgBalance: number;
  medianBalance: number;
  topDecileShare: number | null;
  accessRatio: number; // fracción de cuentas con saldo >= canasta observada
  accessTarget: number; // objetivo de acceso configurado
  effectiveSetPoint: number; // set point efectivo (alcanzable)
  observedSensed: number; // lectura del sensor v2 integrado (puede alejarse del observado persistido)
  velocity: number;
  transferredPeriod: number;
  consumedPeriod: number;
  issuedPeriod: number;
  issuedTotal: number;
  consumedTotal: number;
  error: number;
  setPoint: number;
  observed: number;
  pidOutput: number; // SEÑAL de corrección (no es emisión)
  policy: SupplyPolicyDecision;
  controllerEnabled: boolean;
  liberation: { mean: number | null; median: number | null; weighted: number | null; reporters: number };
  lastMeasurementAt: number;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export async function getCuMetrics(): Promise<CuMetrics> {
  const [config, basket, accounts, usersCount] = await Promise.all([
    ensureCuConfig(),
    ensureCuBasket(),
    db.cuAccount.findMany({ select: { balance: true, liberationEstimate: true } }),
    db.user.count({ where: { status: 'active' } }),
  ]);

  const balances = accounts.map((a) => a.balance);
  const supply = balances.reduce((s, b) => s + b, 0);

  const since = new Date(Date.now() - config.periodDays * 24 * 60 * 60 * 1000);
  const [issuedHead, consumedHead, transferredHead, consumedPeriodHead, issuedPeriodHead] = await Promise.all([
    db.cuTransaction.aggregate({ _sum: { amount: true }, where: { type: 'issued' } }),
    db.cuTransaction.aggregate({ _sum: { amount: true }, where: { type: 'consume' } }),
    db.cuTransaction.aggregate({
      _sum: { amount: true },
      where: { type: 'transfer', createdAt: { gte: since } },
    }),
    db.cuTransaction.aggregate({
      _sum: { amount: true },
      where: { type: 'consume', createdAt: { gte: since } },
    }),
    db.cuTransaction.aggregate({
      _sum: { amount: true },
      where: { type: 'issued', createdAt: { gte: since } },
    }),
  ]);
  const transferredPeriod = transferredHead._sum.amount ?? 0;
  const consumedPeriod = consumedPeriodHead._sum.amount ?? 0;
  const issuedPeriod = issuedPeriodHead._sum.amount ?? 0;

  // Velocidad: métrica de actividad (NO un precio del CU)
  const velocity = supply > 0 ? (transferredPeriod + consumedPeriod) / supply : 0;

  const topDecileShare =
    balances.length >= 10 && supply > 0
      ? (() => {
          const sorted = [...balances].sort((a, b) => b - a);
          const top = sorted.slice(0, Math.max(1, Math.floor(sorted.length / 10)));
          return top.reduce((s, b) => s + b, 0) / supply;
        })()
      : null;

  const estimates = accounts.map((a) => a.liberationEstimate).filter((v): v is number => typeof v === 'number');
  const weightedIndexes = accounts
    .map((a, i) => (a.liberationEstimate != null ? { w: balances[i], v: a.liberationEstimate } : null))
    .filter((x): x is { w: number; v: number } => x !== null);
  const weighted =
    weightedIndexes.length && weightedIndexes.reduce((s, x) => s + x.w, 0) > 0
      ? weightedIndexes.reduce((s, x) => s + x.w * x.v, 0) / weightedIndexes.reduce((s, x) => s + x.w, 0)
      : null;

  const observedRaw = basket.observedCu;
  const medianBalance2 = median(balances);
  const effectiveSetPoint = effectiveCuSetPoint(basket.targetCu, medianBalance2, config.reachableSetPoint);
  // SENSOR v2: lectura integrada (flujo neto + descubrimiento de precio hacia el set point alcanzable).
  const observed = basket.observedMethod === 'auto' ? senseCanasta({ observed: observedRaw, supply, consumed: consumedPeriod, suppliedIn: issuedPeriod, effectiveSetPoint, sensorFlowGain: config.sensorFlowGain, sensorAccessGain: config.sensorAccessGain }) : observedRaw;
  const accessRatio = balances.length ? balances.filter((b) => b >= observed).length / balances.length : 0;
  // Error de control: desvío de canasta (set point alcanzable) + brecha de acceso acotada.
  const error = observed - effectiveSetPoint + (clamp01(config.accessTarget) - accessRatio) * effectiveSetPoint * config.sensorAccessGain;
  const setPoint = effectiveSetPoint;
  const controller = new PidController({
    kp: config.kp,
    ki: config.ki,
    kd: config.kd,
    outputMin: config.outputMin,
    outputMax: config.outputMax,
  });
  const pidOutput = config.enabled ? controller.update(error, 0) : 0;
  const policy = evaluateSupplyPolicy(
    {
      expansionGain: config.expansionGain,
      contractionGain: config.contractionGain,
      reserveShare: config.reserveShare,
      newUserShare: config.newUserShare,
      historicalShare: config.historicalShare,
      maxEmissionPerCycle: config.maxEmissionPerCycle,
      maxBurnPerCycle: config.maxBurnPerCycle,
      supply,
    },
    pidOutput,
    0 // base de emisión: 0 → la política solo emite por señal (anti-inercia); grants aparte.
  );

  return {
    config,
    basket,
    supply,
    accounts: balances.length,
    activeUsers: usersCount,
    avgBalance: accounts.length ? supply / accounts.length : 0,
    medianBalance: medianBalance2,
    topDecileShare: topDecileShare as number | null,
    accessRatio: Math.round(accessRatio * 1000) / 1000,
    accessTarget: config.accessTarget,
    effectiveSetPoint,
    observedSensed: Math.round(observed * 100) / 100,
    velocity: Math.round(velocity * 100) / 100,
    transferredPeriod,
    consumedPeriod,
    issuedPeriod,
    issuedTotal: issuedHead._sum.amount ?? 0,
    consumedTotal: consumedHead._sum.amount ?? 0,
    error: Math.round(error * 100) / 100,
    setPoint: effectiveSetPoint,
    observed: Math.round(observed * 100) / 100,
    pidOutput: Math.round(pidOutput * 100) / 100,
    policy,
    controllerEnabled: config.enabled,
    liberation: {
      mean: estimates.length ? estimates.reduce((s, v) => s + v, 0) / estimates.length : null,
      median: estimates.length ? median(estimates) : null,
      weighted: weighted !== null ? Math.round(weighted * 100) / 100 : null,
      reporters: estimates.length,
    },
    lastMeasurementAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// SENSOR v2 — tick de medición explícito (se llama al guardar configuración).
// Integra la percepción de la canasta a partir de flujos reales y lo persiste
// en la canasta. Sin esto, un sensor 'manual' quedaría congelado en el sticker.
// ---------------------------------------------------------------------------
export async function refreshCuSensor(): Promise<number> {
  const [config, basket, accounts] = await Promise.all([ensureCuConfig(), ensureCuBasket(), db.cuAccount.findMany({ select: { balance: true } })]);
  const balances = accounts.map((a) => a.balance);
  const supply = balances.reduce((s, b) => s + b, 0);
  const since = new Date(Date.now() - config.periodDays * 24 * 60 * 60 * 1000);
  const [consumedHead, issuedHead] = await Promise.all([
    db.cuTransaction.aggregate({ _sum: { amount: true }, where: { type: 'consume', createdAt: { gte: since } } }),
    db.cuTransaction.aggregate({ _sum: { amount: true }, where: { type: 'issued', createdAt: { gte: since } } }),
  ]);
  const observed = basket.observedCu;
  const med = median(balances);
  const eff = effectiveCuSetPoint(basket.targetCu, med, config.reachableSetPoint);
  const sensed = senseCanasta({
    observed,
    supply,
    consumed: consumedHead._sum.amount ?? 0,
    suppliedIn: issuedHead._sum.amount ?? 0,
    effectiveSetPoint: eff,
    sensorFlowGain: config.sensorFlowGain,
    sensorAccessGain: config.sensorAccessGain,
  });
  const next = Math.max(5, Math.round(sensed));
  if (next !== observed && basket.observedMethod !== 'manual') {
    await db.cuBasket.update({ where: { id: basket.id }, data: { observedCu: next } });
  }
  return next;
}

// ---------------------------------------------------------------------------
// Simulador (pizarra / laboratorio). NO modifica la economía real.
//
// Muestra ciclo por ciclo: CU totales, canasta observada, error, SEÑAL PID,
// emisión (decisión de la política), consumo y usuarios, para estudiar
// convergencia, oscilación, sobre-corrección, cortes o inestabilidad.
// ---------------------------------------------------------------------------

export interface SimParams {
  users: number;
  initialCu: number;
  emittedPerCycle: number; // emisión base (v2: la política decide; esto solo aplica en fase neutral)
  consumedPerCycle: number; // consumo base por ciclo
  demandGrowthPerCycle: number; // % adicional de consumo por ciclo
  shockCycle: number; // ciclo exacto del shock de demanda (0 = ninguno)
  shockAmount: number; // % de shock aplicado en shockCycle
  userGrowthPerCycle: number; // usuarios nuevos por ciclo
  startObserved: number;
  setPoint: number;
  kp: number;
  ki: number;
  kd: number;
  outputMin: number;
  outputMax: number;
  expansionGain: number;
  contractionGain: number;
  reserveShare: number;
  newUserShare: number;
  historicalShare: number;
  maxEmissionPerCycle: number;
  maxBurnPerCycle: number;
  accessTarget: number;
  reachableSetPoint: boolean;
  sensorFlowGain: number;
  sensorAccessGain: number;
  cycles: number;
}

export interface SimCycle {
  cycle: number;
  supply: number; // CU totales
  observed: number;
  effectiveSetPoint: number;
  error: number;
  pidOutput: number; // SEÑAL de corrección (no es emisión)
  phase: string;
  emission: number; // decisión de la política de oferta
  burn: number; // contracción decidida por la política (0 = sin quema)
  accessPct: number; // acceso estimado a la canasta (%)
  consumption: number;
  users: number;
}

export function runCuSimulation(p: SimParams): SimCycle[] {
  const cycles = Math.max(1, Math.min(p.cycles, 60));
  const result: SimCycle[] = [];
  let supply = Math.max(1, p.users * p.initialCu);
  let users = Math.max(1, p.users);
  // v2: la canasta arranca en el precio alcanzable por la dotación inicial (mediana estimada)
  const startEff = effectiveCuSetPoint(p.setPoint, supply / users, p.reachableSetPoint);
  let observed = p.reachableSetPoint ? startEff : p.startObserved;
  const controller = new PidController({
    kp: p.kp,
    ki: p.ki,
    kd: p.kd,
    outputMin: p.outputMin,
    outputMax: p.outputMax,
  });
  const policyInputs: SupplyPolicyInputs = {
    expansionGain: p.expansionGain,
    contractionGain: p.contractionGain,
    reserveShare: p.reserveShare,
    newUserShare: p.newUserShare,
    historicalShare: p.historicalShare,
    maxEmissionPerCycle: p.maxEmissionPerCycle,
    maxBurnPerCycle: p.maxBurnPerCycle,
  };
  for (let i = 1; i <= cycles; i++) {
    const base = p.consumedPerCycle * Math.pow(1 + p.demandGrowthPerCycle / 100, i - 1);
    let consumption = p.shockCycle > 0 && i === p.shockCycle ? base * (1 + p.shockAmount / 100) : base;
    // nuevos usuarios (grant dinámico según error de precio)
    let grantIn = 0;
    if (p.userGrowthPerCycle > 0) {
      const avgBalance = users > 0 ? supply / users : 0;
      const eff = effectiveCuSetPoint(p.setPoint, avgBalance, p.reachableSetPoint);
      const grant = computeNewUserGrant({ newUserGrantCu: 40, newUserSensitivity: p.sensorAccessGain }, observed - eff, eff);
      grantIn = p.userGrowthPerCycle * grant;
      users += p.userGrowthPerCycle;
      supply += grantIn;
    }
    consumption = Math.min(consumption, Math.max(0, supply)); // no consumir más de lo que hay
    const avgBalance = users > 0 ? supply / users : 0;
    const effectiveSetPoint = effectiveCuSetPoint(p.setPoint, avgBalance, p.reachableSetPoint);
    // acceso estimado bajo distribución uniforme aproximada: P(saldo >= canasta)
    const accessRatio = ((2 * avgBalance - observed) / Math.max(2 * avgBalance, 1)) as number;
    const accessPct = Math.round(clamp01(accessRatio) * 1000) / 10;

    // PID sobre error de control (precio sobre set point alcanzable + brecha de acceso acotada)
    const error = observed - effectiveSetPoint + (clamp01(p.accessTarget) - clamp01(accessRatio)) * effectiveSetPoint * p.sensorAccessGain;
    policyInputs.supply = supply;
    const signal = controller.update(error, 0); // PID → SEÑAL
    const decision = evaluateSupplyPolicy(policyInputs, signal, p.emittedPerCycle); // SEÑAL → POLÍTICA
    const emission = decision.emission;
    const burn = decision.burn;
    supply = Math.max(1, supply + emission + grantIn - consumption - burn);
    // SENSOR v2: descubre el precio hacia el set point efectivo (no anclado al sticker)
    observed = senseCanasta({
      observed,
      supply,
      consumed: consumption,
      suppliedIn: emission + grantIn,
      effectiveSetPoint,
      sensorFlowGain: p.sensorFlowGain,
      sensorAccessGain: p.sensorAccessGain,
    });
    result.push({
      cycle: i,
      supply: round2(supply),
      observed: round2(observed),
      effectiveSetPoint,
      error: round2(error),
      pidOutput: round2(signal),
      phase: decision.phase,
      emission: round2(emission),
      burn: round2(burn),
      accessPct,
      consumption: round2(consumption),
      users,
    });
  }
  return result;
}