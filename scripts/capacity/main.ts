// ============================================================================
// RONDA C â€” main: corre todos los escenarios, calcula mÃ©tricas, escribe
// evidencia en evidence/capacidad/ y exporta a public/capacidad/
// ============================================================================
import * as fs from 'fs';
import * as path from 'path';
import { CAPACITY_SCENARIOS, runScenario, CapacityMetrics, scenarioConfig, evaluateCriticalTests } from './scenarios';
import { CapacitySim, runCapacitySim } from './engine';
import { chartsFor, writeSvg } from './charts';

const ROOT = 'evidence/capacidad';
const PUBLIC = 'public/capacidad';

const METRIC_KEYS: (keyof CapacityMetrics)[] = [
  'pctSatisfecha', 'presionMax', 'presionMedia', 'cuTop10', 'cuGini',
  'accesoBasicoPct', 'accesoMedioPct', 'accesoAvanzadoPct', 'conDemandaPct',
  'excluidosBasicoPct', 'capacityUtilizadaPct', 'corrCuDemanda', 'corrCuAcceso',
  'corrCuPatrimonio', 'distributablePerUser',
];

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

type CapacityResult = { s: (typeof CAPACITY_SCENARIOS)[number]; sim: CapacitySim; metrics: CapacityMetrics };

function runAll(): CapacityResult[] {
  ensureDir(ROOT);
  ensureDir(`${ROOT}/data`);
  ensureDir(`${ROOT}/charts`);
  const results: any[] = [];
  for (const s of CAPACITY_SCENARIOS) {
    const out = runScenario(s);
    results.push({ s, sim: out.sim, metrics: out.metrics });
  }
  return results;
}

function writeSummary(results: CapacityResult[]) {
  const head = ['id', 'grupo', 'demandaTotal', 'demandaSatisfecha', 'demandaInsatisfecha', ...METRIC_KEYS, 'escasezCapacidades'];
  const lines = [head.join(',')];
  for (const r of results) {
    const m = r.metrics as any;
    lines.push(
      [r.s.id, r.s.grupo, m.demandaTotal, m.demandaSatisfecha, m.demandaInsatisfecha, ...METRIC_KEYS.map((k) => m[k]), `"${m.escasezCapacidades}"`].join(',')
    );
  }
  fs.writeFileSync(`${ROOT}/data/summary_capacidad.csv`, lines.join('\n'), 'utf8');
}

function writeTraces(results: CapacityResult[]) {
  const out: Record<string, any> = {};
  for (const r of results) {
    out[r.s.id] = {
      id: r.s.id,
      label: r.s.label,
      grupos: r.s.grupo,
      config: r.s.config,
      history: r.sim.history,
    };
  }
  fs.writeFileSync(`${ROOT}/data/traces_capacidad.json`, JSON.stringify(out, null, 2), 'utf8');
}

function writePerScenarioCsv(results: CapacityResult[]) {
  for (const r of results) {
    const head = ['cycle', ...r.sim.history[0]!.stats.map((s) => `${s.capacidad}:presion`), 'demandaTotal', 'demandaSatisfecha', 'demandaInsatisfecha', 'pctSatisfecha', 'accesoBasico', 'accesoMedio', 'accesoAvanzado', 'cuGini'];
    const rows = r.sim.history.map((h) =>
      [h.cycle, ...h.stats.map((s) => s.presion), h.demandaTotal, h.demandaSatisfecha, h.demandaInsatisfecha, h.pctSatisfecha, h.acceso.basico, h.acceso.medio, h.acceso.avanzado, h.cuGini].join(',')
    );
    fs.writeFileSync(`${ROOT}/data/trace-${r.s.id}.csv`, [head.join(','), ...rows].join('\n'), 'utf8');
  }
}

function writeParams(results: CapacityResult[]) {
  const out: Record<string, any> = {};
  for (const r of results) out[r.s.id] = scenarioConfig(r.s);
  fs.writeFileSync(`${ROOT}/data/params_capacidad.json`, JSON.stringify(out, null, 2), 'utf8');
}

function writeCharts(results: CapacityResult[]) {
  for (const r of results) {
    const charts = chartsFor(r.s, r.sim);
    for (const [k, svg] of Object.entries(charts)) {
      writeSvg(`${ROOT}/charts/${r.s.id}_${k}.svg`, svg);
    }
  }
  // overlays por grupo
  const grouped: Record<string, any[]> = {};
  for (const r of results) (grouped[r.s.grupo] ||= []).push(r.s);
  for (const g of Object.keys(grouped)) {
    // overlay presiÃ³n media por grupo
    const sims = results.filter((r) => r.s.grupo === g);
    const base = sims[0]!.sim.history.length;
    const series = sims.slice(0, 6).map((r, i) => ({
      key: r.s.id,
      color: `hsl(${i * 55}, 70%, 45%)`,
      pts: r.sim.history.map((h, i2) => ({ x: i2, y: h.stats.reduce((s, st) => s + st.presion, 0) / h.stats.length })),
    }));
writeSvg(`${ROOT}/charts/overlay-${g}.svg`, svgLine('Presión media - grupo ' + g, series, base));
  }
}

function writeCriticalTests(results: CapacityResult[]) {
  const tests = evaluateCriticalTests(results);
  fs.writeFileSync(`${ROOT}/data/criticos_capacidad.json`, JSON.stringify(tests, null, 2), 'utf8');
  const lines = ['test;escenario;pasa;observado;indicador'];
  for (const t of tests) lines.push(`${t.test};${t.escenario};${t.pasa};"${t.observadoCualitativo}";"${t.indicador}"`);
  fs.writeFileSync(`${ROOT}/data/criticos_capacidad.csv`, lines.join('\n'), 'utf8');
  console.log(`${tests.filter((t) => t.pasa).length}/${tests.length} tests críticos afirmativos.`);
}

// helper de línea simple para overlays de grupo
function svgLine(title: string, series: { key: string; color: string; pts: { x: number; y: number }[] }[], n: number): string {
  const pad = { l: 44, r: 12, t: 30, b: 26 };
  const w = 600;
  const h = 220;
  let maxY = 1;
  for (const s of series) for (const p of s.pts) maxY = Math.max(maxY, p.y);
  maxY = maxY * 1.05;
  const X = (x: number) => pad.l + (x * (w - pad.l - pad.r)) / Math.max(1, n - 1);
  const Y = (y: number) => pad.t + (h - pad.t - pad.b) - (y / maxY) * (h - pad.t - pad.b);
  const lines = series
    .map((s) => `<polyline points="${s.pts.map((p) => `${round2(X(p.x))},${round2(Y(p.y))}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="1.4"/>`)
    .join('');
  const legend = series.map((s, i) => `<text x="${pad.l + i * 98}" y="${h - 6}" font-size="8" fill="#444"><tspan fill="${s.color}">â– </tspan> ${s.key}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#fff"/><text x="${pad.l}" y="16" font-size="12" font-weight="600">${title}</text>${lines}${legend}</svg>`;
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

function exportPublic() {
  ensureDir(PUBLIC);
  copyDir(ROOT, PUBLIC);
}

function copyDir(src: string, dst: string) {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else {
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.copyFileSync(s, d);
    }
  }
}

function printResults(results: CapacityResult[]) {
  console.log('RONDA C â€” resumen (final del horizonte)');
  console.log(
    ['id', '%sat', 'presMax', 'presMed', 'CU-top10', 'GiniCU', 'bas%', 'med%', 'adv%', 'exclBas%', 'corrCUpat'].join('\t')
  );
  for (const r of results) {
    const m = r.metrics;
    console.log(
      [r.s.id, m.pctSatisfecha, m.presionMax, m.presionMedia, m.cuTop10, m.cuGini, m.accesoBasicoPct, m.accesoMedioPct, m.accesoAvanzadoPct, m.excluidosBasicoPct, m.corrCuPatrimonio].join('\t')
    );
  }
}

function main() {
  const results = runAll();
  writeSummary(results);
  writeTraces(results);
  writePerScenarioCsv(results);
  writeParams(results);
writeCharts(results);
  writeCriticalTests(results);
  printResults(results);
  exportPublic();
  console.log(`OK â€” RONDA C: ${results.length} escenarios â†’ evidence/capacidad y public/capacidad`);
}

main();

