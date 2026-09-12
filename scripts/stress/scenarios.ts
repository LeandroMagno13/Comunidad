import { Scenario } from './engine';

const none = () => 0;
const linear = (g0: number) => (c: number) => g0;
const acceler = (g0: number) => (c: number) => g0 * c;
const explosive = (g0: number) => (c: number) => g0 * Math.pow(2, (c - 1) / 20);
const batches = (every: number, count: number) => (c: number) => (c % every === 0 ? count : 0);
// §10: oleadas escalonadas — cada 5 ciclos entran 10, luego 50, después 100 por ciclo
const waves = () => (c: number) => {
  if (c > 40) return 100;
  if (c % 5 !== 0) return 0;
  if (c <= 20) return 10;
  return 50;
};

export const FIRST = 1;

// Escenarios "RONDA A" (configuración actual: política inerte, emisión solo por grant)
export const escenariosMinimos: Scenario[] = [
  {
    id: 'E01-equilibrio',
    label: 'E1 · Equilibrio (pocos usuarios)',
    users0: 50, perUser0: 20, setPoint: 100, startObserved: 100, cycles: 60,
    growth: none, demandRate: 0.2, transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
  },
  {
    id: 'E02-equilibrio-grande',
    label: 'E2 · Equilibrio grande (1.000+)',
    users0: 1000, perUser0: 20, setPoint: 100, startObserved: 100, cycles: 60,
    growth: none, demandRate: 0.2, transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
  },
  {
    id: 'E03-escasez-extrema',
    label: 'E3 · Escasez extrema',
    users0: 100, perUser0: 2, setPoint: 100, startObserved: 100, cycles: 60,
    growth: none, demandRate: 0.2, transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
  },
  {
    id: 'E04-abundancia-extrema',
    label: 'E4 · Abundancia extrema',
    users0: 100, perUser0: 500, setPoint: 100, startObserved: 100, cycles: 60,
    growth: none, demandRate: 0.2, transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
  },
  {
    id: 'E05-crecimiento',
    label: 'E5 · Crecimiento continuo',
    users0: 100, perUser0: 20, setPoint: 100, startObserved: 100, cycles: 80,
    growth: linear(10), demandRate: 0.2, transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
  },
  {
    id: 'E06-shock-demanda',
    label: 'E6 · Shock de demanda',
    users0: 100, perUser0: 20, setPoint: 100, startObserved: 100, cycles: 80,
    growth: none, demandRate: 0.2, transferRate: 0.05,
    demandShocks: [
      { cycle: 20, pct: 10 }, { cycle: 30, pct: 50 }, { cycle: 40, pct: 100 },
    ],
    emissionBase: 0, emitMode: 'none', seed: FIRST,
  },
  {
    id: 'E07-shock-oferta',
    label: 'E7 · Shock de oferta',
    users0: 100, perUser0: 20, setPoint: 100, startObserved: 100, cycles: 80,
    growth: none, demandRate: 0.2, transferRate: 0.05,
    supplyShocks: [{ cycle: 20, pct: 50 }],
    emissionBase: 0, emitMode: 'none', seed: FIRST,
  },
  {
    id: 'E08-shock-escasez',
    label: 'E8 · Shock de escasez',
    users0: 100, perUser0: 20, setPoint: 100, startObserved: 100, cycles: 80,
    growth: none, demandRate: 0.2, transferRate: 0.05,
    supplyShocks: [{ cycle: 20, pct: -50 }],
    emissionBase: 0, emitMode: 'none', seed: FIRST,
  },
  {
    id: 'E09-shock-combinado',
    label: 'E9 · Shock combinado (demanda+, oferta−)',
    users0: 100, perUser0: 20, setPoint: 100, startObserved: 100, cycles: 80,
    growth: none, demandRate: 0.2, transferRate: 0.05,
    demandShocks: [{ cycle: 20, pct: 100 }],
    supplyShocks: [{ cycle: 20, pct: -50 }],
    emissionBase: 0, emitMode: 'none', seed: FIRST,
  },
  {
    id: 'E10-alta-volatilidad',
    label: 'E10 · Alta volatilidad',
    users0: 100, perUser0: 20, setPoint: 100, startObserved: 100, cycles: 80,
    growth: linear(3), demandRate: 0.2, demandVolatility: 0.5, transferRate: 0.1,
    supplyShocks: [
      { cycle: 25, pct: -30 }, { cycle: 45, pct: 40 }, { cycle: 60, pct: -20 },
    ],
    emissionBase: 0, emitMode: 'none', seed: FIRST,
  },
  {
    id: 'E11-nuevos-usuarios-masivos',
    label: 'E11 · Nuevos usuarios masivos',
    users0: 100, perUser0: 20, setPoint: 100, startObserved: 100, cycles: 80,
    growth: batches(5, 10), demandRate: 0.2, transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
  },
  {
    id: 'E12-concentracion',
    label: 'E12 · Concentración inicial',
    users0: 100, perUser0: 20, allocation: 'concentrated', setPoint: 100, startObserved: 100, cycles: 60,
    growth: none, demandRate: 0.2, transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
  },
  {
    id: 'E13-consumo-extremo',
    label: 'E13 · Consumo extremo',
    users0: 100, perUser0: 20, setPoint: 100, startObserved: 100, cycles: 80,
    growth: none, demandRate: 1.2, transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
  },
  {
    id: 'E14-transferencia-extrema',
    label: 'E14 · Transferencia extrema',
    users0: 100, perUser0: 20, setPoint: 100, startObserved: 100, cycles: 80,
    growth: linear(5), demandRate: 0.2, transferRate: 2.0, emissionBase: 0, emitMode: 'none', seed: FIRST,
  },
  {
    id: 'E15-sistema-casi-vacio',
    label: 'E15 · Sistema casi vacío',
    users0: 5, perUser0: 2, setPoint: 100, startObserved: 100, cycles: 60,
    growth: linear(1), demandRate: 0.05, transferRate: 0.01, emissionBase: 0, emitMode: 'none', seed: FIRST,
  },
  {
    id: 'E16-sistema-enorme',
    label: 'E16 · Sistema enorme',
    users0: 10000, perUser0: 20, setPoint: 100, startObserved: 100, cycles: 40,
    growth: linear(200), demandRate: 0.2, transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
  },
];

// Barrido de dimensiones (§3) — poblaciones y oferta por usuario
export function barridoPoblaciones(): Scenario[] {
  return [1, 5, 10, 50, 100, 500, 1000, 10000, 100000].map((n, i) => ({
    id: `D1-poblacion-${n}`,
    label: `Población ${n}`,
    users0: n, perUser0: 20, setPoint: 100, startObserved: 100, cycles: n >= 100000 ? 25 : 40,
    growth: none, demandRate: 0.2, transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST + i,
  }));
}

export function barridoOfertaInicial(): Scenario[] {
  return [1, 5, 20, 100, 500].map((cu, i) => ({
    id: `D2-cu-usuario-${cu}`,
    label: `${cu} CU/usuario`,
    users0: 100, perUser0: cu, setPoint: 100, startObserved: 100, cycles: 40,
    growth: none, demandRate: 0.2, transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST + i,
  }));
}

export function barridoCrecimiento(): Scenario[] {
  return [
    {
      id: 'D3-crec-constante', label: 'Crecimiento constante', users0: 100, perUser0: 20,
      setPoint: 100, startObserved: 100, cycles: 60, growth: none, demandRate: 0.2,
      transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
    },
    {
      id: 'D3-crec-lento', label: 'Crecimiento lento', users0: 100, perUser0: 20,
      setPoint: 100, startObserved: 100, cycles: 60, growth: linear(2), demandRate: 0.2,
      transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
    },
    {
      id: 'D3-crec-lineal', label: 'Crecimiento lineal', users0: 100, perUser0: 20,
      setPoint: 100, startObserved: 100, cycles: 60, growth: linear(10), demandRate: 0.2,
      transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
    },
    {
      id: 'D3-crec-acelerado', label: 'Crecimiento acelerado', users0: 100, perUser0: 20,
      setPoint: 100, startObserved: 100, cycles: 60, growth: acceler(2), demandRate: 0.2,
      transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
    },
    {
      id: 'D3-crec-explosivo', label: 'Crecimiento explosivo', users0: 100, perUser0: 20,
      setPoint: 100, startObserved: 100, cycles: 60, growth: explosive(2), demandRate: 0.2,
      transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
    },
  ];
}

export function barridoDemanda(): Scenario[] {
  const shocks = (list: Array<{ cycle: number; pct: number }>) => list;
  return [
    {
      id: 'D4-dem-estable', label: 'Demanda estable', users0: 100, perUser0: 20,
      setPoint: 100, startObserved: 100, cycles: 60, growth: none, demandRate: 0.2,
      transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
    },
    {
      id: 'D4-dem-crece', label: 'Demanda creciente', users0: 100, perUser0: 20,
      setPoint: 100, startObserved: 100, cycles: 60, growth: none, demandRate: 0.2,
      demandGrowthPct: 2, transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
    },
    {
      id: 'D4-dem-cae', label: 'Demanda decreciente', users0: 100, perUser0: 20,
      setPoint: 100, startObserved: 100, cycles: 60, growth: none, demandRate: 0.2,
      demandGrowthPct: -2, transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
    },
    {
      id: 'D4-dem-shock-pos', label: 'Shock positivo', users0: 100, perUser0: 20,
      setPoint: 100, startObserved: 100, cycles: 60, growth: none, demandRate: 0.2,
      demandShocks: shocks([{ cycle: 30, pct: 100 }]), transferRate: 0.05,
      emissionBase: 0, emitMode: 'none', seed: FIRST,
    },
    {
      id: 'D4-dem-shock-neg', label: 'Shock negativo', users0: 100, perUser0: 20,
      setPoint: 100, startObserved: 100, cycles: 60, growth: none, demandRate: 0.2,
      demandShocks: shocks([{ cycle: 30, pct: -60 }]), transferRate: 0.05,
      emissionBase: 0, emitMode: 'none', seed: FIRST,
    },
    {
      id: 'D4-dem-shocks-rep', label: 'Shocks repetidos', users0: 100, perUser0: 20,
      setPoint: 100, startObserved: 100, cycles: 60, growth: none, demandRate: 0.2,
      demandShocks: shocks([{ cycle: 20, pct: 40 }, { cycle: 30, pct: -30 }, { cycle: 40, pct: 80 }]),
      transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
    },
    {
      id: 'D4-dem-volatil', label: 'Demanda volátil', users0: 100, perUser0: 20,
      setPoint: 100, startObserved: 100, cycles: 60, growth: none, demandRate: 0.2,
      demandVolatility: 0.8, transferRate: 0.05, emissionBase: 0, emitMode: 'none', seed: FIRST,
    },
  ];
}

export function barridoOferta(roundB: boolean): Scenario[] {
  // RONDA A (roundB=false): configuración v1 legada (sensor ciego + política inerte).
  // RONDA B (roundB=true): v2 control real (sensor consciente + válvula activa + quema).
  const rb = roundB ? {} : { legacySensor: true, expansionGain: 0, contractionGain: 0, maxBurnPerCycle: 0 };
  return [
    {
      id: roundB ? 'D5-em-normal' : 'A-D5-em-normal', label: 'Emisión normal', users0: 100, perUser0: 20,
      setPoint: 100, startObserved: 100, cycles: 60, growth: linear(2), demandRate: 0.2,
      transferRate: 0.05, emissionBase: 10, emitMode: roundB ? 'shares' : 'none',
      config: rb, seed: FIRST,
    },
    {
      id: roundB ? 'D5-em-excesiva' : 'A-D5-em-excesiva', label: 'Emisión excesiva', users0: 100, perUser0: 20,
      setPoint: 100, startObserved: 100, cycles: 60, growth: linear(2), demandRate: 0.2,
      transferRate: 0.05, emissionBase: 50, emitMode: roundB ? 'shares' : 'none',
      config: rb, seed: FIRST,
    },
    {
      id: roundB ? 'D5-em-insuficiente' : 'A-D5-em-insuficiente', label: 'Emisión insuficiente', users0: 100, perUser0: 20,
      setPoint: 100, startObserved: 100, cycles: 60, growth: linear(2), demandRate: 0.2,
      transferRate: 0.05, emissionBase: 1, emitMode: roundB ? 'shares' : 'none',
      config: rb, seed: FIRST,
    },
    {
      id: roundB ? 'D5-em-interrumpida' : 'A-D5-em-interrumpida', label: 'Interrupción de emisión', users0: 100, perUser0: 20,
      setPoint: 100, startObserved: 100, cycles: 60, growth: linear(2), demandRate: 0.2,
      transferRate: 0.05, emissionBase: 10, emitMode: roundB ? 'shares' : 'none',
      supplyShocks: [{ cycle: 30, pct: 0 }], config: rb, seed: FIRST,
    },
    {
      id: roundB ? 'D5-shock-emision' : 'A-D5-shock-emision', label: 'Shock de emisión', users0: 100, perUser0: 20,
      setPoint: 100, startObserved: 100, cycles: 60, growth: linear(2), demandRate: 0.2,
      transferRate: 0.05, emissionBase: 10, emitMode: roundB ? 'shares' : 'none',
      supplyShocks: [{ cycle: 30, pct: 50 }], config: rb, seed: FIRST,
    },
    {
      id: roundB ? 'D5-exceso-inicial' : 'A-D5-exceso-inicial', label: 'Exceso inicial de CU', users0: 100, perUser0: 500,
      setPoint: 100, startObserved: 100, cycles: 60, growth: none, demandRate: 0.2,
      transferRate: 0.05, emissionBase: 0, emitMode: 'none', config: rb, seed: FIRST,
    },
    {
      id: roundB ? 'D5-reduccion-abrupta' : 'A-D5-reduccion-abrupta', label: 'Reducción abrupta de oferta', users0: 100, perUser0: 20,
      setPoint: 100, startObserved: 100, cycles: 60, growth: none, demandRate: 0.2,
      transferRate: 0.05, emissionBase: 0, emitMode: 'none',
      supplyShocks: [{ cycle: 30, pct: -70 }], config: rb, seed: FIRST,
    },
  ];
}

// Barrido PID (§8): 7 combinaciones razonables
export function barridoPID(): Scenario[] {
  const base = {
    users0: 100, perUser0: 20, setPoint: 100, startObserved: 100, cycles: 80,
    growth: linear(3) as (c: number) => number, demandRate: 0.2, transferRate: 0.05,
    demandShocks: [{ cycle: 30, pct: 80 }, { cycle: 50, pct: -40 }],
    emissionBase: 0, emitMode: 'none' as const, seed: FIRST,
  };
  const combos: Array<{ id: string; label: string; config: Partial<{ kp: number; ki: number; kd: number }> }> = [
    { id: 'P1-bajo-bajo-bajo', label: 'Kp0.1 Ki0.02 Kd0.01 (bajos)', config: { kp: 0.1, ki: 0.02, kd: 0.01 } },
    { id: 'P2-base', label: 'Kp0.5 Ki0.1 Kd0.05 (config actual)', config: { kp: 0.5, ki: 0.1, kd: 0.05 } },
    { id: 'P3-alto-p', label: 'Kp3 Ki0.1 Kd0.05 (P alto)', config: { kp: 3, ki: 0.1, kd: 0.05 } },
    { id: 'P4-alto-i', label: 'Kp0.5 Ki0.8 Kd0.05 (I alto)', config: { kp: 0.5, ki: 0.8, kd: 0.05 } },
    { id: 'P5-alto-d', label: 'Kp0.5 Ki0.1 Kd1.5 (D alto)', config: { kp: 0.5, ki: 0.1, kd: 1.5 } },
    { id: 'P6-muy-agresivo', label: 'Kp6 Ki1.5 Kd3 (muy agresivo)', config: { kp: 6, ki: 1.5, kd: 3 } },
    { id: 'P7-only-p', label: 'Kp2 Ki0 Kd0 (solo P)', config: { kp: 2, ki: 0, kd: 0 } },
  ];
  return combos.map((c) => ({ ...base, id: `PID-${c.id}`, label: c.label, config: { ...base.config, ...c.config } }));
}

// Barrido SupplyPolicy (§9) — RONDA B: política con ganancia activa
export function barridoPolitica(): Scenario[] {
  const base = {
    users0: 100, perUser0: 20, setPoint: 100, startObserved: 100, cycles: 80,
    growth: linear(3) as (c: number) => number, demandRate: 0.2, transferRate: 0.05,
    demandShocks: [{ cycle: 30, pct: 80 }],
    emissionBase: 10, emitMode: 'shares' as const, seed: FIRST,
  };
  return [
    {
      ...base, id: 'S1-gain0', label: 'Ganancias 0 (actual)', config: { expansionGain: 0, contractionGain: 0 },
    },
    {
      ...base, id: 'S2-gain1', label: 'Ganancia 1 simétrica', config: { expansionGain: 1, contractionGain: 1 },
    },
    {
      ...base, id: 'S3-gain3', label: 'Ganancia 3 simétrica', config: { expansionGain: 3, contractionGain: 3 },
    },
    {
      ...base, id: 'S4-asisimetrica', label: 'Asimétrica (exp3/cont1)', config: { expansionGain: 3, contractionGain: 1 },
    },
    {
      ...base, id: 'S5-cap-bajo', label: 'Tope emisión 20', config: { expansionGain: 2, contractionGain: 2, maxEmissionPerCycle: 20 },
    },
    {
      ...base, id: 'S6-cuotas-nuevos', label: 'Cuota nuevos al 80%', config: { expansionGain: 2, contractionGain: 2, newUserShare: 0.8, historicalShare: 0.1, reserveShare: 0.1 },
    },
    {
      ...base, id: 'S7-cuotas-historicos', label: 'Cuota históricos al 80%', config: { expansionGain: 2, contractionGain: 2, historicalShare: 0.8, newUserShare: 0.1, reserveShare: 0.1 },
    },
  ];
}

// §10 — incorporación continua de usuarios (oleadas de entrada)
export function barridoNuevosUsuarios(): Scenario[] {
  const base = {
    users0: 100, perUser0: 20, setPoint: 100, startObserved: 100, cycles: 80,
    demandRate: 0.2, transferRate: 0.05, emissionBase: 0, emitMode: 'none' as const, seed: FIRST,
  };
  return [
    {
      ...base, id: 'U-oleadas-escalonadas',
      label: 'Oleadas escalonadas (10/5c → 50/5c → 100/1c)', growth: waves(),
    },
    {
      ...base, id: 'U-oleada-masiva',
      label: 'Oleada masiva continua (100/ciclo)', growth: linear(100),
    },
  ];
}

// Monte Carlo (§12) — variaciones aleatorias con semilla reproducible
export interface McRun {
  id: string;
  label: string;
  runs: number;
  cycles: number;
  jitter: { demandRate: number; transferRate: number; growth: number; shockProb: number };
}

export const monteCarlo: McRun = {
  id: 'MC1',
  label: 'Base ± aleatorio (demanda, transferencias, crecimiento, shocks)',
  runs: 200,
  cycles: 40,
  jitter: { demandRate: 0.25, transferRate: 0.25, growth: 5, shockProb: 0.2 },
};

export function mcScenario(baseSeed: number, jitter: McRun['jitter'], i: number, cycles: number): Scenario {
  const rng = mulberry32Small(baseSeed + i * 7919);
  const growth0 = Math.round(jitter.growth * (0.2 + rng()));
  const shockProb = rng();
  const shocks = shockProb < jitter.shockProb ? [{ cycle: 20, pct: Math.round((rng() * 2 - 1) * 80) }] : [];
  return {
    id: `MC-run-${i}`,
    label: `Monte Carlo ${i}`,
    users0: 200,
    perUser0: 20,
    setPoint: 100,
    startObserved: 100,
    cycles,
    growth: linear(growth0),
    demandRate: 0.2 * (1 + (rng() * 2 - 1) * jitter.demandRate),
    demandVolatility: rng() * 0.3,
    transferRate: 0.05 * (1 + (rng() * 2 - 1) * jitter.transferRate),
    demandShocks: shocks,
    emissionBase: 0,
    emitMode: 'none',
    seed: baseSeed + i,
  };
}

function mulberry32Small(seed: number) {
  let a = seed >>> 0;
  return function () {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}