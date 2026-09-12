import { TraceRow, SimResult } from './engine';

const W = 760;
const H = 260;
const MX = 52; // margen izquierdo
const MY = 18; // margen superior
const BW = W - MX - 14; // ancho plot
const BH = H - MY - 40; // alto plot

const PALETTE = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16'];

export function lineChart(opts: {
  title: string;
  ylabel: string;
  series: Array<{ name: string; color?: string; data: number[] }>;
  reference?: number;
  maxY?: number;
  minY?: number;
}): string {
  const { series, reference, maxY, minY } = opts;
  const all = series.flatMap((s) => s.data);
  let lo = Math.min(0, ...all) * 1.05;
  let hi = Math.max(...all) * 1.05;
  if (maxY !== undefined) hi = maxY;
  if (minY !== undefined) lo = minY;
  if (hi - lo < 1e-6) hi = lo + 1;
  const n = Math.max(...series.map((s) => s.data.length), 1);
  const x = (i: number) => MX + (i / Math.max(1, n - 1)) * BW;
  const y = (v: number) => MY + BH - ((v - lo) / (hi - lo)) * BH;

  // cuadrícula
  let grid = '';
  for (let g = 0; g <= 4; g++) {
    const gy = MY + (g / 4) * BH;
    const val = hi - ((hi - lo) * g) / 4;
    grid += `<line x1="${MX}" y1="${gy.toFixed(1)}" x2="${MX + BW}" y2="${gy.toFixed(1)}" stroke="#e5e7eb" stroke-width="1"/>`;
    grid += `<text x="${MX - 6}" y="${(gy + 3).toFixed(1)}" font-size="9" fill="#9ca3af" text-anchor="end">${fmt(val)}</text>`;
  }
  for (let g = 0; g <= 5; g++) {
    const gx = MX + (g / 5) * BW;
    grid += `<text x="${gx.toFixed(1)}" y="${MY + BH + 12}" font-size="9" fill="#9ca3af" text-anchor="middle">${Math.round((g / 5) * (n - 1))}</text>`;
  }

  let lines = '';
  let refLine = '';
  if (reference !== undefined && reference >= lo && reference <= hi) {
    refLine = `<line x1="${MX}" y1="${y(reference).toFixed(1)}" x2="${MX + BW}" y2="${y(reference).toFixed(1)}" stroke="#d1d5db" stroke-dasharray="4 3" stroke-width="1"/>
       <text x="${MX + 2}" y="${(y(reference) - 3).toFixed(1)}" font-size="9" fill="#9ca3af">set point ${fmt(reference)}</text>`;
  }

  series.forEach((s, si) => {
    if (!s.data.length) return;
    const color = s.color || PALETTE[si % PALETTE.length];
    const pts = s.data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    lines += `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.8"/>`;
  });

  const legend = series
    .map((s, si) => {
      const color = s.color || PALETTE[si % PALETTE.length];
      return `<rect x="${4}" y="${MY + 4 + si * 13}" width="9" height="9" fill="${color}"/><text x="${17}" y="${MY + 12 + si * 13}" font-size="9" fill="#374151">${short(s.name, 60)}</text>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <text x="${MX}" y="12" font-size="12" font-weight="bold" fill="#111827">${escapeXml(opts.title)} — ${escapeXml(opts.ylabel)}</text>
  ${grid}
  ${refLine}
  ${lines}
  ${legend}
</svg>`;
}

const METRICS: Array<{ key: keyof TraceRow; label: string; reference?: (s: SimResult) => number }> = [
  { key: 'observed', label: 'Canasta observada', reference: (s) => s.rows[s.rows.length - 1]?.setPointEffective ?? s.scenario.setPoint },
  { key: 'error', label: 'Error de control (compuesto)' },
  { key: 'supply', label: 'Oferta total CU' },
  { key: 'pidOutput', label: 'Señal PID' },
  { key: 'issued', label: 'Emisión vs consumo' },
  { key: 'burn', label: 'Quema (contracción)' },
  { key: 'accessPct', label: 'Acceso a la canasta (%)' },
  { key: 'avg', label: 'Saldo medio' },
  { key: 'median', label: 'Saldo mediano' },
  { key: 'top10Share', label: 'Concentración 10%' },
  { key: 'users', label: 'Usuarios' },
  { key: 'velocity', label: 'Velocidad' },
];

export function panelChart(res: SimResult): string {
  const panels = METRICS.map((m) => {
    const data = res.rows.map((r) => Number(r[m.key]!));
    const isIssue = m.key === 'issued';
    const reference = m.reference ? m.reference(res) : undefined;
    if (isIssue) {
      return lineChart({
        title: m.label,
        ylabel: '',
        series: [
          { name: 'Emisión', color: '#10b981', data: res.rows.map((r) => r.issued) },
          { name: 'Consumo', color: '#ef4444', data: res.rows.map((r) => r.consumed) },
        ],
        reference,
      });
    }
    return lineChart({ title: m.label, ylabel: '', series: [{ name: res.scenario.label, data }], reference });
  });
  const rows_ = Math.max(1, Math.ceil(panels.length / 2));
  const PH = rows_ * 240;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="${PH}" viewBox="0 0 1600 ${PH}">
  <text x="20" y="28" font-size="20" font-weight="bold" fill="#111827">${escapeXml(res.scenario.label)} — panel</text>
  ${panels.map((p, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const inner = p.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    return `<g transform="translate(${col * 800}, ${row * 240})"><svg x="0" y="0" width="800" height="240" viewBox="0 0 760 260">${inner}</svg></g>`;
  }).join('')}
</svg>`;
}

export function overlayCharts(results: SimResult[]): Array<{ file: string; svg: string }> {
  const headline = results;
  const files: Array<{ file: string; svg: string }> = [];
  for (const m of METRICS) {
    const series = headline.map((r) => ({
      name: `${r.scenario.id}`,
      data: r.rows.map((row) => Number(row[m.key]!)),
    }));
    const reference = m.reference ? m.reference(headline[0]!) : undefined;
    files.push({
      file: `overlay-${String(m.key)}.svg`,
      svg: lineChart({
        title: m.label,
        ylabel: m.label,
        series,
        reference,
      }),
    });
  }
  // emisión vs destrucción combinada
  const emis: Array<{ name: string; color?: string; data: number[] }> = [];
  for (const r of headline) emis.push({ name: `${r.scenario.id} emit`, data: r.rows.map((x) => x.issued) });
  files.push({
    file: 'overlay-emision-vs-consumo.svg',
    svg: lineChart({ title: 'Emisión / consumo por escenario', ylabel: 'CU por ciclo', series: emis }),
  });
  return files;
}

function fmt(v: number): string {
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + 'k';
  return v.toFixed(1);
}

function short(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function writeSvg(path: string, svg: string): void {
  const { mkdirSync, writeFileSync } = require('fs');
  mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  writeFileSync(path, svg, 'utf8');
}