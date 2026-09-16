// ============================================================================
// RONDA C+D — Ensayo de stress de CAPACIDAD (equivalente del ensayo de stress
// de RONDA A, pero sobre el motor de capacidad vigente con RONDA D).
//
// 16 escenarios minimos (E01..E16) equivalentes en intencion a los de RONDA A,
// cada uno con su espejo LEGACY (L-EXX: urgencia DESACTIVADA = RONDA C pura).
// Barridos (D1..D10) y Monte Carlo (200 corridas) para la tarjeta de la
// suprasenal: % satisfecho, presion, acceso, urgencia, dignidad.
//
// Determinismo: misma semilla, mismo output (mulberry32 del engine).
// Ejecutar: npx tsx scripts/stress-capacity/main.ts  (desde C:\Comunidad)
// ============================================================================
import {
  CapacitySim,
  CapacitySimConfig,
  DEFAULT_CAPACITY_CONFIG,
  runCapacitySim,
  round2,
  pearson,
} from '../capacity/engine';
import { urgencyCost, urgencyBudgetFor } from '@/src/lib/cap-formulas';

// ---------------------------------------------------------------------------
// Config basica de RONDA D (urgencia activa) sobre la base de RONDA C
// ---------------------------------------------------------------------------
const D = (overrides: Partial<CapacitySimConfig> = {}): CapacitySimConfig => ({
  ...DEFAULT_CAPACITY_CONFIG,
  ...overrides,
  ...(overrides.urgency === undefined
    ? { urgency: { enabled: true, budgetBase: 3, maxLevel: 3, periodCycles: 7, propensity: 0.5, useBudget: true } }
    : {}),
});

// ---------------------------------------------------------------------------
// Los 16 escenarios minimos (E-scenarios). Nombres paralelos a RONDA A.
// ---------------------------------------------------------------------------
export interface StressScenario {
  id: string;
  label: string;
  grupo: string;
  config: CapacitySimConfig;
}

const base = (o: Partial<CapacitySimConfig> = {}) => D(o);

const E_SCENARIOS: { id: string; label: string; grupo: string; config: Partial<CapacitySimConfig> }[] = [
  { id: 'E01-equilibrio', label: 'Equilibrio: oferta y demanda nominales (dignidad ok)', grupo: 'minimos', config: { agents: 200 } },
  { id: 'E02-equilibrio-grande', label: 'Equilibrio a escala (1.000 participantes)', grupo: 'minimos', config: { agents: 1000 } },
  { id: 'E03-escasez-extrema', label: 'Escasez extrema de capacidad (oferta x0.25)', grupo: 'minimos', config: { supplyScale: 0.25 } },
  { id: 'E04-abundancia-extrema', label: 'Abundancia extrema (oferta x3)', grupo: 'minimos', config: { supplyScale: 3 } },
  { id: 'E05-crecimiento', label: 'Crecimiento constante de demanda (+3%/ciclo)', grupo: 'minimos', config: { demandGrowth: 3 } },
  { id: 'E06-shock-demanda', label: 'Shock de demanda (+100% en c20)', grupo: 'minimos', config: { demandShock: { cycle: 20, amount: 1.0 } } },
  { id: 'E07-shock-oferta', label: 'Shock de oferta humana (automatizacion traduccion, c20)', grupo: 'minimos', config: { automationShock: { capacityId: 'traduccion', cycle: 20, to: 0.95 } } },
  { id: 'E08-escasez-persistente', label: 'Escasez persistente (demanda alta, oferta baja)', grupo: 'minimos', config: { demandScale: 0.5, supplyScale: 0.2 } },
  { id: 'E09-shock-combinado', label: 'Shock combinado (demanda+ y automatizacion shock)', grupo: 'minimos', config: { demandShock: { cycle: 20, amount: 1.5 }, automationShock: { capacityId: 'traduccion', cycle: 20, to: 0.95 } } },
  { id: 'E10-alta-volatilidad', label: 'Alta volatilidad (crecimiento + shock)', grupo: 'minimos', config: { demandGrowth: 5, demandShock: { cycle: 20, amount: 1.0 } } },
  { id: 'E11-nuevos-usuarios', label: 'Masa de nuevos usuarios sin capacidades', grupo: 'minimos', config: { agents: 500, participation: { sinCapacidades: 0.3, inactivos: 0.2, expertos: 0.02 } } },
  { id: 'E12-concentracion', label: 'Concentracion de patrimonio (plus demanda c/ concentrada)', grupo: 'minimos', config: { wealthDistribution: 'concentrada', demandConcentration: { capacityId: 'reparacion', frac: 0.5 } } },
  { id: 'E13-urgencia-saturada', label: 'Urgencia saturada (propensity 1.0, gasto total)', grupo: 'minimos', config: { urgency: { enabled: true, budgetBase: 3, maxLevel: 3, periodCycles: 7, propensity: 1.0, useBudget: true } } },
  { id: 'E14-urgencia-escasez', label: 'Urgencia con presupuesto minimo (base 1)', grupo: 'minimos', config: { urgency: { enabled: true, budgetBase: 1, maxLevel: 3, periodCycles: 7, propensity: 1.0, useBudget: true } } },
  { id: 'E15-casi-vacio', label: 'Sistema casi vacio (5 participantes)', grupo: 'minimos', config: { agents: 5, demandScale: 0.05 } },
  { id: 'E16-sistema-enorme', label: 'Sistema enorme (5.000 participantes, 30 ciclos)', grupo: 'minimos', config: { agents: 5000, cycles: 30 } },
];

// RONDA D (urgencia activa) + espejo LEGACY (RONDA C pura) por cada E-escenario
export const STRESS_SCENARIOS: StressScenario[] = [];
for (const e of E_SCENARIOS) {
  STRESS_SCENARIOS.push({ id: e.id, label: `[D] ${e.label}`, grupo: e.grupo, config: base(e.config) });
  const legacyConfig = base(e.config);
  legacyConfig.urgency = undefined;
  STRESS_SCENARIOS.push({ id: `L-${e.id}`, label: `[C] ${e.label}`, grupo: e.grupo, config: legacyConfig });
}

// ---------------------------------------------------------------------------
// Barridos (D-series): 10 ejes. Cada serie es un conjunto de corridas que
// varıa UN solo parametro (todo lo demas = base con urgencia activa).
// ---------------------------------------------------------------------------
export interface SweepSeries {
  id: string;
  label: string;
  axis: string;
  cases: { id: string; label: string; config: CapacitySimConfig }[];
}

function sweepCases(id: string, axis: string, values: { id: string; label: string; patch: Partial<CapacitySimConfig> }[]): SweepSeries {
  return {
    id,
    label: axis,
    axis,
    cases: values.map((v) => ({ id: `${id}-${v.id}`, label: v.label, config: base(v.patch) })),
  };
}

export const SWEEP_SERIES: SweepSeries[] = [
  sweepCases('D1-poblacion', 'agentes', [
    { id: 'n5', label: '5', patch: { agents: 5 } },
    { id: 'n50', label: '50', patch: { agents: 50 } },
    { id: 'n200', label: '200', patch: { agents: 200 } },
    { id: 'n500', label: '500', patch: { agents: 500 } },
    { id: 'n1000', label: '1.000', patch: { agents: 1000 } },
    { id: 'n5000', label: '5.000', patch: { agents: 5000 } },
  ]),
  sweepCases('D2-demanda', 'demandScale', [
    { id: 'baja', label: '0.05', patch: { demandScale: 0.05 } },
    { id: 'media', label: '0.15', patch: { demandScale: 0.15 } },
    { id: 'nominal', label: '0.25', patch: { demandScale: 0.25 } },
    { id: 'alta', label: '0.5', patch: { demandScale: 0.5 } },
    { id: 'extrema', label: '1.0', patch: { demandScale: 1.0 } },
  ]),
  sweepCases('D3-oferta', 'supplyScale', [
    { id: 'muybaja', label: '0.2', patch: { supplyScale: 0.2 } },
    { id: 'baja', label: '0.5', patch: { supplyScale: 0.5 } },
    { id: 'nominal', label: '1', patch: { supplyScale: 1 } },
    { id: 'alta', label: '2', patch: { supplyScale: 2 } },
    { id: 'muyalta', label: '4', patch: { supplyScale: 4 } },
  ]),
  sweepCases('D4-participacion', 'participacion (sinCapacidades)', [
    { id: 'p0', label: '0%', patch: { participation: { sinCapacidades: 0, inactivos: 0, expertos: 0.02 } } },
    { id: 'p20', label: '20%', patch: { participation: { sinCapacidades: 0.2, inactivos: 0.1, expertos: 0.02 } } },
    { id: 'p40', label: '40%', patch: { participation: { sinCapacidades: 0.4, inactivos: 0.2, expertos: 0.02 } } },
    { id: 'p60', label: '60%', patch: { participation: { sinCapacidades: 0.6, inactivos: 0.3, expertos: 0.02 } } },
  ]),
  sweepCases('D5-urgencia-propension', 'urgencia propensity', [
    { id: 'p0', label: '0.0', patch: { urgency: { enabled: true, budgetBase: 3, maxLevel: 3, periodCycles: 7, propensity: 0, useBudget: true } } },
    { id: 'p25', label: '0.25', patch: { urgency: { enabled: true, budgetBase: 3, maxLevel: 3, periodCycles: 7, propensity: 0.25, useBudget: true } } },
    { id: 'p50', label: '0.5', patch: { urgency: { enabled: true, budgetBase: 3, maxLevel: 3, periodCycles: 7, propensity: 0.5, useBudget: true } } },
    { id: 'p75', label: '0.75', patch: { urgency: { enabled: true, budgetBase: 3, maxLevel: 3, periodCycles: 7, propensity: 0.75, useBudget: true } } },
    { id: 'p100', label: '1.0', patch: { urgency: { enabled: true, budgetBase: 3, maxLevel: 3, periodCycles: 7, propensity: 1.0, useBudget: true } } },
  ]),
  sweepCases('D6-urgencia-presupuesto', 'urgencia budgetBase', [
    { id: 'b1', label: '1', patch: { urgency: { enabled: true, budgetBase: 1, maxLevel: 3, periodCycles: 7, propensity: 0.5, useBudget: true } } },
    { id: 'b2', label: '2', patch: { urgency: { enabled: true, budgetBase: 2, maxLevel: 3, periodCycles: 7, propensity: 0.5, useBudget: true } } },
    { id: 'b3', label: '3', patch: { urgency: { enabled: true, budgetBase: 3, maxLevel: 3, periodCycles: 7, propensity: 0.5, useBudget: true } } },
    { id: 'b5', label: '5', patch: { urgency: { enabled: true, budgetBase: 5, maxLevel: 3, periodCycles: 7, propensity: 0.5, useBudget: true } } },
    { id: 'b9', label: '9', patch: { urgency: { enabled: true, budgetBase: 9, maxLevel: 3, periodCycles: 7, propensity: 0.5, useBudget: true } } },
  ]),
  sweepCases('D7-urgencia-nivel', 'urgencia maxLevel', [
    { id: 'l1', label: '1', patch: { urgency: { enabled: true, budgetBase: 3, maxLevel: 1, periodCycles: 7, propensity: 0.5, useBudget: true } } },
    { id: 'l2', label: '2', patch: { urgency: { enabled: true, budgetBase: 3, maxLevel: 2, periodCycles: 7, propensity: 0.5, useBudget: true } } },
    { id: 'l3', label: '3', patch: { urgency: { enabled: true, budgetBase: 3, maxLevel: 3, periodCycles: 7, propensity: 0.5, useBudget: true } } },
  ]),
  sweepCases('D8-automatizacion', 'automatizacion (todas)', [
    { id: 'auto', label: '0.85', patch: { automation: Object.fromEntries(['programacion', 'traduccion', 'soporte-tecnico'].map((c) => [c, 0.85])) } },
    { id: 'nominal', label: 'base', patch: {} },
    { id: 'mano', label: '0.05', patch: { automation: Object.fromEntries(['programacion', 'traduccion', 'soporte-tecnico'].map((c) => [c, 0.05])) } },
  ]),
  sweepCases('D9-patrimonio', 'wealthPerAgent', [
    { id: 'w1', label: 'USD 1', patch: { wealthPerAgent: 1 } },
    { id: 'w100', label: 'USD 100', patch: { wealthPerAgent: 100 } },
    { id: 'w1000', label: 'USD 1.000', patch: { wealthPerAgent: 1000 } },
    { id: 'w20000', label: 'USD 20.000', patch: { wealthPerAgent: 20000 } },
  ]),
  sweepCases('D10-shock-demanda', 'demandShock.amount', [
    { id: 's0', label: 'sin', patch: { demandShock: null } },
    { id: 's50', label: '+50%', patch: { demandShock: { cycle: 20, amount: 0.5 } } },
    { id: 's100', label: '+100%', patch: { demandShock: { cycle: 20, amount: 1.0 } } },
    { id: 's200', label: '+200%', patch: { demandShock: { cycle: 20, amount: 2.0 } } },
  ]),
];

// ---------------------------------------------------------------------------
// Metricas por corrida (final del horizonte) — espejo de las de RONDA C con
// anhadidos de urgencia y dignidad.
// ---------------------------------------------------------------------------
export interface StressMetrics {
  id: string;
  demandaTotal: number;
  demandaSatisfecha: number;
  demandaInsatisfecha: number;
  pctSatisfecha: number;
  presionMax: number;
  presionMedia: number;
  accesoBasicoPct: number;
  accesoMedioPct: number;
  accesoAvanzadoPct: number;
  excluidosBasicoPct: number;
  cuTop10: number;
  cuGini: number;
  urgenciaMarcadaPct: number; // % de solicitudes marcadas como urgentes
  urgenciaGastoPct: number; // % del presupuesto de urgencia gastado
  urgenciaAgotadaPct: number; // % de agentes con presupuesto en 0 al cierre
  urgenciaEficaciaPct: number; // % de urgentes satisfechas
  dignidadHeadcountPct: number; // % de agentes bajo el piso de actividad
  dignidadBrecha: number; // brecha media del piso (0 = sin brecha)
  capacidadUtilizadaPct: number;
  escasezCapacidades: string;
  corrCuUrgencia: number | null; // correlacion CU vs urgencia (senalidad de la senal)
}

export function runMetrics(id: string, cfg: CapacitySimConfig, sim: CapacitySim): StressMetrics {
  const last = sim.history[sim.history.length - 1]!;
  const perCap = last.stats.filter((s) => s.presion > 0 && s.ofertaDisponible > 0);
  const presionMax = perCap.length ? Math.max(...perCap.map((s) => s.presion)) : 0;
  const presionMedia = perCap.length ? perCap.reduce((s, x) => s + x.presion, 0) / perCap.length : 0;

  const cu = sim.agents.map((a) => a.cu);
  const ordenado = [...cu].sort((x, y) => x - y);
  const top10 = Math.ceil(cu.length / 10);
  const cuTop10 = (ordenado.slice(-top10).reduce((s, v) => s + v, 0) / (cu.reduce((s, v) => s + v, 0) || 1)) * 100;

  const n = sim.agents.length;
  const excluidos = sim.agents.filter((a) => a.requestsCreated > 0 && a.requestsSatisfied === 0).length;

  const utilizada = sim.finalStats.reduce((s, st) => s + st.ofertaUtilizada, 0);
  const disponible = sim.finalStats.reduce((s, st) => s + st.ofertaDisponible, 0);

  const escasez = sim.finalStats
    .filter((s) => s.presion >= 4 && s.ofertaDisponible > 0)
    .map((s) => `${s.capacidad}x${s.presion.toFixed(1)}`)
    .join(', ');

  const urg = last.urgencia ? { at: last.urgencia } : null;
  const marcas = sim.requests.filter((r) => r.urgencyLevel > 0).length;
  const urgenciaMarcadaPct = (marcas / Math.max(1, sim.requests.length)) * 100;
  const urgenciaGastoPct = urg ? (urg.at.presupuestoGastado / Math.max(1, urg.at.presupuestoTotal * (sim.history.length / Math.max(1, cfg.urgency?.periodCycles ?? 7)))) * 100 : 0;
  const urgenciaAgotadaPct = urg ? (urg.at.agotados / n) * 100 : 0;
  const urgenciaEficaciaPct = urg ? urg.at.eficaciaUrgente : 0;
  const dig = last.dignidad ? { headcount: last.dignidad.headcount, brecha: last.dignidad.brecha } : { headcount: 0, brecha: 0 };

  // Urgencia marcada por agente, correlacionada con saldo CU.
  const urgenciaPorAgente = sim.agents.map((a) => {
    const rq = sim.requests.filter((r) => r.agent === a.id && r.urgencyLevel > 0);
    return rq.length;
  });

  return {
    id,
    demandaTotal: last.demandaTotal,
    demandaSatisfecha: last.demandaSatisfecha,
    demandaInsatisfecha: last.demandaInsatisfecha,
    pctSatisfecha: round2(last.pctSatisfecha),
    presionMax: round2(presionMax),
    presionMedia: round2(presionMedia),
    accesoBasicoPct: round2((last.acceso.basico / n) * 100),
    accesoMedioPct: round2((last.acceso.medio / n) * 100),
    accesoAvanzadoPct: round2((last.acceso.avanzado / n) * 100),
    excluidosBasicoPct: round2((excluidos / n) * 100),
    cuTop10: round2(cuTop10),
    cuGini: round2(last.cuGini * 100),
    urgenciaMarcadaPct: round2(urgenciaMarcadaPct),
    urgenciaGastoPct: round2(urgenciaGastoPct),
    urgenciaAgotadaPct: round2(urgenciaAgotadaPct),
    urgenciaEficaciaPct: round2(urgenciaEficaciaPct),
    dignidadHeadcountPct: round2(dig.headcount),
    dignidadBrecha: round2(dig.brecha),
    capacidadUtilizadaPct: round2((utilizada / Math.max(1, disponible)) * 100),
    escasezCapacidades: escasez || '-',
    corrCuUrgencia: pearson(cu, urgenciaPorAgente) == null ? null : round2(pearson(cu, urgenciaPorAgente)!),
  };
}

// ---------------------------------------------------------------------------
// Monte Carlo: 200 corridas sobre la config base con jitter determinista.
// ---------------------------------------------------------------------------
export interface MonteCarloRun {
  run: number;
  seed: number;
  jitter: { demandScale: number; supplyScale: number; demandGrowth: number; propensity: number; budgetBase: number };
  metrics: StressMetrics;
}

export function runMonteCarlo(runs: number, seedBase: number): MonteCarloRun[] {
  const out: MonteCarloRun[] = [];
  for (let r = 1; r <= runs; r++) {
    const seed = seedBase + r * 7919;
    // jitter determinista derivado de la semilla
    const j = mulberryJSegment(seed);
    const demandScale = clamp(0.05 + j[0]! * 0.45, 0.02, 1.2);
    const supplyScale = clamp(0.2 + j[1]! * 1.8, 0.1, 4);
    const demandGrowth = j[2]! > 0.75 ? 3 + Math.floor(j[2]! * 4) : 0;
    const propensity = clamp(0.1 + j[3]! * 0.9, 0, 1);
    const budgetBase = 1 + Math.floor(j[4]! * 8);
    const cfg = base({ seed, demandScale, supplyScale, demandGrowth, urgency: { enabled: true, budgetBase, maxLevel: 3, periodCycles: 7, propensity, useBudget: true } });
    const sim = runCapacitySim(cfg);
    out.push({ run: r, seed, jitter: { demandScale, supplyScale, demandGrowth, propensity, budgetBase }, metrics: runMetrics(`MC-${r}`, cfg, sim) });
  }
  return out;
}

function mulberryJSegment(seedBase: number): number[] {
  // multiplaza una instancia mulberry32 para generar segmentos de ruido
  let a = (seedBase * 2654435761) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < 6; i++) {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    out.push(((t ^ (t >>> 14)) >>> 0) / 4294967296);
  }
  return out;
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}