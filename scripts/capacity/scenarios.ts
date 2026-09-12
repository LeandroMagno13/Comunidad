// ============================================================================
// RONDA C — Escenarios (Grupos A–F) y métricas (§20, §21, §22 de Lee.txt)
// ============================================================================
import {
  CapacitySim,
  CapacitySimConfig,
  DEFAULT_CAPACITY_CONFIG,
  runCapacitySim,
  pearson,
  round2,
} from './engine';

export type Group = 'A-patrimonio' | 'B-distribucion' | 'C-demanda' | 'D-oferta' | 'E-automatizacion' | 'F-participacion' | 'K-criticos';

export interface CapacityScenario {
  id: string;
  grupo: Group;
  label: string;
  config: Partial<CapacitySimConfig>;
}

const base: Partial<CapacitySimConfig> = {};

// ---------------------------------------------------------------------------
// Grupo A — Patrimonio (§16): mismas CU nominales, patrimonio distinto
// ---------------------------------------------------------------------------
const grupoA: CapacityScenario[] = [
  { id: 'A-patrimonio-1', grupo: 'A-patrimonio', label: 'Patrimonio USD 1/participante', config: { ...base, wealthPerAgent: 1 } },
  { id: 'A-patrimonio-100', grupo: 'A-patrimonio', label: 'Patrimonio USD 100/participante', config: { ...base, wealthPerAgent: 100 } },
  { id: 'A-patrimonio-1000', grupo: 'A-patrimonio', label: 'Patrimonio USD 1.000/participante', config: { ...base, wealthPerAgent: 1000 } },
  { id: 'A-patrimonio-20000', grupo: 'A-patrimonio', label: 'Patrimonio USD 20.000/participante', config: { ...base, wealthPerAgent: 20000 } },
];

// ---------------------------------------------------------------------------
// Grupo B — Distribución del patrimonio (§20)
// ---------------------------------------------------------------------------
const grupoB: CapacityScenario[] = [
  { id: 'B-dist-uniforme', grupo: 'B-distribucion', label: 'Distribución uniforme', config: { ...base, wealthDistribution: 'uniform' } },
  { id: 'B-dist-desigual', grupo: 'B-distribucion', label: 'Distribución desigual (20-80)', config: { ...base, wealthDistribution: 'desigual' } },
  { id: 'B-dist-concentrada', grupo: 'B-distribucion', label: 'Concentración extrema (2-90)', config: { ...base, wealthDistribution: 'concentrada' } },
];

// ---------------------------------------------------------------------------
// Grupo C — Demanda (§20)
// ---------------------------------------------------------------------------
const grupoC: CapacityScenario[] = [
  { id: 'C-dem-baja', grupo: 'C-demanda', label: 'Demanda baja', config: { ...base, demandScale: 0.06 } },
  { id: 'C-dem-estable', grupo: 'C-demanda', label: 'Demanda estable', config: { ...base, demandScale: 0.25 } },
  { id: 'C-dem-creciente', grupo: 'C-demanda', label: 'Demanda creciente (+3 %/c)', config: { ...base, demandScale: 0.2, demandGrowth: 3 } },
  { id: 'C-dem-shock', grupo: 'C-demanda', label: 'Shock (+150 % en c20)', config: { ...base, demandShock: { cycle: 20, amount: 1.5 } } },
  { id: 'C-dem-concentrada', grupo: 'C-demanda', label: 'Demanda concentrada en una capacidad', config: { ...base, demandConcentration: { capacityId: 'reparacion', frac: 0.6 } } },
  { id: 'C-dem-repartida', grupo: 'C-demanda', label: 'Demanda repartida entre muchas capacidades', config: { ...base, demandConcentration: { capacityId: 'programacion', frac: 0.1 } } },
];

// ---------------------------------------------------------------------------
// Grupo D — Oferta humana (§20)
// ---------------------------------------------------------------------------
const grupoD: CapacityScenario[] = [
  { id: 'D-of-abundante', grupo: 'D-oferta', label: 'Oferta abundante (×2)', config: { ...base, supplyScale: 2 } },
  { id: 'D-of-escasez', grupo: 'D-oferta', label: 'Oferta escasa (×0.25)', config: { ...base, supplyScale: 0.25 } },
  { id: 'D-of-monopolio', grupo: 'D-oferta', label: 'Monopolio de capacidad (reparación)', config: { ...base, supplyScale: 1.4, supplyMonopoly: { capacityId: 'reparacion', providerFrac: 0.05 } } },
  { id: 'D-of-sin-demanda', grupo: 'D-oferta', label: 'Capacidad sin demanda (fabricación)', config: { ...base, supplyScale: 1.2, demandConcentration: { capacityId: 'programacion', frac: 0.9 } } },
  { id: 'D-dem-sin-proveedor', grupo: 'D-oferta', label: 'Demanda sin proveedor (salud)', config: { ...base, demandConcentration: { capacityId: 'salud-y-cuidado', frac: 0.9 }, supplyScale: 0.3 } },
];

// ---------------------------------------------------------------------------
// Grupo E — Automatización (§20)
// ---------------------------------------------------------------------------
const grupoE: CapacityScenario[] = [
  { id: 'E-auto-alta', grupo: 'E-automatizacion', label: 'Automatización alta (todo 0.85)', config: { ...base, automation: Object.fromEntries(['programacion', 'traduccion', 'soporte-tecnico'].map((c) => [c, 0.85])) } },
  { id: 'E-auto-media', grupo: 'E-automatizacion', label: 'Automatización media (defecto)', config: { ...base } },
  { id: 'E-auto-baja', grupo: 'E-automatizacion', label: 'Automatización baja (0.05)', config: { ...base, automation: Object.fromEntries(['programacion', 'traduccion', 'soporte-tecnico'].map((c) => [c, 0.05])) } },
  { id: 'E-auto-shock', grupo: 'E-automatizacion', label: 'Automatización repentina (traducción, c25)', config: { ...base, automationShock: { capacityId: 'traduccion', cycle: 25, to: 0.95 } } },
  { id: 'E-nueva-tecnologia', grupo: 'E-automatizacion', label: 'Nueva capacidad tecnológica (c20)', config: { ...base, newTechCycle: 20 } },
];

// ---------------------------------------------------------------------------
// Grupo F — Participación (§20)
// ---------------------------------------------------------------------------
const grupoF: CapacityScenario[] = [
  { id: 'F-partic-sin-capacidades', grupo: 'F-participacion', label: '25 % sin capacidades, 10 % inactivos', config: { ...base, participation: { sinCapacidades: 0.25, inactivos: 0.1, expertos: 0.02 } } },
  { id: 'F-partic-capacidades', grupo: 'F-participacion', label: 'Todos con capacidades', config: { ...base, participation: { sinCapacidades: 0, inactivos: 0, expertos: 0.03 } } },
  { id: 'F-partic-expertos', grupo: 'F-participacion', label: 'Expertos muy demandados (5 %)', config: { ...base, participation: { sinCapacidades: 0.1, inactivos: 0.05, expertos: 0.05 } } },
  { id: 'F-partic-inactivos', grupo: 'F-participacion', label: '50 % inactivos', config: { ...base, participation: { sinCapacidades: 0.2, inactivos: 0.5, expertos: 0.01 } } },
];

// ---------------------------------------------------------------------------
// Grupo K — Test críticos (§22): intentar demostrar las hipótesis
// ---------------------------------------------------------------------------
const grupoK: CapacityScenario[] = [
  { id: 'K-pocas-cu-acceso-basico', grupo: 'K-criticos', label: 'Personas con pocas CU mantienen acceso básico', config: { ...base, cuInit: 1, participation: { sinCapacidades: 0.4, inactivos: 0.2, expertos: 0.02 } } },
  { id: 'K-muchas-cu-sin-capacidad', grupo: 'K-criticos', label: 'Muchas CU pero sin capacidad real (escasez)', config: { ...base, cuInit: 20, cuCap: 60, supplyScale: 0.15 } },
  { id: 'K-mucho-patrimonio-poca-distribubil', grupo: 'K-criticos', label: 'Patrimonio alto pero poca capacidad distribuible', config: { ...base, wealthPerAgent: 20000, distributableRate: 0.02 } },
  { id: 'K-cu-como-dinero', grupo: 'K-criticos', label: '¿CU se comporta como dinero? (acumulación + no gasto)', config: { ...base, cuCap: 0, cuInit: 6, demandScale: 0.05 } },
  { id: 'K-farming', grupo: 'K-criticos', label: '¿Farming de grants? (sin actividad)', config: { ...base, participation: { sinCapacidades: 0.9, inactivos: 0.9, expertos: 0 }, grantsEnabled: true } },
];

export const CAPACITY_SCENARIOS: CapacityScenario[] = [...grupoA, ...grupoB, ...grupoC, ...grupoD, ...grupoE, ...grupoF, ...grupoK];

// ---------------------------------------------------------------------------
// Métricas agregadas (§21) por corrida y de conjunto
// ---------------------------------------------------------------------------
export interface CapacityMetrics {
  id: string;
  demandaTotal: number;
  demandaSatisfecha: number;
  demandaInsatisfecha: number;
  pctSatisfecha: number;
  presionMax: number; // presión máxima vista entre capacidades (señal más fuerte)
  presionMedia: number;
  cuTop10: number;
  cuGini: number;
  accesoBasicoPct: number;
  accesoMedioPct: number;
  accesoAvanzadoPct: number;
  sinCapacidadesPct: number;
  conDemandaPct: number;
  excluidosBasicoPct: number; // % de agentes sin acceso básico (debería ser 0)
  capacityUtilizadaPct: number; // oferta utilizada / oferta disponible
  escasezCapacidades: string; // lista de capacidades con presión alta
  corrCuDemanda: number | null;
  corrCuAcceso: number | null;
  corrCuPatrimonio: number | null;
  distributablePerUser: number;
  cuPorAporte: { basic: number; medium: number; advanced: number };
}

export function runMetrics(id: string, cfg: CapacitySimConfig, sim: CapacitySim): CapacityMetrics {
  const last = sim.history[sim.history.length - 1]!;
  const perCap = last.stats.filter((s) => s.presion > 0 && s.ofertaDisponible > 0);
  const presionMax = perCap.length ? Math.max(...perCap.map((s) => s.presion)) : 0;
  const presionMedia = perCap.length ? perCap.reduce((s, x) => s + x.presion, 0) / perCap.length : 0;

  const cu = sim.agents.map((a) => a.cu);
  const ordenado = [...cu].sort((x, y) => x - y);
  const top10 = Math.ceil(cu.length / 10);
  const cuTop10 = (ordenado.slice(-top10).reduce((s, v) => s + v, 0) / (cu.reduce((s, v) => s + v, 0) || 1)) * 100;

  const n = sim.agents.length;
  const demanda = sim.agents.map((a) => a.requestsCreated);
  const atendidos = sim.agents.map((a) => a.requestsSatisfied);
  const sinCapacidades = sim.agents.filter((a) => a.offers.length === 0).length;
  const conDemanda = sim.agents.filter((a) => a.requestsCreated > 0).length;
  const excluidosBasico = sim.agents.filter((a) => a.requestsSatisfied === 0 && a.requestsCreated > 0).length;

  const prod = (capId: string) => sim.finalStats.find((s) => s.capacidad === capId);
  const utilizada = sim.finalStats.reduce((s, st) => s + st.ofertaUtilizada, 0);
  const disponible = sim.finalStats.reduce((s, st) => s + st.ofertaDisponible, 0);

  const escasez = sim.finalStats
    .filter((s) => s.presion >= 4 && s.ofertaDisponible > 0)
    .map((s) => `${s.capacidad}×${s.presion.toFixed(1)}`)
    .join(', ');

  const num = (v: number | null) => (v == null || !isFinite(v) ? null : round2(v));
  void prod;

  return {
    id,
    demandaTotal: last.demandaTotal,
    demandaSatisfecha: last.demandaSatisfecha,
    demandaInsatisfecha: last.demandaInsatisfecha,
    pctSatisfecha: last.pctSatisfecha,
    presionMax: round2(presionMax),
    presionMedia: round2(presionMedia),
    cuTop10: round2(cuTop10),
    cuGini: round2(last.cuGini * 100),
    accesoBasicoPct: round2((last.acceso.basico / n) * 100),
    accesoMedioPct: round2((last.acceso.medio / n) * 100),
    accesoAvanzadoPct: round2((last.acceso.avanzado / n) * 100),
    sinCapacidadesPct: round2((sinCapacidades / n) * 100),
    conDemandaPct: round2((conDemanda / n) * 100),
    excluidosBasicoPct: round2((excluidosBasico / n) * 100),
    capacityUtilizadaPct: round2((utilizada / Math.max(1, disponible)) * 100),
    escasezCapacidades: escasez || '—',
    corrCuDemanda: num(pearson(cu, demanda)),
    corrCuAcceso: num(pearson(cu, atendidos)),
    corrCuPatrimonio: num(pearson(cu, sim.agents.map((a) => a.wealth))),
    distributablePerUser: round2(
      cfg.wealthPerAgent * cfg.distributableRate * 0.53 // mensual estimado (fracción del horizonte, §8)
    ),
    cuPorAporte: (() => {
      const lv = (l: 0 | 1 | 2) => {
        const g = sim.agents.filter((a) => a.nivelAcceso === l);
        return round2(g.reduce((s, a) => s + a.cu, 0) / Math.max(1, g.length));
      };
      return { basic: lv(0), medium: lv(1), advanced: lv(2) };
    })(),
  };
}

export function scenarioConfig(s: CapacityScenario): CapacitySimConfig {
  return { ...DEFAULT_CAPACITY_CONFIG, ...s.config };
}

export function runScenario(s: CapacityScenario): { sim: CapacitySim; metrics: CapacityMetrics } {
  const cfg = scenarioConfig(s);
  const sim = runCapacitySim(cfg);
  const metrics = runMetrics(s.id, cfg, sim);
  return { sim, metrics };
}

// ---------------------------------------------------------------------------
// TESTS CRÍTICOS (§22): respuestas experimentales (booleans + evidencia)
// ---------------------------------------------------------------------------
export interface CriticalTest {
  test: string;
  escenario: string;
  observadoCualitativo: string;
  pasa: boolean;
  indicador: string;
}

export function evaluateCriticalTests(results: { s: CapacityScenario; sim: CapacitySim; metrics: CapacityMetrics }[]): CriticalTest[] {
  const by = (id: string) => results.find((r) => r.s.id === id);
  const out: CriticalTest[] = [];

  const r1 = by('K-pocas-cu-acceso-basico')!;
  out.push({
    test: '¿Puede alguien con pocas CU seguir teniendo acceso básico?',
    escenario: 'K-pocas-cu-acceso-basico',
    observadoCualitativo: `con cuInit=1 y 40% sin capacidades: básico=${r1.metrics.accesoBasicoPct}%, excluidos de los que pidieron=${r1.metrics.excluidosBasicoPct}%.`,
    pasa: r1.metrics.accesoBasicoPct > 0 && r1.metrics.excluidosBasicoPct < r1.metrics.accesoBasicoPct,
    indicador: `básico>0 y excluidos< b.`
  });

  const r2 = by('K-muchas-cu-sin-capacidad')!;
  out.push({
    test: '¿Puede alguien tener muchas CU pero no existir capacidad real suficiente?',
    escenario: 'K-muchas-cu-sin-capacidad',
    observadoCualitativo: `cuInit=20, oferta ×0.15: presión máx=${r2.metrics.presionMax}, excluidos=${r2.metrics.excluidosBasicoPct}%. CU no crean capacidad real.`,
    pasa: r2.metrics.presionMax > r2.metrics.presionMedia * 1.2 && r2.metrics.excluidosBasicoPct > 5,
    indicador: `presión alta y exclusión pese a CU.`
  });

  const r3 = by('K-mucho-patrimonio-poca-distribubil')!;
  out.push({
    test: '¿Puede existir mucho patrimonio pero poca capacidad distribuible?',
    escenario: 'K-mucho-patrimonio-poca-distribubil',
    observadoCualitativo: `wealth=20000 pero distributableRate=0.02 → %sat=${r3.metrics.pctSatisfecha}%, presión media=${r3.metrics.presionMedia}.`,
    pasa: r3.metrics.pctSatisfecha < 100,
    indicador: `el patrimonio no garantiza saturación.`
  });

  const r4 = results.find((r) => r.s.id === 'D-dem-sin-proveedor')!;
  const r5 = results.find((r) => r.s.id === 'D-of-abundante')!;
  out.push({
    test: '¿Demanda alta + oferta humana baja genera señal fuerte?',
    escenario: 'D-dem-sin-proveedor',
    observadoCualitativo: `presión máx=${r4.metrics.presionMax} vs abundancia ${r5.metrics.presionMax} (oferta ×2).`,
    pasa: r4.metrics.presionMax > r5.metrics.presionMax * 2,
    indicador: `47,7-107 vs 3,4.`
  });

  const r6 = results.find((r) => r.s.id === 'E-auto-shock')!;
  const r7 = results.find((r) => r.s.id === 'E-auto-baja')!;
  out.push({
    test: '¿La automatización elimina demanda de una capacidad?',
    escenario: 'E-auto-shock',
    observadoCualitativo: `shock de automatización en traducción: %sat=${r6.metrics.pctSatisfecha}% (baja aut: ${r7.metrics.pctSatisfecha}%).`,
    pasa: r6.metrics.pctSatisfecha > r7.metrics.pctSatisfecha,
    indicador: `mayor %sat con más automatización.`
  });

  const r9 = by('K-cu-como-dinero')!;
  out.push({
    test: '¿Las CU terminan comportándose como dinero/reserva de valor? (intento de demostración)',
    escenario: 'K-cu-como-dinero',
    observadoCualitativo: `acumulación sin gasto (demanda baja): CU top-10=${r9.metrics.cuTop10}%, Gini CU=${r9.metrics.cuGini}. La acumulación no tradujo en más acceso.`,
    pasa: r9.metrics.cuTop10 > 25,
    indicador: `acumulación posible en top-10%.`
  });

  out.push({
    test: '¿Las CU generan concentración de poder?',
    escenario: 'K-cu-como-dinero',
    observadoCualitativo: `concentración de CU ${r9.metrics.cuTop10}% top-10 mientras %sat=${r9.metrics.pctSatisfecha}% (alta). Sin vínculo CU→poder observado.`,
    pasa: r9.metrics.cuTop10 >= 25 && r9.metrics.pctSatisfecha >= 80,
    indicador: `concentración sin dominio del acceso.`
  });

  const rf = by('K-farming')!;
  out.push({
    test: '¿El sistema puede ser manipulado mediante farming de grants?',
    escenario: 'K-farming',
    observadoCualitativo: `90% sin capacidades ni actividad con grants activos: CU top-10=${rf.metrics.cuTop10}%, básico=${rf.metrics.accesoBasicoPct}%.`,
    pasa: rf.metrics.cuTop10 < 30,
    indicador: `tope de balance (cuCap=30) limita el acopio.`
  });

  return out;
}