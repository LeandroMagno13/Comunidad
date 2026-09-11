import { db } from '@/src/lib/db';

// ============================================================================
// ECONOMÍA CU — MODELO EXPERIMENTAL (Capa 2)
//
// Un CU es una unidad interna de participación / "stamina" de la comunidad.
// NO es dinero, moneda, activo, acción, dividendo, deuda, inversión ni
// representación del patrimonio. NO existe conversión CU ↔ ARS/USD/cripto.
//
// Modelo de control:
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
  expansionGain: 0, // 0 = la política no emite automáticamente ante señal positiva
  contractionGain: 0, // 0 = la política no reduce automáticamente ante señal negativa
  reserveShare: 0.3,
  newUserShare: 0.5,
  historicalShare: 0.2,
  maxEmissionPerCycle: 1000, // límite anti-shock
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
  if (existing) return existing;
  return db.cuConfig.create({ data: { id: CU_CONFIG_ID, ...DEFAULT_CU_CONFIG } });
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
// Recibe la SEÑAL del PID y decide qué hacer: expansión / neutralidad /
// contracción. Las proporciones (reserva / nuevos usuarios / históricos) son
// parámetros de configuración, no reglas codificadas.
// ---------------------------------------------------------------------------

export interface SupplyPolicyInputs {
  expansionGain: number;
  contractionGain: number;
  reserveShare: number;
  newUserShare: number;
  historicalShare: number;
  maxEmissionPerCycle: number;
}

export interface SupplyPolicyDecision {
  phase: 'expansion' | 'neutral' | 'contraction';
  signal: number;
  emission: number; // decisión de la política (no la señal del PID)
  newUserAllocation: number; // CU disponibles para nuevos usuarios (esta señal)
  allocation: { reserve: number; newUsers: number; historical: number };
}

export function evaluateSupplyPolicy(
  inputs: SupplyPolicyInputs,
  signal: number,
  baseEmission: number
): SupplyPolicyDecision {
  const phase = signal > 0.0001 ? 'expansion' : signal < -0.0001 ? 'contraction' : 'neutral';
  let emission = baseEmission;
  if (phase === 'expansion') {
    emission = baseEmission * Math.max(0, 1 + (signal * inputs.expansionGain) / 100);
  } else if (phase === 'contraction') {
    emission = baseEmission * Math.max(0, 1 + (signal * inputs.contractionGain) / 100);
  }
  if (inputs.maxEmissionPerCycle > 0) {
    emission = Math.min(emission, inputs.maxEmissionPerCycle);
  }
  emission = Math.max(0, emission);
  const allocation = {
    reserve: emission * inputs.reserveShare,
    newUsers: emission * inputs.newUserShare,
    historical: emission * inputs.historicalShare,
  };
  return {
    phase,
    signal: round2(signal),
    emission: round2(emission),
    newUserAllocation: round2(allocation.newUsers),
    allocation: {
      reserve: round2(allocation.reserve),
      newUsers: round2(allocation.newUsers),
      historical: round2(allocation.historical),
    },
  };
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
  velocity: number;
  transferredPeriod: number;
  consumedPeriod: number;
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
  const [issuedHead, consumedHead, transferredHead, consumedPeriodHead] = await Promise.all([
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
  ]);
  const transferredPeriod = transferredHead._sum.amount ?? 0;
  const consumedPeriod = consumedPeriodHead._sum.amount ?? 0;

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

  const observed = basket.observedCu;
  const setPoint = basket.targetCu;
  const error = observed - setPoint;
  const controller = new PidController({
    kp: config.kp,
    ki: config.ki,
    kd: config.kd,
    outputMin: config.outputMin,
    outputMax: config.outputMax,
  });
  const pidOutput = config.enabled ? controller.update(observed, setPoint) : 0;
  const policy = evaluateSupplyPolicy(
    {
      expansionGain: config.expansionGain,
      contractionGain: config.contractionGain,
      reserveShare: config.reserveShare,
      newUserShare: config.newUserShare,
      historicalShare: config.historicalShare,
      maxEmissionPerCycle: config.maxEmissionPerCycle,
    },
    pidOutput,
    config.newUserGrantCu
  );

  return {
    config,
    basket,
    supply,
    accounts: balances.length,
    activeUsers: usersCount,
    avgBalance: accounts.length ? supply / accounts.length : 0,
    medianBalance: median(balances),
    topDecileShare: topDecileShare as number | null,
    velocity: Math.round(velocity * 100) / 100,
    transferredPeriod,
    consumedPeriod,
    issuedTotal: issuedHead._sum.amount ?? 0,
    consumedTotal: consumedHead._sum.amount ?? 0,
    error: Math.round(error * 100) / 100,
    setPoint,
    observed,
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
// Simulador (pizarra / laboratorio). NO modifica la economía real.
//
// Muestra ciclo por ciclo: CU totales, canasta observada, error, SEÑAL PID,
// emisión (decisión de la política), consumo y usuarios, para estudiar
// convergencia, oscilación, sobre-corrección, cortes o inestabilidad.
// ---------------------------------------------------------------------------

export interface SimParams {
  users: number;
  initialCu: number;
  emittedPerCycle: number; // emisión base que la política ajusta ante la señal
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
  cycles: number;
}

export interface SimCycle {
  cycle: number;
  supply: number; // CU totales
  observed: number;
  error: number;
  pidOutput: number; // SEÑAL de corrección (no es emisión)
  phase: string;
  emission: number; // decisión de la política de oferta
  consumption: number;
  users: number;
}

export function runCuSimulation(p: SimParams): SimCycle[] {
  const cycles = Math.max(1, Math.min(p.cycles, 60));
  const result: SimCycle[] = [];
  let supply = Math.max(1, p.users * p.initialCu);
  let users = Math.max(1, p.users);
  let observed = p.startObserved;
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
  };
  for (let i = 1; i <= cycles; i++) {
    const base = p.consumedPerCycle * Math.pow(1 + p.demandGrowthPerCycle / 100, i - 1);
    const consumption =
      p.shockCycle > 0 && i === p.shockCycle ? base * (1 + p.shockAmount / 100) : base;
    if (p.userGrowthPerCycle > 0) {
      users = users + p.userGrowthPerCycle;
    }
    const signal = controller.update(observed, p.setPoint); // PID → SEÑAL
    const decision = evaluateSupplyPolicy(policyInputs, signal, p.emittedPerCycle); // SEÑAL → POLÍTICA
    const emission = decision.emission;
    supply = Math.max(1, supply + emission - consumption);
    // actualización simple del "sensor": la canasta sube si el consumo supera la emisión
    observed = Math.max(1, p.startObserved * (1 + ((consumption - emission) / supply) * 0.1));
    result.push({
      cycle: i,
      supply: round2(supply),
      observed: round2(observed),
      error: round2(observed - p.setPoint),
      pidOutput: round2(signal),
      phase: decision.phase,
      emission: round2(emission),
      consumption: round2(consumption),
      users,
    });
  }
  return result;
}