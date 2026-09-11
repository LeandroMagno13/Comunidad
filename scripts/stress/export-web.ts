import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import { join } from 'path';

const EVID = join(process.cwd(), 'evidence', 'stress-test');
const PUB = join(process.cwd(), 'public', 'stress-test');

function out(p: string) {
  return join(EVID, p);
}
function pub(p: string) {
  return join(PUB, p);
}

function ensureDirs() {
  for (const d of ['', 'charts', 'data']) mkdirSync(pub(d), { recursive: true });
}

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const [head, ...rows] = lines;
  const cols = head!.split(',');
  return rows.map((l) => {
    const parts = l.split(',');
    const rec: Record<string, string> = {};
    cols.forEach((c, i) => (rec[c] = parts[i] ?? ''));
    return rec;
  });
}

function main() {
  ensureDirs();

  const summary = parseCsv(readFileSync(out('data/summary.csv'), 'utf8'));
  const monteCarlo = JSON.parse(readFileSync(out('data/montecarlo.json'), 'utf8'));
  const headline: string[] = JSON.parse(readFileSync(out('data/heads-svg-index.json'), 'utf8'));

  const chartFiles = readdirSync(out('charts')).filter((f) => f.endsWith('.svg'));
  const traceFiles = readdirSync(out('data')).filter((f) => f.startsWith('trace-E')).filter((f) => f.endsWith('.csv'));

  // copiar assets a public/stress-test
  for (const f of chartFiles) copyFileSync(join(out('charts'), f), pub('charts/' + f));
  copyFileSync(out('data/summary.csv'), pub('data/summary.csv'));
  copyFileSync(out('data/montecarlo.json'), pub('data/montecarlo.json'));
  for (const f of traceFiles) copyFileSync(join(out('data'), f), pub('data/' + f));
  copyFileSync(out('REPORTE.md'), pub('REPORTE.md'));
  copyFileSync(out('_auto-summary.md'), pub('_auto-summary.md'));

  // tabla comparativa para la web: filas E01..E16 con métricas clave
  const escenarios = summary.filter((r) => /^E\d\d-/.test(r.id));
  const tablas = {
    escenarios: escenarios.map((r) => ({
      id: r.id,
      label: r.label,
      mae: num(r.mae),
      maxAbsError: num(r.maxAbsError),
      peakOver: num(r.peakOver),
      peakUnder: num(r.peakUnder),
      recovery5: num(r.recovery5),
      osc: num(r.oscSignChanges),
      meanAccessPct: num(r.meanAccessPct),
      finalAccessPct: num(r.finalAccessPct),
      finalGini: num(r.finalGini),
      finalTop10: num(r.finalTop10),
      meanVelocity: num(r.meanVelocity),
      finalUsers: num(r.finalUsers),
      finalSupply: num(r.finalSupply),
      netSupply: num(r.netSupply),
      gananciaEmision: num(r.gainExp),
      estado: estadoEscenario(r),
    })),
    barridos: summary.filter((r) => /^(D\d|PID-|S\d|U-|MC-)/.test(r.id)).length,
  };

  const presentation = {
    version: 2,
    titulo: 'Ensayo de Stress — Economía de CU',
    generado: new Date().toISOString(),
    meta: {
      corridas: summary.length,
      escenariosMinimos: escenarios.length,
      monteCarloRuns: monteCarlo.runs,
      monteCarloCycles: monteCarlo.cycles,
      seedBase: monteCarlo.seedBase,
      fecha: new Date().toISOString().slice(0, 10),
    },
    charts: {
      cuadricula: escenarios.map((e) => ({ id: e.id, label: e.label, panel: `charts/${e.id}.svg` })),
      overlays: chartFiles.filter((f) => f.startsWith('overlay-')).map((f) => ({
        file: `charts/${f}`,
        name: nombreOverlay(f),
      })),
    },
    datos: {
      summaryCsv: 'data/summary.csv',
      monteCarloJson: 'data/montecarlo.json',
      traces: traceFiles.map((f) => ({ file: `data/${f}`, name: f.replace('trace-', '').replace('.csv', '') })),
      reporte: 'REPORTE.md',
      autoResumen: '_auto-summary.md',
    },
    rondaA: summary.filter((r) => r.emitMode === 'none' && num(r.gainExp) === 0 && !/MC-/.test(r.id)).length,
    rondaB: summary.filter((r) => r.emitMode === 'shares' || num(r.gainExp) > 0).length,
    tablas,
  };

  writeFileSync(pub('data/presentation.json'), JSON.stringify(presentation, null, 2), 'utf8');
  console.log('OK — export-web: charts', chartFiles.length, '· traces', traceFiles.length, '· corridas', summary.length);
}

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function estadoEscenario(r: Record<string, string>): 'critico' | 'alerta' | 'estable' {
  const max = num(r.maxAbsError);
  const osc = num(r.oscSignChanges);
  const acc = num(r.finalAccessPct);
  if (max >= 2.5 || osc >= 3 || acc === 0) return 'critico';
  if (max >= 1 || acc < 1) return 'alerta';
  return 'estable';
}

function nombreOverlay(f: string): string {
  const map: Record<string, string> = {
    'overlay-observed.svg': 'Canasta observada vs set point',
    'overlay-error.svg': 'Error del sistema',
    'overlay-supply.svg': 'Oferta total de CU',
    'overlay-pidOutput.svg': 'Señal PID',
    'overlay-issued.svg': 'Emisión',
    'overlay-accessPct.svg': 'Acceso a la canasta',
    'overlay-avg.svg': 'Saldo medio',
    'overlay-median.svg': 'Saldo mediano',
    'overlay-top10Share.svg': 'Concentración (10%)',
    'overlay-users.svg': 'Usuarios',
    'overlay-velocity.svg': 'Velocidad',
    'overlay-emision-vs-consumo.svg': 'Emisión vs consumo',
  };
  return map[f] || f.replace('overlay-', '').replace('.svg', '');
}

main();