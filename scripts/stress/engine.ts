// ============================================================================
// HARNESS DE STRESS TEST — economía experimental de CU
//
// Reproduce la ARQUITECTURA ACTUAL (src/lib/cu.ts) pero a nivel de AGENTES
// (saldos individuales) para poder medir distribución, acceso a la canasta,
// concentración, velocidad y comportamiento del PID sobre una población.
//
// Reglas usadas TAL CUAL del modelo implementado:
//   - PidController + evaluateSupplyPolicy (importadas).
//   - computeNewUserGrant (importada).
//   - "sensor" de la canasta: observed' = startObserved * (1 + (consumo - emisión)/oferta * 0.1)
//     (misma regla que runCuSimulation).
//   - Emisión por ciclo: en la RONDA A es 0 salvo la asignación a nuevos
//     usuarios (la política con ganancias 0 no transforma la señal en emisión).
//
// SUPUESTOS de micromodelo (marcados como A# en el informe):
//   A1 consumo: cada ciclo, los usuarios que acceden a la canasta (saldo >=
//     costo observado) gastan `demandRate * costoCanasta` (tope: su saldo).
//     Sin acceso -> consumo colapsa (retroalimentación emergente).
//   A2 transferencias: volumen = transferRate * oferta; pares aleatorios
//     sender/receiver, limitado por saldo del sender.
//   A3 crecimiento de usuarios: entran `growth` usuarios/ciclo con su grant.
//   A4 shocks de oferta: intervención artificial para el experimento
//     (destruye/inyecta % del saldo de forma proporcional).
// ============================================================================

import { PidController, evaluateSupplyPolicy, SupplyPolicyDecision, computeNewUserGrant } from '@/src/lib/cu';

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Allocation = 'uniform' | 'concentrated';

export interface EngineConfig {
  kp: number;
  ki: number;
  kd: number;
  outputMin: number;
  outputMax: number;
  newUserGrantCu: number;
  newUserSensitivity: number;
  expansionGain: number;
  contractionGain: number;
  reserveShare: number;
  newUserShare: number;
  historicalShare: number;
  maxEmissionPerCycle: number;
  grantEnabled: boolean;
}

export interface DemandShock {
  cycle: number;
  pct: number;
}
export interface SupplyShock {
  cycle: number;
  pct: number;
}

export interface Scenario {
  id: string;
  label: string;
  config?: Partial<EngineConfig>;
  users0: number;
  perUser0: number;
  allocation?: Allocation;
  setPoint: number;
  startObserved: number;
  cycles: number;
  growth: number | ((cycle: number) => number);
  demandRate: number; // fracción del costo de la canasta que gasta cada usuario con acceso
  demandGrowthPct?: number;
  demandVolatility?: number;
  demandShocks?: DemandShock[];
  transferRate?: number; // fracción de la oferta que cambia de manos por ciclo
  supplyShocks?: SupplyShock[];
  emissionBase: number; // emisión base/ciclo (RONDA B; ronda A = 0)
  emitMode: 'none' | 'shares';
  seed?: number;
}

export const DEFAULT_CONFIG: EngineConfig = {
  kp: 0.5,
  ki: 0.1,
  kd: 0.05,
  outputMin: -100,
  outputMax: 100,
  newUserGrantCu: 20,
  newUserSensitivity: 1,
  expansionGain: 0,
  contractionGain: 0,
  reserveShare: 0.3,
  newUserShare: 0.5,
  historicalShare: 0.2,
  maxEmissionPerCycle: 1000,
  grantEnabled: true,
};

export interface TraceRow {
  cycle: number;
  users: number;
  supply: number;
  issued: number;
  consumed: number;
  transferred: number;
  destroyed: number;
  injected: number;
  observed: number;
  setPoint: number;
  error: number;
  pidOutput: number;
  phase: string;
  emissionDecision: number;
  emissionsApplied: number;
  accessCount: number;
  accessPct: number;
  avg: number;
  median: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  min: number;
  max: number;
  zerosPct: number;
  top10Share: number;
  top1Share: number;
  gini: number;
  velocity: number;
  velocity30: number;
}

export interface SimResult {
  scenario: Scenario;
  config: EngineConfig;
  rows: TraceRow[];
  finalBalances: number[];
  seed: number;
}

function clamp01(v: number) {
  return Math.min(Math.max(v, 0), 1);
}

function gini(sorted: number[]): number {
  if (sorted.length < 2) return 0;
  const n = sorted.length;
  let cum = 0;
  let sum = 0;
  for (const x of sorted) sum += x;
  if (sum <= 0) return 0;
  let g = 0;
  for (let i = 0; i < n; i++) {
    cum += sorted[i]!;
    g += cum;
  }
  return clamp01((n + 1) / n - (2 * g) / (sum * n));
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(((p / 100) * (sorted.length - 1))));
  return sorted[idx]!;
}

export function balanceStats(balances: number[]): {
  sum: number;
  avg: number;
  median: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  min: number;
  max: number;
  zerosPct: number;
  top10Share: number;
  top1Share: number;
  gini: number;
} {
  const n = balances.length;
  if (!n) {
    return { sum: 0, avg: 0, median: 0, p10: 0, p25: 0, p75: 0, p90: 0, min: 0, max: 0, zerosPct: 0, top10Share: 0, top1Share: 0, gini: 0 };
  }
  const sum = balances.reduce((s, b) => s + b, 0);
  const sorted = [...balances].sort((a, b) => a - b);
  const zerosPct = balances.filter((b) => b === 0).length / n;
  const top10 = sorted.slice(Math.max(0, n - Math.max(1, Math.ceil(n / 10))));
  const top1 = sorted.slice(Math.max(0, n - Math.max(1, Math.ceil(n / 100))));
  return {
    sum,
    avg: sum / n,
    median: percentile(sorted, 50),
    p10: percentile(sorted, 10),
    p25: percentile(sorted, 25),
    p75: percentile(sorted, 75),
    p90: percentile(sorted, 90),
    min: sorted[0]!,
    max: sorted[sorted.length - 1]!,
    zerosPct,
    top10Share: sum > 0 ? top10.reduce((s, b) => s + b, 0) / sum : 0,
    top1Share: sum > 0 ? top1.reduce((s, b) => s + b, 0) / sum : 0,
    gini: gini(sorted),
  };
}

function initialBalances(s: Scenario, rng: () => number): number[] {
  const balances: number[] = [];
  if (s.allocation === 'concentrated') {
    // top 10% retiene 75% del total inicial; resto repartido uniforme
    const total = s.users0 * s.perUser0;
    const topN = Math.max(1, Math.ceil(s.users0 / 10));
    const richShare = 0.75;
    const richBal = (total * richShare) / topN;
    const poorBal = (total * (1 - richShare)) / (s.users0 - topN || 1);
    for (let i = 0; i < s.users0; i++) {
      const base = i < topN ? richBal : poorBal;
      const jitter = 0.8 + rng() * 0.4;
      balances.push(Math.max(0, Math.round(base * jitter)));
    }
  } else {
    for (let i = 0; i < s.users0; i++) {
      const jitter = 0.8 + rng() * 0.4;
      balances.push(Math.max(0, Math.round(s.perUser0 * jitter)));
    }
  }
  return balances;
}

export function runScenario(s: Scenario): SimResult {
  const seed = s.seed ?? 1234;
  const rng = mulberry32(seed);
  const cfg: EngineConfig = { ...DEFAULT_CONFIG, ...(s.config || {}) };

  let balances = initialBalances(s, rng);
  let usersCount = balances.length;
  const setPoint = s.setPoint;
  let observed = s.startObserved;
  const cycles = Math.max(1, Math.min(s.cycles, 200));

  const pid = new PidController({
    kp: cfg.kp,
    ki: cfg.ki,
    kd: cfg.kd,
    outputMin: cfg.outputMin,
    outputMax: cfg.outputMax,
  });

  const grantAt = (error: number) => (cfg.grantEnabled ? computeNewUserGrant(cfg, error, setPoint) : 0);

  const rows: TraceRow[] = [];
  const errs = new Array<number>();
  const velos = new Array<number>();

  for (let c = 1; c <= cycles; c++) {
    const signal = pid.update(observed, setPoint);
    const error = observed - setPoint;
    const policyInputs = {
      expansionGain: cfg.expansionGain,
      contractionGain: cfg.contractionGain,
      reserveShare: cfg.reserveShare,
      newUserShare: cfg.newUserShare,
      historicalShare: cfg.historicalShare,
      maxEmissionPerCycle: cfg.maxEmissionPerCycle,
    };
    const decision: SupplyPolicyDecision = evaluateSupplyPolicy(policyInputs, signal, s.emissionBase);

    // ---- 1) crecimiento e incorporación (grant) ----
    const growthN = typeof s.growth === 'function' ? Math.max(0, Math.round(s.growth(c))) : Math.max(0, Math.round(s.growth));
    const grant = grantAt(error);
    let issuedGrowth = 0;
    for (let g = 0; g < growthN; g++) {
      balances.push(grant);
      issuedGrowth += grant;
    }
    usersCount = balances.length;

    // ---- 2) emisión (política) ----
    let emissionsApplied = 0;
    if (decision.emission > 0 && s.emitMode !== 'none') {
      if (s.emitMode === 'shares') {
        const historical = decision.emission * cfg.historicalShare;
        const reserve = decision.emission * cfg.reserveShare;
        const newPool = decision.emission * cfg.newUserShare;
        // históricos (proporcional al saldo de los existentes)
        const existingBal = balances.slice(0, usersCount - growthN);
        if (existingBal.length && historical > 0) {
          const total = existingBal.reduce((a, b) => a + b, 0);
          for (let i = 0; i < existingBal.length; i++) {
            const w = total > 0 ? existingBal[i]! / total : 1 / existingBal.length;
            existingBal[i]! += Math.floor(historical * w);
          }
        }
        // nuevos usuarios (solo los que entraron este ciclo)
        if (newPool > 0 && growthN > 0) {
          for (let i = usersCount - growthN; i < usersCount; i++) {
            balances[i]! += Math.floor(newPool / growthN);
          }
        }
        // reserva: CU 'retenidos' (no se asignan a nadie) — solo suma a la oferta contable
        emissionsApplied = historical + newPool;
      }
    }

    // ---- 3) shocks de oferta (intervención artificial de testeo) ----
    let destroyed = 0;
    let injected = 0;
    for (const sh of s.supplyShocks || []) {
      if (sh.cycle === c) {
        if (sh.pct < 0) {
          const frac = clamp01(-sh.pct / 100);
          for (let i = 0; i < balances.length; i++) {
            const d = Math.round(balances[i]! * frac);
            balances[i]! -= d;
            destroyed += d;
          }
        } else {
          const frac = sh.pct / 100;
          for (let i = 0; i < balances.length; i++) {
            const d = Math.round(balances[i]! * frac);
            balances[i]! += d;
            injected += d;
          }
        }
      }
    }

    // ---- 4) demanda (consumo por parte de quienes acceden) ----
    const accessCost = observed;
    const earners = balances.filter((b) => b >= accessCost);
    const accessCount = earners.length;
    let rate = s.demandRate;
    if (s.demandGrowthPct) rate *= Math.pow(1 + s.demandGrowthPct / 100, c - 1);
    if (s.demandVolatility) rate *= 1 + (rng() * 2 - 1) * s.demandVolatility;
    for (const sh of s.demandShocks || []) {
      if (sh.cycle === c) rate *= 1 + sh.pct / 100;
    }
    rate = Math.max(0, rate);

    let consumed = 0;
    if (accessCount > 0) {
      const perUserBudget = Math.max(0, accessCost * rate);
      const indices = balances.map((_, i) => i);
      const picked = new Set<number>();
      // elegir consumidores con más saldo primero (los "demandantes")
      let guard = 0;
      while (guard < balances.length * 2) {
        guard++;
        let idx: number;
        if (picked.size < accessCount) {
          // muestreo preferente por saldo (media de los que acceden)
          idx = pickWeighted(rng, earners, balances);
        } else {
          break;
        }
        if (idx < 0 || picked.has(idx)) continue;
        picked.add(idx);
        const spend = Math.min(balances[idx]!, perUserBudget);
        balances[idx]! -= spend;
        consumed += spend;
        if (consumed >= accessCount * perUserBudget * 0.999) break;
      }
    }

    // ---- 5) transferencias ----
    const transferTarget = (s.transferRate || 0) * totalOf(balances);
    let transferred = 0;
    let tguard = 0;
    while (transferred < transferTarget && tguard < balances.length * 3) {
      tguard++;
      const a = Math.floor(rng() * balances.length);
      const b = Math.floor(rng() * balances.length);
      if (a === b || balances[a]! <= 0) continue;
      const amt = Math.min(balances[a]!, Math.max(1, Math.round((transferTarget - transferred) * (0.5 + rng()))));
      if (amt <= 0) continue;
      balances[a]! -= amt;
      balances[b]! += amt;
      transferred += amt;
    }

    // ---- 6) recalcular y actualizar sensor ----
    const supply = totalOf(balances);
    const supplyIn = issuedGrowth + emissionsApplied + injected;
    observed = Math.max(1, s.startObserved * (1 + ((consumed - supplyIn) / Math.max(1, supply)) * 0.1));

    const st = balanceStats(balances);
    const velocity = supply > 0 ? (transferred + consumed) / supply : 0;
    errs.push(error);
    velos.push(velocity);
    const v30 = velos.slice(Math.max(0, velos.length - 30)).reduce((a, b) => a + b, 0) / Math.min(velos.length, 30);

    rows.push({
      cycle: c,
      users: usersCount,
      supply,
      issued: issuedGrowth + emissionsApplied + injected,
      consumed,
      transferred,
      destroyed,
      injected,
      observed: Math.round(observed * 100) / 100,
      setPoint,
      error: Math.round(error * 100) / 100,
      pidOutput: Math.round(signal * 100) / 100,
      phase: decision.phase,
      emissionDecision: decision.emission,
      emissionsApplied,
      accessCount,
      accessPct: usersCount ? Math.round((accessCount / usersCount) * 1000) / 10 : 0,
      avg: Math.round(st.avg * 100) / 100,
      median: Math.round(st.median * 100) / 100,
      p10: Math.round(st.p10 * 100) / 100,
      p25: Math.round(st.p25 * 100) / 100,
      p75: Math.round(st.p75 * 100) / 100,
      p90: Math.round(st.p90 * 100) / 100,
      min: st.min,
      max: st.max,
      zerosPct: Math.round(st.zerosPct * 1000) / 10,
      top10Share: Math.round(st.top10Share * 1000) / 10,
      top1Share: Math.round(st.top1Share * 1000) / 10,
      gini: Math.round(st.gini * 1000) / 10,
      velocity: Math.round(velocity * 1000) / 1000,
      velocity30: Math.round(v30 * 1000) / 1000,
    });
  }

  return { scenario: s, config: cfg, rows, finalBalances: balances, seed };
}

function totalOf(balances: number[]): number {
  return balances.reduce((s, b) => s + b, 0);
}

function pickWeighted(rng: () => number, candidates: number[], balances: number[]): number {
  // elige un índice con probabilidad ~ proporcional al saldo entre quienes acceden
  const total = candidates.reduce((s, b) => s + b, 0);
  if (total <= 0) return -1;
  let r = rng() * total;
  for (let i = 0; i < balances.length; i++) {
    const b = balances[i]!;
    if (b <= 0) continue;
    r -= b;
    if (r <= 0) return i;
  }
  return -1;
}

// ============================================================================
// Métricas de estabilidad (§13)
// ============================================================================

export interface StabilityMetrics {
  mae: number;
  maxAbsError: number;
  peakOver: number;
  peakUnder: number;
  stdError: number;
  recovery5: number; // ciclo en que |error| entra y permanece en ±5% (0 = nunca / ya dentro)
  recovery10: number;
  recovery20: number;
  oscSignChanges: number;
  finalAccessPct: number;
  meanAccessPct: number;
  minAccessPct: number;
  finalGini: number;
  finalTop10: number;
  finalZerosPct: number;
  meanVelocity: number;
  meanConsumedPerCycle: number;
  meanTransferredPerCycle: number;
  emittedTotal: number;
  destroyedTotal: number;
  netSupply: number;
  finalSupply: number;
  finalUsers: number;
}

export function stability(s: SimResult): StabilityMetrics {
  const rows = s.rows;
  if (!rows.length) {
    return {
      mae: 0, maxAbsError: 0, peakOver: 0, peakUnder: 0, stdError: 0,
      recovery5: 0, recovery10: 0, recovery20: 0, oscSignChanges: 0,
      finalAccessPct: 0, meanAccessPct: 0, minAccessPct: 0,
      finalGini: 0, finalTop10: 0, finalZerosPct: 0, meanVelocity: 0,
      meanConsumedPerCycle: 0, meanTransferredPerCycle: 0,
      emittedTotal: 0, destroyedTotal: 0, netSupply: 0, finalSupply: 0, finalUsers: s.finalBalances.length,
    };
  }
  const errs = rows.map((r) => r.error);
  const absErr = errs.map(Math.abs);
  const mae = absErr.reduce((a, b) => a + b, 0) / rows.length || 0;
  const maxAbsError = Math.max(...absErr, 0);
  const peakOver = Math.max(0, ...errs);
  const peakUnder = Math.max(0, ...errs.map((e) => -e));
  const mean = mae; // (referencia)
  const stdError = Math.sqrt(errs.reduce((a, b) => a + (b - mean) * (b - mean), 0) / rows.length) || 0;
  const band = (pct: number) => (s.scenario.setPoint * pct) / 100;

  function recovery(pct: number): number {
    const b = band(pct);
    if (!rows.length) return rows.length;
    if (rows.every((r) => Math.abs(r.error) <= b)) return 0;
    let outStart = -1;
    let sustained = 0;
    for (let i = rows.length - 1; i >= 0; i--) {
      if (Math.abs(rows[i]!.error) <= b) {
        sustained++;
        if (sustained >= 3) {
          if (outStart === -1) outStart = i;
        }
      } else {
        sustained = 0;
        outStart = -1;
      }
    }
    // outStart = último índice desde el que se mantiene dentro; recuperación = índice
    return outStart === -1 ? rows.length : outStart;
  }

  const oscSignChanges = errs.reduce((acc, e, i) => (i > 0 && e * errs[i - 1]! < 0 ? acc + 1 : acc), 0);
  const r1 = rows[rows.length - 1]!;
  const meanAccessPct = rows.reduce((a, r) => a + r.accessPct, 0) / rows.length || 0;
  const finalTop10 = r1.top10Share;
  const meanVelocity = rows.reduce((a, r) => a + r.velocity, 0) / rows.length || 0;
  const meanConsumed = rows.reduce((a, r) => a + r.consumed, 0) / rows.length || 0;
  const meanTransferred = rows.reduce((a, r) => a + r.transferred, 0) / rows.length || 0;
  return {
    mae,
    maxAbsError,
    peakOver,
    peakUnder,
    stdError,
    recovery5: recovery(5),
    recovery10: recovery(10),
    recovery20: recovery(20),
    oscSignChanges,
    finalAccessPct: r1.accessPct,
    meanAccessPct,
    minAccessPct: Math.min(...rows.map((r) => r.accessPct)),
    finalGini: r1.gini,
    finalTop10,
    finalZerosPct: r1.zerosPct,
    meanVelocity,
    meanConsumedPerCycle: meanConsumed,
    meanTransferredPerCycle: meanTransferred,
    emittedTotal: rows.reduce((a, r) => a + r.issued, 0),
    destroyedTotal: rows.reduce((a, r) => a + r.destroyed, 0),
    netSupply: r1.supply - (rows[0]?.supply ?? 0),
    finalSupply: r1.supply,
    finalUsers: r1.users,
  };
}