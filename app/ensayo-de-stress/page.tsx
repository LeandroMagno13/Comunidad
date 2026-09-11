'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Escenario = {
  id: string;
  label: string;
  mae: number;
  maxAbsError: number;
  peakOver: number;
  peakUnder: number;
  recovery5: number;
  osc: number;
  meanAccessPct: number;
  finalAccessPct: number;
  finalGini: number;
  finalTop10: number;
  meanVelocity: number;
  finalUsers: number;
  finalSupply: number;
  netSupply: number;
  estado: 'critico' | 'alerta' | 'estable';
};

type Presentacion = {
  version: number;
  titulo: string;
  generado: string;
  meta: {
    corridas: number;
    escenariosMinimos: number;
    monteCarloRuns: number;
    monteCarloCycles: number;
    seedBase: number;
    fecha: string;
  };
  charts: {
    cuadricula: Array<{ id: string; label: string; panel: string }>;
    overlays: Array<{ file: string; name: string }>;
  };
  datos: {
    summaryCsv: string;
    monteCarloJson: string;
    traces: Array<{ file: string; name: string }>;
    reporte: string;
    autoResumen: string;
  };
  rondaA: number;
  rondaB: number;
  tablas: {
    escenarios: Escenario[];
    barridos: number;
  };
  monteCarlo: {
    metrics: Record<string, { mean: number; p5: number; p95: number; min: number; max: number }>;
  };
};

const HALLAZGOS: Array<{ titulo: string; texto: string; severidad: 'critico' | 'alto' | 'medio' }> = [
  {
    titulo: 'Sensor de canasta casi ciego',
    texto:
      'El costo observado se mueve < 0,5 CU sobre un setpoint de 100 incluso cuando la oferta cae 88 % (E4). El PID monitorea un termómetro roto.',
    severidad: 'critico',
  },
  {
    titulo: 'Lazo de control desconectado',
    texto:
      'La política de oferta tiene ganancias 0: ignora la señal del PID. Siete combinaciones de Kp/Ki/Kd producen resultados idénticos.',
    severidad: 'critico',
  },
  {
    titulo: 'Acceso estructuralmente bajo',
    texto:
      'Con 20 CU por usuario y canasta en 100, el acceso medio es 0,4–1,7 %. Nadie puede comprar la canasta en la mayoría de los escenarios.',
    severidad: 'alto',
  },
  {
    titulo: 'Concentración robusta',
    texto:
      'Gini 65–96 y top-10 ≥ 50 % en toda la familia. Monte Carlo: Gini medio 75, top-10 54 %. El sistema concentra por diseño.',
    severidad: 'alto',
  },
  {
    titulo: 'Shocks de demanda invisibles',
    texto:
      'E8 y E9 son numéricamente idénticos: sumar +100 % de demanda a un sistema con acceso ~0 no mueve nada.',
    severidad: 'medio',
  },
  {
    titulo: 'Oleadas de usuarios desestabilizan',
    texto:
      'Entrada masiva (100/ciclo) nunca recupera la banda ±5 % (rec5 = 80) con error máximo 5,02 CU. La perturbación más grande vista.',
    severidad: 'medio',
  },
];

const VARDIAS_MC: Array<{ key: string; label: string }> = [
  { key: 'mae', label: 'Error medio absoluto' },
  { key: 'maxAbsError', label: 'Error máximo' },
  { key: 'stdError', label: 'Desviación del error' },
  { key: 'recovery10', label: 'Tiempo de recuperación (banda 10%)' },
  { key: 'meanAccessPct', label: 'Acceso medio (%)' },
  { key: 'finalGini', label: 'Gini final' },
  { key: 'finalTop10', label: 'Top-10 %' },
  { key: 'meanVelocity', label: 'Velocidad media' },
];

const SEVERIDAD_ESTILO: Record<Escenario['estado'], { label: string; cls: string }> = {
  critico: { label: 'Crítico', cls: 'bg-red-100 text-red-800 border-red-200' },
  alerta: { label: 'Alerta', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  estable: { label: 'Estable', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

const JERINGA: Record<string, string> = {
  critico: 'text-red-600',
  alto: 'text-orange-500',
  medio: 'text-amber-500',
};

export default function EnsayoDeStress() {
  const [data, setData] = useState<Presentacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState(0);
  const [selOverlay, setSelOverlay] = useState(0);

  useEffect(() => {
    fetch('/stress-test/data/presentation.json')
      .then((r) => {
        if (!r.ok) throw new Error('presentation.json no disponible');
        return r.json();
      })
      .then((d: Presentacion) => setData(d))
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-lg font-semibold text-red-800">Ensayo de Stress — Economía CU</h1>
          <p className="mt-2 text-sm text-red-700">
            No se pudieron cargar los datos del ensayo ({error}). Ejecutá el export: <code>pnpm dlx tsx scripts/stress/export-web.ts</code>
          </p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="text-sm text-slate-500">Cargando datos del ensayo de stress…</p>
      </main>
    );
  }

  const selPanel = data.charts.cuadricula[sel];
  const overlays = data.charts.overlays;
  const selOverlayFile = overlays[selOverlay];

  return (
    <main>
      {/* HERO */}
      <section className="from-slate-950 via-slate-900 to-indigo-950 bg-gradient-to-br">
        <div className="mx-auto max-w-6xl px-4 py-14 text-white">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-sky-300 uppercase">Laboratorio de economía CU</p>
              <h1 className="mt-2 max-w-2xl text-3xl font-bold sm:text-4xl">Ensayo de Stress · Economía de CU</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
                Simulación sistemática del modelo experimental de CU tal como está configurado. Buscamos romperlo, no demostrar que funciona.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-sky-200">{data.meta.corridas} corridas</span>
              <span className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-3 py-1 text-indigo-200">{data.meta.escenariosMinimos} escenarios mínimos</span>
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                Monte Carlo ×{data.meta.monteCarloRuns} · semilla {data.meta.seedBase}
              </span>
              <span className="rounded-full border border-slate-500/40 bg-slate-500/10 px-3 py-1 text-slate-300">{data.meta.fecha}</span>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">RONDA A · modelo actual</p>
              <p className="mt-1 text-3xl font-bold text-white">{data.rondaA}</p>
              <p className="mt-1 text-[11px] text-slate-400">corridas con política inerte (gains 0)</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">RONDA B · alternativas</p>
              <p className="mt-1 text-3xl font-bold text-white">{data.rondaB}</p>
              <p className="mt-1 text-[11px] text-slate-400">corridas exploratorias (sin aplicar)</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Error máx. típico</p>
              <p className="mt-1 text-3xl font-bold text-amber-300">&lt; {Math.max(...data.tablas.escenarios.map((e) => e.maxAbsError)).toFixed(1)} CU</p>
              <p className="mt-1 text-[11px] text-slate-400">sobre un setpoint de 100 CU</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Acceso medio</p>
              <p className="mt-1 text-3xl font-bold text-sky-300">
                {Math.max(...data.tablas.escenarios.map((e) => e.meanAccessPct)).toFixed(1)} %
              </p>
              <p className="mt-1 text-[11px] text-slate-400">el máximo de los 16 escenarios</p>
            </div>
          </div>
        </div>
      </section>

      {/* NAV ANCLA */}
      <nav className="sticky top-16 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 py-2 text-sm text-slate-600">
          {[
            ['#veredicto', 'Veredicto'],
            ['#hallazgos', 'Hallazgos'],
            ['#comparativa', 'Comparativa'],
            ['#montecarlo', 'Monte Carlo'],
            ['#graficos', 'Gráficos'],
            ['#rondab', 'RONDA B'],
            ['#metodologia', 'Metodología'],
            ['#datos', 'Datos'],
          ].map(([href, label]) => (
            <a key={href} href={href} className="whitespace-nowrap rounded-md px-2 py-1 hover:bg-slate-100">
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* VEREDICTO */}
      <section id="veredicto" className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Veredicto experimental</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Estable por ceguera, no por control</h2>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600">
            El costo de la canasta nunca desestabiliza porque el sensor casi no lo mueve, no porque el PID lo corrija. La política de oferta está
            inerte (ganancias 0), de modo que la emisión depende solo de los grants de usuarios nuevos. La consecuencia estructural es una economía
            concentrada con acceso minoritario a la canasta: se comporta como un registro de saldos con transferencias, no como una moneda con
            propósito de intercambio.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">Convergencia del sensor: siempre dentro de banda</span>
            <span className="rounded-full bg-red-50 px-3 py-1 font-medium text-red-700">Política inerte: el PID no dispara emisión</span>
            <span className="rounded-full bg-orange-50 px-3 py-1 font-medium text-orange-700">Acceso a canasta &lt; 2 % en 264/265 corridas</span>
          </div>
        </div>
      </section>

      {/* HALLAZGOS */}
      <section id="hallazgos" className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="text-xl font-bold text-slate-900">Hallazgos clave</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {HALLAZGOS.map((h) => (
            <div key={h.titulo} className={`rounded-xl border-l-4 bg-white p-5 shadow-sm ${h.severidad === 'critico' ? 'border-l-red-500' : h.severidad === 'alto' ? 'border-l-orange-400' : 'border-l-amber-400'}`}>
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 text-lg ${JERINGA[h.severidad]}`}>{h.severidad === 'critico' ? '🛑' : h.severidad === 'alto' ? '⚠️' : '📊'}</span>
                <div>
                  <h3 className="font-semibold text-slate-900">{h.titulo}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{h.texto}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARATIVA */}
      <section id="comparativa" className="bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-bold text-slate-900">Tabla comparativa · escenarios mínimos</h2>
          <p className="mt-1 text-sm text-slate-500">
            RONDA A (política inerte). Setpoint 100 CU. Clic en cada fila para abrir su panel de gráficos.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Escenario</th>
                  <th className="px-3 py-3 text-right font-semibold">Estado</th>
                  <th className="px-3 py-3 text-right font-semibold">Err. medio</th>
                  <th className="px-3 py-3 text-right font-semibold">Err. máx</th>
                  <th className="px-3 py-3 text-right font-semibold">Recupera ±5%</th>
                  <th className="px-3 py-3 text-right font-semibold">Osc.</th>
                  <th className="px-3 py-3 text-right font-semibold">Acceso %</th>
                  <th className="px-3 py-3 text-right font-semibold">Gini</th>
                  <th className="px-3 py-3 text-right font-semibold">Top-10 %</th>
                  <th className="px-3 py-3 text-right font-semibold">Velocidad</th>
                  <th className="px-3 py-3 text-right font-semibold">CU fin de juego</th>
                </tr>
              </thead>
              <tbody>
                {data.tablas.escenarios.map((e, i) => {
                  const st = SEVERIDAD_ESTILO[e.estado];
                  const recup = e.recovery5 === 0 ? '—' : `nunca${e.recovery5 >= 40 ? '' : ' (' + e.recovery5 + ' ciclos)'}`;
                  return (
                    <tr
                      key={e.id}
                      onClick={() => {
                        setSel(i);
                        document.getElementById('graficos')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="cursor-pointer border-b border-slate-100 hover:bg-sky-50/60"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">{e.label.replace(/E\d+ · /, '')}</td>
                      <td className="px-3 py-3 text-right">
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600">{e.mae.toFixed(3)}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{e.maxAbsError.toFixed(2)}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{recup}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{e.osc}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{e.finalAccessPct.toFixed(1)}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{e.finalGini.toFixed(1)}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{e.finalTop10.toFixed(1)}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{e.meanVelocity.toFixed(2)}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{fmt(e.finalSupply)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* MONTE CARLO */}
      <section id="montecarlo" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-xl font-bold text-slate-900">Monte Carlo · 200 corridas con semilla reproducible</h2>
        <p className="mt-1 text-sm text-slate-500">
          Jitter en demanda, transferencias, crecimiento y shocks (semilla base {data.meta.seedBase} · {data.meta.monteCarloCycles} ciclos). La banda
          de recuperación nunca se rompe: no hay caos, hay ceguera.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VARDIAS_MC.map((v) => {
            const m = data.monteCarlo?.metrics?.[v.key];
            if (!m) return null;
            return (
              <div key={v.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{v.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{fmt(m.mean)}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  P5–P95: {fmt(m.p5)} – {fmt(m.p95)} · min {fmt(m.min)} / max {fmt(m.max)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* GRAFICOS */}
      <section id="graficos" className="mx-auto max-w-6xl px-4 pb-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Gráficos por escenario</h2>
            <p className="mt-1 text-sm text-slate-500">Paneles generados en SVG · 11 métricas por escenario.</p>
          </div>
          <select
            value={sel}
            onChange={(e) => setSel(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-sky-500"
          >
            {data.charts.cuadricula.map((c, i) => (
              <option key={c.id} value={i}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        {selPanel && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <img src={`/stress-test/${selPanel.panel}`} alt={`Panel ${selPanel.label}`} className="w-full" />
          </div>
        )}

        <div className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900">Series superpuestas (all escenarios)</h3>
            <select
              value={selOverlay}
              onChange={(e) => setSelOverlay(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-sky-500"
            >
              {overlays.map((o, i) => (
                <option key={o.file} value={i}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          {selOverlayFile && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <img src={`/stress-test/${selOverlayFile.file}`} alt={selOverlayFile.name} className="w-full" />
            </div>
          )}
        </div>
      </section>

      {/* RONDA B */}
      <section id="rondab" className="bg-indigo-950 py-12 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-bold">RONDA B · propuestas (simuladas, no aplicadas)</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Se exploraron variantes de política activa (ganancias 1 y 3, asimétrica, tope de emisión, cuotas a nuevos vs históricos). Resultado:
            todas prácticamente idénticas — la señal del sensor es tan pequeña que la emisión base domina y la política no puede manifestarse. Antes
            de activar la política en producción hay que sensibilizar el sensor y alinear el setpoint con la dotación real.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              ['Sensibilizar el sensor', 'Añadir sensibilidad al acceso real, no solo al costo de la canasta.'],
              ['Setpoint coherente', 'Derivar el setpoint de la distribución de saldos (p. ej. mediana), no fijarlo en 100.'],
              ['Emisión de mantenimiento', 'Vincularla a población activa, no al error micro del PID.'],
              ['Grant condicional', 'CU nuevos solo por actividad verificada (publicación/comentario).'],
              ['Freno a la concentración', 'Costo por transferencia o límite de tenencia, si el objetivo es no-moneda.'],
              ['KPI de acceso', 'Sustituir el error de canasta por acceso a la canasta como variable de control.'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                <h3 className="font-semibold text-sky-300">{t}</h3>
                <p className="mt-1 text-sm text-slate-300">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METODOLOGIA */}
      <section id="metodologia" className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Metodología</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
              <li>16 escenarios mínimos + barridos de población, dotación, crecimiento, demanda, oferta, PID y policy.</li>
              <li>200 corridas Monte Carlo con semilla reproducible (mulberry32, semilla 101).</li>
              <li>El harness reutiliza el código real de producción (PidController, evaluateSupplyPolicy, computeNewUserGrant).</li>
              <li>Para cada escenario: 30+ métricas de estabilidad, trazas ciclo a ciclo y gráficos SVG.</li>
            </ol>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Notas de interpretación</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Las CU <span className="font-semibold">no son dinero</span>. La «velocidad» es actividad, no valor.</li>
              <li>• Resultados separados en RONDA A (actual) y RONDA B (propuestas) para saber qué cambio produjo qué resultado.</li>
              <li>• El objetivo era romper el modelo: que esté «estable» en el costo de canasta sin acceso es un fallo, no un éxito.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* DATOS */}
      <section id="datos" className="border-t border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-bold text-slate-900">Datos y entregables</h2>
          <p className="mt-1 text-sm text-slate-500">Archivos reutilizables para auditar y analizar posteriormente.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={`/stress-test/${data.datos.summaryCsv}`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              summary.csv · {data.meta.corridas} corridas
            </a>
            <a href={`/stress-test/${data.datos.monteCarloJson}`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              montecarlo.json
            </a>
            <a href={`/stress-test/${data.datos.reporte}`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              REPORTE.md · análisis completo
            </a>
            <a href={`/stress-test/${data.datos.autoResumen}`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              _auto-summary.md
            </a>
            <Link href="/admin" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              ← Panel de administración
            </Link>
          </div>
          <div className="mt-6 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
            {data.datos.traces.map((t) => (
              <a key={t.file} href={`/stress-test/${t.file}`} className="truncate rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-600 hover:border-sky-300">
                {t.name}
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function fmt(v: number): string {
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + 'k';
  if (Math.abs(v) >= 100) return v.toFixed(0);
  return v.toFixed(2);
}