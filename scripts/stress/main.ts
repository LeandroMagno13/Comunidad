import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { runScenario, SimResult, StabilityMetrics, stability } from './engine';
import {
  escenariosMinimos,
  barridoPoblaciones,
  barridoOfertaInicial,
  barridoCrecimiento,
  barridoDemanda,
  barridoOferta,
  barridoPID,
  barridoPolitica,
  barridoNuevosUsuarios,
  mcScenario,
  monteCarlo,
} from './scenarios';
import { panelChart, overlayCharts } from './charts';

const OUT = join(process.cwd(), 'evidence', 'stress-test');

function out(p: string) {
  return join(OUT, p);
}

function ensureDirs() {
  for (const d of ['', 'data', 'charts']) mkdirSync(out(d), { recursive: true });
}

function rowsToCsv(rows: any[]): string {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]!);
  const head = keys.join(',');
  const body = rows.map((r) => keys.map((k) => String(r[k] ?? '')).join(',')).join('\n');
  return head + '\n' + body;
}

function json(v: unknown) {
  return JSON.stringify(v, null, 2);
}

async function main() {
  ensureDirs();
  const t0 = Date.now();
  const runs = new Map<string, SimResult>();

  function runAll(scens: { id: string }[]) {
    for (const s of scens as any[]) {
      const res = runScenario(s);
      runs.set(s.id, res);
    }
  }

  runAll(escenariosMinimos as any);
  runAll(barridoPoblaciones());
  runAll(barridoOfertaInicial());
  runAll(barridoCrecimiento());
  runAll(barridoDemanda());
  runAll(barridoOferta(false)); // RONDA A: política inerte
  runAll(barridoOferta(true)); // RONDA B: política + emisión por cuotas
  runAll(barridoPID());
  runAll(barridoPolitica());
  runAll(barridoNuevosUsuarios());

  // Monte Carlo
  const mcResults: StabilityMetrics[] = [];
  for (let i = 0; i < monteCarlo.runs; i++) {
    const sc = mcScenario(101, monteCarlo.jitter, i, monteCarlo.cycles);
    const res = runScenario(sc);
    runs.set(sc.id, res);
    mcResults.push(stability(res));
  }

  // ---- traces JSON (todas) + CSV (principales) ----
  const traces: Record<string, any> = {};
  for (const [id, res] of runs) {
    traces[id] = { scenario: res.scenario, config: res.config, rows: res.rows };
  }
  writeFileSync(out('data/traces.json'), json(traces), 'utf8');

  const headlineIds = escenariosMinimos.map((s) => s.id);
  for (const id of headlineIds) {
    const res = runs.get(id)!;
    writeFileSync(out('data/trace-' + id + '.csv'), rowsToCsv(res.rows), 'utf8');
  }

  // ---- resumen de estabilidad ----
  const summaryRows: Array<Record<string, number | string>> = [];
  for (const [id, res] of runs) {
    const m = stability(res);
    if (!res.rows.length) console.error('!! sin filas:', id);
    summaryRows.push({
      id,
      label: res.scenario.label,
      users0: res.scenario.users0,
      perUser0: res.scenario.perUser0,
      gainExp: res.config.expansionGain,
      gainCon: res.config.contractionGain,
      emissionBase: res.scenario.emissionBase,
      emitMode: res.scenario.emitMode,
      mae: round3(m.mae),
      maxAbsError: round3(m.maxAbsError),
      peakOver: round3(m.peakOver),
      peakUnder: round3(m.peakUnder),
      stdError: round3(m.stdError),
      recovery5: m.recovery5,
      recovery10: m.recovery10,
      recovery20: m.recovery20,
      oscSignChanges: m.oscSignChanges,
      meanAccessPct: round3(m.meanAccessPct),
      minAccessPct: round3(m.minAccessPct),
      finalAccessPct: round3(m.finalAccessPct),
      finalGini: round3(m.finalGini),
      finalTop10: round3(m.finalTop10),
      finalZerosPct: round3(m.finalZerosPct),
      meanVelocity: round3(m.meanVelocity),
      meanConsumedPerCycle: round2(m.meanConsumedPerCycle),
      meanTransferredPerCycle: round2(m.meanTransferredPerCycle),
      emittedTotal: m.emittedTotal,
      destroyedTotal: m.destroyedTotal,
      netSupply: round2(m.netSupply),
      finalSupply: round2(m.finalSupply),
      finalUsers: m.finalUsers,
    });
  }
  writeFileSync(out('data/summary.csv'), rowsToCsv(summaryRows), 'utf8');

  // ---- Monte Carlo resumen ----
  function agg(name: keyof Pick<StabilityMetrics, 'mae' | 'maxAbsError' | 'recovery10' | 'meanAccessPct' | 'finalGini' | 'meanVelocity' | 'finalTop10' | 'stdError'>) {
    const vals = mcResults.map((m) => Number(m[name]));
    const sorted = [...vals].sort((a, b) => a - b);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const p5 = sorted[Math.floor(vals.length * 0.05)]!;
    const p95 = sorted[Math.floor(vals.length * 0.95)]!;
    return { mean: round3(mean), p5: round3(p5), p95: round3(p95), min: round3(sorted[0]!), max: round3(sorted[sorted.length - 1]!) };
  }
  const mcSummary = {
    runs: monteCarlo.runs,
    cycles: monteCarlo.cycles,
    seedBase: 101,
    metrics: {
      mae: agg('mae'),
      maxAbsError: agg('maxAbsError'),
      stdError: agg('stdError'),
      recovery10: agg('recovery10'),
      meanAccessPct: agg('meanAccessPct'),
      finalGini: agg('finalGini'),
      finalTop10: agg('finalTop10'),
      meanVelocity: agg('meanVelocity'),
    },
  };
  writeFileSync(out('data/montecarlo.json'), json(mcSummary), 'utf8');

  // ---- gráficos ----
  const headlineRuns = headlineIds.map((id) => runs.get(id)! as SimResult).filter(Boolean);
  const charts = overlayCharts(headlineRuns);
  for (const c of charts) writeFileSync(out('charts/' + c.file), c.svg, 'utf8');
  for (const res of headlineRuns) writeFileSync(out('charts/' + res.scenario.id + '.svg'), panelChart(res), 'utf8');
  writeFileSync(out('data/heads-svg-index.json'), json(headlineIds), 'utf8');

  // ---- informe automático (base) ----
  writeFileSync(out('_auto-summary.md'), buildAutoSummary(summaryRows, mcSummary, headlineIds), 'utf8');

  console.log('OK en', ((Date.now() - t0) / 1000).toFixed(1), 's — escenarios:', runs.size);
}

function round3(v: number) {
  return Math.round(v * 1000) / 1000;
}
function round2(v: number) {
  return Math.round(v * 100) / 100;
}

function buildAutoSummary(rows: Array<Record<string, number | string>>, mc: any, headlineIds: string[]) {
  const lines: string[] = [];
  lines.push('# Resumen automático (generado)');
  lines.push('');
  lines.push('## Tabla comparativa (todas las corridas)');
  lines.push('');
  lines.push('| Escenario | MAE | |Err| máx | pico + | pico − | rec5 | rec10 | osc | acceso% (med) | Gini | top10% | vel | E+netas |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  const needsEnum = rows.filter((r) => r.emitMode === 'shares' || Number(r.gainExp) > 0);
  for (const r of [...rows].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    lines.push(
      `| ${r.id} | ${r.mae} | ${r.maxAbsError} | ${r.peakOver} | ${r.peakUnder} | ${r.recovery5} | ${r.recovery10} | ${r.oscSignChanges} | ${r.meanAccessPct} | ${r.finalGini} | ${r.finalTop10} | ${r.meanVelocity} | ${r.netSupply} |`
    );
  }
  lines.push('');
  lines.push('> Escenarios con política activa (emitMode=shares o ganancias>0): ' + (needsEnum.length ? needsEnum.map((r) => r.id).join(', ') : 'ninguno'));
  lines.push('');
  lines.push('## Monte Carlo');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify(mc, null, 2));
  lines.push('```');
  lines.push('');
  lines.push('## Headline (gráficos)');
  lines.push('');
  lines.push(headlineIds.map((id) => `- ${id}: charts/${id}.svg`).join('\n'));
  lines.push('');
  return lines.join('\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});