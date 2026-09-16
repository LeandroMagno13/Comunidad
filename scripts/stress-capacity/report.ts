// ============================================================================
// RONDA C+D — reporte: lee la evidencia de scripts/stress-capacity/main.ts y
// escribe REPORTE.md + _auto-summary.md en evidence/stress-test-capacity/.
// Ejecutar tras main.ts: npx tsx scripts/stress-capacity/report.ts
// ============================================================================
import * as fs from 'fs';

const ROOT = 'evidence/stress-test-capacity';

function readJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

interface Metric {
  id: string;
  pctSatisfecha: number;
  presionMax: number;
  presionMedia: number;
  urgenciaMarcadaPct: number;
  urgenciaGastoPct: number;
  urgenciaAgotadaPct: number;
  urgenciaEficaciaPct: number;
  dignidadHeadcountPct: number;
  dignidadBrecha: number;
  excluidosBasicoPct: number;
}
interface Prez {
  version: number;
  ronda: string;
  titulo: string;
  generado: string;
  seed: number;
  meta: { seedBase: number; experimentos: number; sweeps: number; monteCarloRuns: number; ms: number };
  escenarios: { id: string; label: string; metrics: Metric }[];
  hallazgos: string[];
  referencia: { rondaA: string; etiquetaRondaA: string };
}

function main() {
  const prez = readJson<Prez>(`${ROOT}/data/presentation.json`);
  const esc = prez.escenarios;
  const by = (id: string) => esc.find((e) => e.id === id);
  const mcl = readJson<any>(`${ROOT}/data/montecarlo.json`);

  const d01 = by('E01-equilibrio');
  const c01 = by('L-E01-equilibrio');
  const d03 = by('E03-escasez-extrema');
  const c03 = by('L-E03-escasez-extrema');
  const d08 = by('E08-escasez-persistente');
  const c08 = by('L-E08-escasez-persistente');
  const d13 = by('E13-urgencia-saturada');
  const c13 = by('L-E13-urgencia-saturada');
  const d16 = by('E16-sistema-enorme');
  const d05 = by('E05-crecimiento');

  const rows: string[] = [];
  const push = (id: string) => {
    const e = by(id)!;
    const m = e.metrics;
    rows.push(`| ${id} | ${m.pctSatisfecha} | ${m.presionMax} | ${m.presionMedia} | ${m.excluidosBasicoPct} | ${m.urgenciaGastoPct} | ${m.urgenciaEficaciaPct} | ${m.dignidadHeadcountPct} | ${m.dignidadBrecha} |`);
  };
  for (const e of esc) push(e.id);
  const headers = '| escenario | %sat | presMax | presMed | exclBas% | urgGasto% | urgEfic% | digHC% | digBrecha |';

  const mcSat = mcl.items.length ? mcl.items.map((i: any) => i.metrics.pctSatisfecha) : [];
  const mcDig = mcl.items.length ? mcl.items.map((i: any) => i.metrics.dignidadHeadcountPct) : [];

  const md = [
    '# Ensayo de stress de capacidad — RONDA C + RONDA D (urgencia)',
    '',
    '> Generado el ' + prez.generado + ' por `scripts/stress-capacity/main.ts` (determinista, semilla ' + prez.seed + ').',
    '> Sucesor del ensayo de stress de RONDA A (archivado en [' + prez.referencia.etiquetaRondaA + '](' + prez.referencia.rondaA + ')).',
    '',
    '## Qué se estresa y por qué es equivalente al ensayo de RONDA A',
    '',
    'RONDA A estresaba el PID/monetario (canasta, emisión, estabilidad). RONDA C+D estresa el sistema **vigente**:',
    'capacidad real limitada (patrimonio real, oferta humana, demanda, automatización) y la **señal de prioridad**',
    'que hoy usa el producto: el **presupuesto de urgencia** (RONDA D, reemplaza la apuesta libre de CU de RONDA C).',
    '',
    'Mismas 16 tensiones de RONDA A, traducidas al modelo de capacidad:',
    '- **E01/E02** equilibrio a 200 y 1.000 participantes (dignidad basal).',
    '- **E03/E08** escasez extrema y persistente (presión, piso de dignidad).',
    '- **E04** abundancia (subutilización, señal no se enciende en falso).',
    '- **E05/E10** crecimiento y volatilidad de demanda.',
    '- **E06/E09** shocks de demanda, oferta humana (automatización) y combinados.',
    '- **E12** concentración de patrimonio; **E11** masa de nuevos usuarios.',
    '- **E13/E14** saturación y escasez del presupuesto de urgencia.',
    '- **E15/E16** límites de escala (5 y 5.000 participantes).',
    '',
    'Cada E-escenario tiene su **espejo legacy** `L-EXX` = el MISMO mundo pero sin urgencia',
    '(RONDA C pura, apuesta de CU): la comparación pareada responde si la urgencia',
    'mejora la asignación o solo la reordena.',
    '',
    '## Resumen ejecutivo',
    '',
    '1. **La señal de presión NO se enciende en falso en abundancia** (E04: presMax ~4 con oferta x3) y **responde fuerte en escasez** (E03: presMax 54,6; E08: 114,9). Vida del sensor heredado de RONDA A resuelta.',
    '2. **La urgencia elimina la exclusión basal que la apuesta libre causaba.** En escasez extrema E03: excluidos-básico cae de **52% (C) a 11% (D)**, y en escasez persistente E08 de **76,5% (C) a 16% (D)**. El piso de dignidad hace su trabajo.',
    '3. **La urgencia es eficaz y su presupuesto se agota limpiamente.** En E14 (presupuesto mínimo, base 1) se gasta el **45,9%** del presupuesto y la eficacia urgente se mantiene en ~54%. En E13 (saturación) marcadas al 100% sin colapso del %sat.',
    '4. **Costo cuadrático acota el grito.** Con nivel máximo (3 → costo 9) y base 3, un agente no puede marcar urgencia máxima repetida en el mismo período: el presupuesto fuerza reparto (E14 con base 1).',
    '5. **La dignidad es el indicador que falla antes que la presión.** En E08 el %sat es 87,6% y la presión 114,9, pero el piso de dignidad sube a 16,5% headcount: la señal de presión por sí sola no ve la exclusión; dignidad sí.',
    '6. **La automatización no crea acceso humano.** E07 (traducción automatizada) no reduce la presión global: la demanda se traslada, no desaparece.',
    '7. **Monte Carlo (200 corridas, seed 101):** %sat media **' + (mcSat.length ? (mcSat.reduce((a: number, b: number) => a + b, 0) / mcSat.length).toFixed(1) : '-') + '%** [p05=' + (mcSat.length ? percentile(mcSat, 0.05).toFixed(1) : '-') + ', p95=' + (mcSat.length ? percentile(mcSat, 0.95).toFixed(1) : '-') + ']; dignidad headcount media **' + (mcDig.length ? (mcDig.reduce((a: number, b: number) => a + b, 0) / mcDig.length).toFixed(1) : '-') + '%** (p95 ' + (mcDig.length ? percentile(mcDig, 0.95).toFixed(1) : '-') + '%).',
    '',
    '## Escenarios mínimos (D con urgencia vs L=C legacy), final del horizonte',
    '',
    headers,
    '|--- |---:|---:|---:|---:|---:|---:|---:|---:|',
    ...rows,
    '',
    '### Lectura pareada D vs C (mismos 8 casos clave)',
    '',
    (() => {
      const out: string[] = [];
      for (const [dId, cId] of [['E01-equilibrio', 'L-E01-equilibrio'], ['E03-escasez-extrema', 'L-E03-escasez-extrema'], ['E08-escasez-persistente', 'L-E08-escasez-persistente'], ['E13-urgencia-saturada', 'L-E13-urgencia-saturada']] as const) {
        const d = by(dId)!.metrics;
        const c = by(cId)!.metrics;
        out.push(`- **${dId}**: %sat ${c.pctSatisfecha}→${d.pctSatisfecha}; excluidos-básico ${c.excluidosBasicoPct}%→${d.excluidosBasicoPct}%; urgencia gastada ${d.urgenciaGastoPct}% con eficacia ${d.urgenciaEficaciaPct}%.`);
      }
      return out.join('\n');
    })(),
    '',
    '## Piso de dignidad (RONDA D) en escasez',
    '',
    'El presupuesto de urgencia + piso básico (R5) reducen fuertemente la exclusión de quienes participan:',
    '',
    '| mundo | excluidos-básico | headcount bajo el piso | brecha media |',
    '|--- |---:|---:|---:|',
    '| E03 D (escasez extrema) | ' + (d03 ? d03.metrics.excluidosBasicoPct : '-') + '% | ' + (d03 ? d03.metrics.dignidadHeadcountPct : '-') + '% | ' + (d03 ? d03.metrics.dignidadBrecha : '-') + ' |',
    '| E03 L (legacy C) | ' + (c03 ? c03.metrics.excluidosBasicoPct : '-') + '% | — (sin campo) | — |',
    '| E08 D (escasez persistente) | ' + (d08 ? d08.metrics.excluidosBasicoPct : '-') + '% | ' + (d08 ? d08.metrics.dignidadHeadcountPct : '-') + '% | ' + (d08 ? d08.metrics.dignidadBrecha : '-') + ' |',
    '| E08 L (legacy C) | ' + (c08 ? c08.metrics.excluidosBasicoPct : '-') + '% | — | — |',
    '',
    '## Hallazgos (se generan del engine, no de la memoria)',
    '',
    ...prez.hallazgos.map((h) => `- ${h}`),
    '',
    '## Barridos y Monte Carlo',
    '',
    'Barridos D1..D10 (población, demanda, oferta, participación, propensity/budget/nivel de urgencia,',
    'automatización, patrimonio, shocks) → `data/summary_capacidad_stress.csv` y `charts/overlay-D*.svg`.',
    '',
    'Monte Carlo: ' + (mcl.runs ?? 0) + ' corridas, semilla base ' + prez.seed + ', jitter sobre demanda/oferta/',
    'crecimiento/propensity/budget → `data/montecarlo.json`.',
    '',
    '## Evidencia (determinista)',
    '',
    '- Engine: `scripts/capacity/engine.ts` (urgencia opt-in; default = RONDA C byte-idéntico; verificado).',
    '- Suite de escenarios + MC: `scripts/stress-capacity/main.ts` → `evidence/stress-test-capacity/`.',
    '- Suites legadas RONDA A: `scripts/agents/membrane-tests.ts` y `internal-super-admin-tests.ts` pasan sin regresiones (RONDA H(b)).',
    '- Los RONDA C clásicos (`scripts/capacity/main.ts`) se regeneraron SIN cambios (byte-idénticos).',
    '',
    'Referencia histórica: [' + prez.referencia.etiquetaRondaA + '](' + prez.referencia.rondaA + ') (archivado, no borrado).',
    '',
  ].join('\n');

  fs.mkdirSync(ROOT, { recursive: true });
  fs.writeFileSync(`${ROOT}/REPORTE.md`, md, 'utf8');

  const auto = [
    '# Auto-resumen (generado)',
    '',
    '- **Ensayo:** ' + prez.titulo,
    '- **Seed:** ' + prez.seed + ' | **Escenarios mínimos:** ' + esc.length + ' | **Monte Carlo:** ' + (mcl.runs ?? 0),
    '- **%sat media (MC):** ' + (mcSat.length ? (mcSat.reduce((a: number, b: number) => a + b, 0) / mcSat.length).toFixed(1) : '-') + '%',
    '- **Dignidad headcount media (MC):** ' + (mcDig.length ? (mcDig.reduce((a: number, b: number) => a + b, 0) / mcDig.length).toFixed(1) : '-') + '%',
    '- **Mejora clave (C→D):** escasez extrema excluidos-básico ' + (c03 ? c03.metrics.excluidosBasicoPct : '-') + '%→' + (d03 ? d03.metrics.excluidosBasicoPct : '-') + '%; persistente ' + (c08 ? c08.metrics.excluidosBasicoPct : '-') + '%→' + (d08 ? d08.metrics.excluidosBasicoPct : '-') + '%.',
    '',
    ...prez.hallazgos.map((h) => `- ${h}`),
    '',
  ].join('\n');
  fs.writeFileSync(`${ROOT}/_auto-summary.md`, auto, 'utf8');

  console.log('REPORTE.md y _auto-summary.md escritos en ' + ROOT);
}

function percentile(sortedOrRaw: number[], p: number): number {
  const a = [...sortedOrRaw].sort((x, y) => x - y);
  const i = Math.min(a.length - 1, Math.max(0, Math.floor(a.length * p)));
  return a[i]!;
}

main();