// ============================================================================
// RONDA C+D — main: corre escenarios minimos (D + espejo C), barridos D1..D10
// y Monte Carlo (200). Escribe evidencia en evidence/stress-test-capacity/ y
// charts SVG. Determinista: misma semilla, mismo output.
// Ejecutar: npx tsx scripts/stress-capacity/main.ts
// ============================================================================
import * as fs from 'fs';
import * as path from 'path';
import { runCapacitySim, round2 } from '../capacity/engine';
import { STRESS_SCENARIOS, SWEEP_SERIES, runMetrics, runMonteCarlo, StressMetrics } from './scenarios';

const ROOT = 'evidence/stress-test-capacity';
const SEED = 101;
const MC_RUNS = 200;

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

// ---------------------------------------------------------------------------
// Charts SVG compactos (pequenos multiples por corrida y over dedic vidrio)
// ---------------------------------------------------------------------------
function svgSpark(title: string, series: { key: string; color: string; pts: number[] }[], n: number): string {
  const pad = { l: 40, r: 10, t: 26, b: 20 };
  const w = 640;
  const h = 180;
  let maxY = 1;
  for (const s of series) for (const p of s.pts) maxY = Math.max(maxY, p);
  maxY = maxY * 1.08 || 1;
  const X = (x: number) => pad.l + (x * (w - pad.l - pad.r)) / Math.max(1, n - 1);
  const Y = (y: number) => pad.t + (h - pad.t - pad.b) - (y / maxY) * (h - pad.t - pad.b);
  const lines = series
    .map((s) => `<polyline points="${s.pts.map((p, i) => `${round2(X(i))},${round2(Y(p))}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="1.5"/>`)
    .join('');
  const legend = series.map((s, i) => `<text x="${pad.l + i * 110}" y="${h - 4}" font-size="8" fill="#444"><tspan fill="${s.color}">▪</tspan> ${s.key}</text>`).join('');
  const grid = [0.25, 0.5, 0.75].map((f) => `<line x1="${pad.l}" y1="${Y(maxY * f)}" x2="${w - pad.r}" y2="${Y(maxY * f)}" stroke="#e5e5e5" stroke-width="0.5"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#fff"/>${grid}<text x="${pad.l}" y="16" font-size="12" font-weight="600">${title}</text>${lines}${legend}</svg>`;
}

function scenarioSeries(sim: { history: { pctSatisfecha: number; presionMedia: number; presionMax: number; cuGini: number }[] }[]) {
  // no usado directamente: series definidas por el caller
}

function panelSvg(id: string, label: string, hist: any[]): string {
  const series = [
    { key: '%sat', color: '#1b6e38', pts: hist.map((h) => h.pctSatisfecha) },
    { key: 'presion', color: '#b33', pts: hist.map((h) => h.stats.reduce((s: number, st: any) => s + st.presion, 0) / Math.max(1, h.stats.length)) },
    { key: 'basico%', color: '#777', pts: hist.map((h) => (h.acceso.basico / Math.max(1, h.acceso.basico + h.acceso.medio + h.acceso.avanzado)) * 100) },
  ];
  const urgSeries =
    hist[0] && hist[0].urgencia
      ? [{ key: 'urgencia.gasto%', color: '#c77a00', pts: hist.map((h) => (h.urgencia?.presupuestoGastado ?? 0)) }]
      : [];
  const digSeries = hist[0] && hist[0].dignidad ? [{ key: 'dignidad.hc%', color: '#6a3d9a', pts: hist.map((h) => h.dignidad?.headcount ?? 0) }] : [];
  return svgSpark(`${id} — ${label}`, [...series, ...urgSeries, ...digSeries], hist.length);
}

function overlaySvg(title: string, series: { key: string; color: string; pts: number[] }[], n: number): string {
  return svgSpark(title, series, n);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
type Result = { scenario: { id: string; label: string; grupo: string }; sim: any; metrics: StressMetrics };

function patchedHistoryPt(sim: any): { pctSatisfecha: number; presion: number; basicoPct: number; urgenciaGasto: number; dignidadHc: number }[] {
  return sim.history.map((h: any) => ({
    pctSatisfecha: h.pctSatisfecha,
    presion: h.stats.reduce((s: number, st: any) => s + st.presion, 0) / Math.max(1, h.stats.length),
    basicoPct: (h.acceso.basico / Math.max(1, h.acceso.basico + h.acceso.medio + h.acceso.avanzado)) * 100,
    urgenciaGasto: h.urgencia?.presupuestoGastado ?? 0,
    dignidadHc: h.dignidad?.headcount ?? 0,
  }));
}

function main() {
  ensureDir(`${ROOT}/data`);
  ensureDir(`${ROOT}/charts`);
  const started = Date.now();

  // Escenarios minimos (D + espejo legacy C)
  const results: Result[] = [];
  for (const s of STRESS_SCENARIOS) {
    const sim = runCapacitySim(s.config);
    const metrics = runMetrics(s.id, s.config, sim);
    results.push({ scenario: s, sim, metrics });
  }

  // Barridos
  const sweeps: { series: typeof SWEEP_SERIES[number]; runs: (Result & { caseId: string; caseLabel: string })[] }[] = [];
  for (const ser of SWEEP_SERIES) {
    const runs: (Result & { caseId: string; caseLabel: string })[] = [];
    for (const c of ser.cases) {
      const sim = runCapacitySim(c.config);
      const metrics = runMetrics(c.id, c.config, sim);
      runs.push({ scenario: { id: c.id, label: c.label, grupo: ser.id }, sim, metrics, caseId: c.id, caseLabel: c.label });
    }
    sweeps.push({ series: ser, runs });
  }

  // Monte Carlo
  const mc = runMonteCarlo(MC_RUNS, SEED);

  // ---- writes ----
  const head = ['id', 'grupo', 'demandaTotal', 'demandaSatisfecha', 'demandaInsatisfecha', 'pctSatisfecha', 'presionMax', 'presionMedia', 'accesoBasicoPct', 'accesoMedioPct', 'accesoAvanzadoPct', 'excluidosBasicoPct', 'cuGini', 'urgenciaMarcadaPct', 'urgenciaGastoPct', 'urgenciaAgotadaPct', 'urgenciaEficaciaPct', 'dignidadHeadcountPct', 'dignidadBrecha', 'capacidadUtilizadaPct', 'corrCuUrgencia'];
  const csv = [head.join(',')];
  for (const r of results) {
    const m = r.metrics as any;
    csv.push([r.scenario.id, r.scenario.grupo, m.demandaTotal, m.demandaSatisfecha, m.demandaInsatisfecha, m.pctSatisfecha, m.presionMax, m.presionMedia, m.accesoBasicoPct, m.accesoMedioPct, m.accesoAvanzadoPct, m.excluidosBasicoPct, m.cuGini, m.urgenciaMarcadaPct, m.urgenciaGastoPct, m.urgenciaAgotadaPct, m.urgenciaEficaciaPct, m.dignidadHeadcountPct, m.dignidadBrecha, m.capacidadUtilizadaPct, m.corrCuUrgencia].join(','));
  }
  // sumar sweeps al mismo CSV con serie como grupo
  for (const sw of sweeps) {
    for (const r of sw.runs) {
      const m = r.metrics as any;
      csv.push([r.caseId, sw.series.id, m.demandaTotal, m.demandaSatisfecha, m.demandaInsatisfecha, m.pctSatisfecha, m.presionMax, m.presionMedia, m.accesoBasicoPct, m.accesoMedioPct, m.accesoAvanzadoPct, m.excluidosBasicoPct, m.cuGini, m.urgenciaMarcadaPct, m.urgenciaGastoPct, m.urgenciaAgotadaPct, m.urgenciaEficaciaPct, m.dignidadHeadcountPct, m.dignidadBrecha, m.capacidadUtilizadaPct, m.corrCuUrgencia].join(','));
    }
  }
  fs.writeFileSync(`${ROOT}/data/summary_capacidad_stress.csv`, csv.join('\n'), 'utf8');

  // traces por escenario minimo
  for (const r of results) {
    fs.writeFileSync(`${ROOT}/data/trace-${r.scenario.id}.csv`, traceCsv(r.sim as any), 'utf8');
  }
  for (const sw of sweeps) {
    for (const r of sw.runs) {
      fs.writeFileSync(`${ROOT}/data/trace-${r.caseId}.csv`, traceCsv(r.sim as any), 'utf8');
    }
  }

  // charts: panels por escenario minimo + overlays por serie de barrido
  for (const r of results) {
    fs.writeFileSync(`${ROOT}/charts/panel-${r.scenario.id}.svg`, panelSvg(r.scenario.id, r.scenario.label, (r.sim as any).history), 'utf8');
  }
  for (const ser of sweeps) {
    const n = ser.series.cases[0] ? (ser.runs[0].sim as any).history.length : 1;
    const series = ser.runs.map((r, i) => ({
      key: r.caseId.replace(`${ser.series.id}-`, ''),
      color: `hsl(${Math.floor((i * 47) % 360)}, 65%, 45%)`,
      pts: patchedHistoryPt(r.sim as any).map((p: any) => p.pctSatisfecha),
    }));
    fs.writeFileSync(`${ROOT}/charts/overlay-${ser.series.id}.svg`, overlaySvg(`${ser.series.label} — % satisfecho`, series, n), 'utf8');
  }

  // montecarlo.json
  fs.writeFileSync(`${ROOT}/data/montecarlo.json`, JSON.stringify({ seedBase: SEED, runs: mc.length, items: mc }, null, 2), 'utf8');

  // params + summary de run
  const meta = { seedBase: SEED, experimentos: results.length, sweeps: sweeps.length, monteCarloRuns: MC_RUNS, generado: new Date().toISOString(), ms: Date.now() - started };
  fs.writeFileSync(`${ROOT}/data/presentation.json`, JSON.stringify(buildPresentation(results, sweeps, mc, meta), null, 2), 'utf8');

  printResults(results, sweeps, mc);
  console.log(`OK — RONDA C+D: ${results.length} escenarios minimos, ${sweeps.reduce((s, sw) => s + sw.runs.length, 0)} barridos, ${mc.length} Monte Carlo → ${ROOT}`);
}

function traceCsv(sim: any): string {
  const head = ['cycle', 'demandaTotal', 'pctSatisfecha', 'presionMedia', 'accesoBasico', 'accesoMedio', 'accesoAvanzado', 'urgenciaGasto', 'dignidadHeadcount'];
  const rows = sim.history.map((h: any) =>
    [h.cycle, h.demandaTotal, h.pctSatisfecha, round2(h.stats.reduce((s: number, st: any) => s + st.presion, 0) / Math.max(1, h.stats.length)), h.acceso.basico, h.acceso.medio, h.acceso.avanzado, h.urgencia?.presupuestoGastado ?? 0, h.dignidad?.headcount ?? 0].join(',')
  );
  return [head.join(','), ...rows].join('\n');
}

function buildPresentation(results: Result[], sweeps: any[], mc: any[], meta: any): any {
  const dato = (id: string) => results.find((r) => r.scenario.id === id) ?? results.find((r) => r.scenario.id === `L-${id}`);
  const datos = {
    version: 3,
    ronda: 'C+D',
    titulo: 'Ensayo de stress de capacidad — RONDA C + RONDA D (urgencia)',
    generado: meta.generado,
    seed: meta.seedBase,
    meta,
    escenarios: results.map((r) => ({ id: r.scenario.id, label: r.scenario.label, metrics: r.metrics })),
    barridos: sweeps.map((sw: any) => ({ id: sw.series.id, label: sw.series.label, cases: sw.runs.map((r: any) => ({ id: r.caseId, label: r.caseLabel, metrics: r.metrics })) })),
    monteCarlo: {
      runs: mc.length,
      metricas: mcMetricas(mc),
    },
    charts: {
      paneles: results.map((r) => ({ id: r.scenario.id, label: r.scenario.label, panel: `charts/panel-${r.scenario.id}.svg` })),
      overlays: sweeps.map((sw: any) => ({ file: `charts/overlay-${sw.series.id}.svg`, name: `${sw.series.label} — % satisfecho` })),
    },
    tablas: {
      escenarios: results.map((r) => ({ id: r.scenario.id, label: r.scenario.label, metrics: r.metrics })),
      barridos: sweeps.map((sw: any) => ({ id: sw.series.id, label: sw.series.label, cases: sw.runs.map((r: any) => ({ id: r.caseId, label: r.caseLabel, metrics: r.metrics })) })),
    },
    hallazgos: hallazgos(dato),
    referencia: { rondaA: '/stress-test/ronda-a/REPORTE.md', etiquetaRondaA: 'Ensayo de stress RONDA A (archivado 2026-09-11)' },
  };
  return datos;
}

function mcMetricas(mc: any[]): any {
  const keys = ['pctSatisfecha', 'presionMax', 'presionMedia', 'dignidadHeadcountPct', 'dignidadBrecha', 'urgenciaGastoPct', 'urgenciaAgotadaPct', 'excluidosBasicoPct'];
  const agg: Record<string, any> = {};
  for (const k of keys) {
    const vals = mc.map((m) => m.metrics[k]).sort((a, b) => a - b);
    agg[k] = { media: round2(vals.reduce((s, v) => s + v, 0) / vals.length), min: vals[0], p05: vals[Math.floor(vals.length * 0.05)], p95: vals[Math.ceil(vals.length * 0.95)], max: vals[vals.length - 1] };
  }
  return { keys, agg };
}

function hallazgos(dato: (id: string) => Result | undefined): string[] {
  const d01 = dato('E01-equilibrio');
  const c01 = dato('L-E01-equilibrio');
  const d03 = dato('E03-escasez-extrema');
  const c03 = dato('L-E03-escasez-extrema');
  const d13 = dato('E13-urgencia-saturada');
  const c13 = dato('L-E13-urgencia-saturada');
  const d08 = dato('E08-escasez-persistente');
  const mc = d01;
  const out: string[] = [];
  if (mc) out.push(`Escenario equilibrado (D): ${mc.metrics.pctSatisfecha}% satisfecho, piso de dignidad en ${mc.metrics.dignidadHeadcountPct}% (${mc.metrics.dignidadBrecha} brecha).`);
  if (d01 && c01) out.push(`Urgencia vs apuesta libre en equilibrio: satisfecho ${d01.metrics.pctSatisfecha}% (D) vs ${c01.metrics.pctSatisfecha}% (C): la urgencia no degrada el acceso basal.`);
  if (d03 && c03) out.push(`Escasez extrema: satisfecho ${d03.metrics.pctSatisfecha}% (D) vs ${c03.metrics.pctSatisfecha}% (C); presion ${d03.metrics.presionMax} vs ${c03.metrics.presionMax}.`);
  if (d08) out.push(`Escasez persistente: piso de dignidad ${d08.metrics.dignidadHeadcountPct}% (${d08.metrics.dignidadBrecha} brecha) con presion ${d08.metrics.presionMedia}.`);
  if (d13 && c13) out.push(`Urgencia saturada: con gasto total del presupuesto, la urgencia preserva ${d13.metrics.pctSatisfecha}% de satisfecho (vs ${c13.metrics.pctSatisfecha}% apuesta libre) y ${d13.metrics.dignidadHeadcountPct}% bajo el piso.`);
  return out;
}

function printResults(results: Result[], sweeps: any[], mc: any[]) {
  console.log('RONDA C+D — escenarios minimos (final del horizonte)');
  console.log(['id', '%sat', 'presMax', 'presMed', 'bas%', 'excl%', 'urgGasto%', 'urgEfic%', 'dig.hc%', 'digB'].join('\t'));
  for (const r of results) {
    const m = r.metrics;
    console.log([r.scenario.id, m.pctSatisfecha, m.presionMax, m.presionMedia, m.accesoBasicoPct, m.excluidosBasicoPct, m.urgenciaGastoPct, m.urgenciaEficaciaPct, m.dignidadHeadcountPct, m.dignidadBrecha].join('\t'));
  }
  const pc = mcMetricas(mc).agg.pctSatisfecha;
  console.log(`Monte Carlo (${mc.length}): %sat media=${pc.media} [p05=${pc.p05}, p95=${pc.p95}]`);
}

main();