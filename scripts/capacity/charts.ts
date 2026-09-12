// ============================================================================
// RONDA C — Charts SVG
// ============================================================================
import { CapacitySim } from './engine';
import { CapacityScenario } from './scenarios';

interface Pt {
  x: number;
  y: number;
}
interface Serie {
  key: string;
  color: string;
  pts: Pt[];
}

function svgLineChart(title: string, series: Serie[], height = 240, width = 560, yMax?: number): string {
  const pad = { l: 44, r: 12, t: 34, b: 26 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  let maxY = yMax ?? 0;
  for (const s of series) for (const p of s.pts) maxY = Math.max(maxY, p.y);
  maxY = yMax ?? Math.max(1, maxY * 1.05);
  const X = (x: number) => pad.l + (x * w) / Math.max(1, series[0]?.pts.length! - 1 || 1);
  const Y = (y: number) => pad.t + h - (y / maxY) * h;
  const lines = series
    .map(
      (s) =>
        `<polyline points="${s.pts.map((p) => `${round2(X(p.x))},${round2(Y(p.y))}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="1.6"/>`
    )
    .join('');
  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map((g) => {
      const yy = pad.t + h * g;
      return `<line x1="${pad.l}" y1="${yy}" x2="${width - pad.r}" y2="${yy}" stroke="#00000018" stroke-dasharray="3 3"/><text x="${pad.l - 5}" y="${yy + 3}" font-size="8" fill="#777" text-anchor="end">${Math.round(maxY * (1 - g))}</text>`;
    })
    .join('');
  const legend = series
    .map((s, i) => `<text x="${pad.l + i * 118}" y="${height - 8}" font-size="9" fill="#333"><tspan fill="${s.color}">■</tspan> ${s.key}</text>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#fff"/>
  <text x="${pad.l}" y="18" font-size="12" font-weight="600" fill="#111">${title}</text>
  ${grid}${lines}${legend}
</svg>`;
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

export function demandChart(sim: CapacitySim): string {
  const series: Serie[] = [
    { key: 'demanda registrada', color: '#64748b', pts: [] },
    { key: 'satisfecha', color: '#16a34a', pts: [] },
    { key: 'insatisfecha', color: '#e02424', pts: [] },
  ];
  for (const r of sim.history) {
    const i = r.cycle - 1;
    series[0]!.pts.push({ x: i, y: r.demandaTotal });
    series[1]!.pts.push({ x: i, y: r.demandaSatisfecha });
    series[2]!.pts.push({ x: i, y: r.demandaInsatisfecha });
  }
  return svgLineChart('Demanda: registrada / satisfecha / insatisfecha', series);
}

export function pressureChart(sim: CapacitySim, top = 6): string {
  const caps = sim.history[sim.history.length - 1]!.stats
    .map((s) => ({ id: s.capacidad, p: s.presion }))
    .sort((a, b) => b.p - a.p)
    .slice(0, top);
  const colors = ['#e11d48', '#f97316', '#facc15', '#22c55e', '#0ea5e9', '#6366f1', '#a855f7', '#94a3b8'];
  const series: Serie[] = caps.map((c, i) => ({ key: c.id, color: colors[i % colors.length]!, pts: [] }));
  for (const r of sim.history) {
    const i = r.cycle - 1;
    for (const c of caps) {
      const st = r.stats.find((s) => s.capacidad === c.id)!;
      series[caps.indexOf(c)]!.pts.push({ x: i, y: st.presion });
    }
  }
  return svgLineChart('Señal de presión por capacidad (insatisfecha / oferta)', series, 240, 640);
}

export function accessChart(sim: CapacitySim): string {
  const series: Serie[] = [
    { key: 'básico', color: '#22c55e', pts: [] },
    { key: 'medio', color: '#3b82f6', pts: [] },
    { key: 'avanzado', color: '#8b5cf6', pts: [] },
  ];
  for (const r of sim.history) {
    const i = r.cycle - 1;
    series[0]!.pts.push({ x: i, y: r.acceso.basico });
    series[1]!.pts.push({ x: i, y: r.acceso.medio });
    series[2]!.pts.push({ x: i, y: r.acceso.avanzado });
  }
  return svgLineChart('Niveles de acceso (agentes)', series);
}

export function clusterChart(sim: CapacitySim): string {
  const series: Serie[] = [
    { key: 'CU top-10 %', color: '#e11d48', pts: [] },
    { key: 'Gini CU', color: '#8b5cf6', pts: [] },
  ];
  for (const r of sim.history) {
    const i = r.cycle - 1;
    series[0]!.pts.push({ x: i, y: r.cuAccumulatedTop * 100 });
    series[1]!.pts.push({ x: i, y: r.cuGini * 100 });
  }
  return svgLineChart('Concentración de CU (¿moneda disfrazada?)', series);
}

export function writeSvg(path: string, content: string) {
  const fs = require('fs');
  fs.mkdirSync(require('path').dirname(path), { recursive: true });
  fs.writeFileSync(path, content, 'utf8');
}

export function chartsFor(s: CapacityScenario, sim: CapacitySim): Record<string, string> {
  return {
    demanda: demandChart(sim),
    presion: pressureChart(sim),
    acceso: accessChart(sim),
    cu: clusterChart(sim),
  };
}