// ============================================================================
// Auditoría RONDA C — tests conceptuales §8-§15
//
// Reproduce el comportamiento REAL del engine (scripts/capacity/engine.ts)
// con configuraciones que approximan cada prueba conceptual. Los resultados
// se escriben en evidence/capacidad/auditoria/audit-tests.json y se imprimen
// en consola como tabla legible.
//
// NO MODIFICA el engine; es un script de análisis.
// Ejecutar: npx tsx scripts/capacity/audit-tests.ts
// ============================================================================
import * as fs from 'fs';
import * as path from 'path';
import { runCapacitySim, CAPACITY_CATALOG, CapacitySim, CapacitySimConfig } from './engine';

const OUT_DIR = 'evidence/capacidad/auditoria';

function ensureDir(p: string) { fs.mkdirSync(p, { recursive: true }); }

function deepMerge<T>(a: T, b: Partial<T>): T { return { ...a, ...b }; }

function baseCfg(overrides?: Partial<CapacitySimConfig>): CapacitySimConfig {
  return deepMerge<CapacitySimConfig>({
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
  }, overrides);
}

function testMetrics(id: string, sim: CapacitySim): Record<string, any> {
  const cfg = sim.config;
  const last = sim.history[sim.history.length - 1]!;
  const reqs = sim.requests;
  const humanSatisfied = reqs.filter(r => r.status === 'satisfied' && r.provider !== null);
  const cuTransferred = humanSatisfied.reduce((s, r) => s + r.cuCommitted, 0);
  const cuCreated = Math.max(0, sim.agents.reduce((s, a) => s + a.cu + a.committedCu, 0) - cfg.agents * cfg.cuInit);
  const providerCount = new Set(humanSatisfied.map(r => r.provider)).size;
  const reparacion = last.stats.find(s => s.capacidad === 'reparacion')!;
  const autoSegments =
    cfg.automationShock
      ? (() => {
          const idxBefore = Math.min(cfg.automationShock.cycle - 1, sim.history.length - 1);
          const before = sim.history[idxBefore]!.stats.find(s => s.capacidad === 'reparacion')!;
          return { antesCiclo: sidxCfg(cfg.automationShock.cycle - 1), antes: before, despues: reparacion };
        })()
      : undefined;
  return {
    id,
    config: {
      agents: cfg.agents,
      cycles: cfg.cycles,
      wealthPerAgent: cfg.wealthPerAgent,
      cuInit: cfg.cuInit,
      demandScale: cfg.demandScale,
      automation: cfg.automation.reparacion ?? cfg.demandConcentration ? 0.15 : undefined,
      automationShock: cfg.automationShock,
      supplyMonopolyFrac: cfg.supplyMonopoly?.providerFrac,
      supplyScale: cfg.supplyScale,
      sinCapacidades: cfg.participation.sinCapacidades,
    },
    providerCount,
    reparacion,
    autoSegments,
    demandaTotalGlobal: last.demandaTotal,
    demandaSatisfechaGlobal: last.demandaSatisfecha,
    demandaInsatisfechaGlobal: last.demandaInsatisfecha,
    pctSatisfecha: last.pctSatisfecha,
    acceso: last.acceso,
    cuCirculante: last.cuCirculante,
    cuSupply: last.cuSupply,
    cuCreated: Math.max(0, cuCreated),
    cuTransferred,
    cuDestroyed: 0,
    cuGini: last.cuGini,
    cuTop10: last.cuAccumulatedTop,
  };
}

function sidxCfg(c: number | undefined): number { return c ?? 0; }

function runTests() {
  ensureDir(OUT_DIR);
  const tests: { id: string; desc: string; overrides?: Partial<CapacitySimConfig>; compareId?: string }[] = [
    // §8 — Escasez: 1 persona capaz de reparar, 100 usuarios, capacidad ~10/ciclo
    {
      id: 'P1_escasez',
      desc: '§8 Escasez: 1 proveedor, ~10 U de capacidad, demanda alta',
      overrides: {
        supplyScale: 16, // eff ≈ 0.6 × 16 ≈ 10
        supplyMonopoly: { capacityId: 'reparacion', providerFrac: 0.01 },
      },
    },
    // §9 — Abundancia: 100 personas capaces
    {
      id: 'P2_abundancia',
      desc: '§9 Abundancia: oferta amplia, capacidad alta',
      overrides: {
        supplyScale: 40,
        supplyMonopoly: null,
      },
    },
    // §10 — Demanda cero, oferta alta
    {
      id: 'P3_demandaCero',
      desc: '§10 Demanda 0, oferta 1000 unidades',
      overrides: {
        demandScale: 0,
        supplyScale: 80,
        supplyMonopoly: null,
      },
    },
    // §11 — Automatización: ANTES 15%, DESPUÉS → 80% (reparación), capacidad humana constante
    {
      id: 'P4_autoBaja',
      desc: '§11 ANTES: automatización 15%, capacidad humana ~20',
      overrides: {
        automation: { reparacion: 0.15 },
        supplyScale: 33, // eff ≈ 0.6 × 33 ≈ 20 constante en ambos
        supplyMonopoly: { capacityId: 'reparacion', providerFrac: 0.20 },
      },
    },
    {
      id: 'P4_autoAlta',
      desc: '§11 DESPUÉS: automatización 80%, capacidad humana constante',
      overrides: {
        automation: { reparacion: 0.80 },
        supplyScale: 33,
        supplyMonopoly: { capacityId: 'reparacion', providerFrac: 0.20 },
      },
    },
    // §12 — Capital real: 4 escenarios wealth
    ...([1, 100, 1000, 20000].map((w) => ({
      id: `P5_wealth_${w}`,
      desc: `§12 Capital real: patrimonio USD ${w.toLocaleString()}`,
      overrides: { wealthPerAgent: w } as Partial<CapacitySimConfig>,
    }))),
    // §13 — Usuario sin capacidad
    {
      id: 'P6_sinCapacidad',
      desc: '§13 Usuario sin capacidad: 50% sinCap, 20% inactivos',
      overrides: {
        participation: { sinCapacidades: 0.50, inactivos: 0.20, expertos: 0 },
      },
    },
    // §15 — Señales: A (demanda=100, oferta=10), B (100,100), C (10,1)
    {
      id: 'P7_signalA',
      desc: '§15 Señal A: demanda alta, oferta baja',
      overrides: {
        supplyScale: 16,
        supplyMonopoly: { capacityId: 'reparacion', providerFrac: 0.01 },
      },
    },
    {
      id: 'P7_signalB',
      desc: '§15 Señal B: demanda alta, oferta alta',
      overrides: {
        supplyScale: 80,
        supplyMonopoly: null,
      },
    },
    {
      id: 'P7_signalC',
      desc: '§15 Señal C: demanda baja, oferta baja',
      overrides: {
        demandScale: 0.01,
        supplyScale: 16,
        supplyMonopoly: { capacityId: 'reparacion', providerFrac: 0.01 },
      },
    },
    // §14 — CU como dinero (K): acumulación sin tope
    {
      id: 'P8_cuDinero',
      desc: '§14 CU como dinero: sin cap, alta demanda, alta concentración de capacidad',
      overrides: {
        cuCap: 0,
        supplyScale: 30,
        supplyMonopoly: { capacityId: 'reparacion', providerFrac: 0.02 },
      },
    },
  ];

  const results: Record<string, any>[] = [];
  for (const t of tests) {
    const cfg = baseCfg(t.overrides);
    const sim = runCapacitySim(cfg);
    const m = testMetrics(t.id, sim);
    m.description = t.desc;
    results.push(m);
    console.log(`\n=== ${t.id} — ${t.desc} ===`);
    console.log(`Proveedores reparacion: ${m.providerCount}`);
    console.log(`reparacion:`, JSON.stringify(m.reparacion, null, 2));
    console.log(`Demanda global: ${m.demandaTotalGlobal} | Sat: ${m.demandaSatisfechaGlobal} | Insat: ${m.demandaInsatisfechaGlobal} | %Sat: ${m.pctSatisfecha}%`);
    console.log(`Acceso:`, m.acceso, `| Gini: ${m.cuGini} | Top10: ${(m.cuTop10 * 100).toFixed(1)}%`);
    console.log(`CU circulante: ${m.cuCirculante} | Creadas: ${m.cuCreated} | Transferidas: ${m.cuTransferred} | Destruidas: ${m.cuDestroyed}`);
  }

  fs.writeFileSync(path.join(OUT_DIR, 'audit-tests.json'), JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nResultados escritos en ${OUT_DIR}/audit-tests.json`);
}

runTests();
