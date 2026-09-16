'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Metrics = {
  id: string;
  demandaTotal: number;
  demandaSatisfecha: number;
  demandaInsatisfecha: number;
  pctSatisfecha: number;
  presionMax: number;
  presionMedia: number;
  accesoBasicoPct: number;
  accesoMedioPct: number;
  accesoAvanzadoPct: number;
  excluidosBasicoPct: number;
  cuTop10: number;
  cuGini: number;
  urgenciaMarcadaPct: number;
  urgenciaGastoPct: number;
  urgenciaAgotadaPct: number;
  urgenciaEficaciaPct: number;
  dignidadHeadcountPct: number;
  dignidadBrecha: number;
  capacidadUtilizadaPct: number;
  escasezCapacidades: string;
  corrCuUrgencia: number | null;
};

type Escenario = {
  id: string;
  label: string;
  metrics: Metrics;
};

type BarridoCaso = { id: string; label: string; metrics: Metrics };
type Barrido = { id: string; label: string; cases: BarridoCaso[] };

type Presentacion = {
  version: number;
  ronda: string;
  titulo: string;
  generado: string;
  seed: number;
  meta: {
    seedBase: number;
    experimentos: number;
    sweeps: number;
    monteCarloRuns: number;
    generado: string;
    ms: number;
  };
  escenarios: Escenario[];
  barridos: Barrido[];
  monteCarlo: {
    runs: number;
    metricas: {
      keys: string[];
      agg: Record<string, { media: number; min: number; p05: number; p95: number; max: number }>;
    };
  };
  charts: {
    paneles: Array<{ id: string; label: string; panel: string }>;
    overlays: Array<{ file: string; name: string }>;
  };
  tablas: {
    escenarios: Escenario[];
    barridos: Barrido[];
  };
  hallazgos: string[];
  referencia: { rondaA: string; etiquetaRondaA: string };
};

const VARDIAS_MC: Array<{ key: string; label: string; fmt?: (v: number) => string }> = [
  { key: 'pctSatisfecha', label: 'Demanda satisfecha (%)', fmt: (v) => v.toFixed(1) + ' %' },
  { key: 'presionMax', label: 'Presión máxima', fmt: (v) => v.toFixed(1) },
  { key: 'presionMedia', label: 'Presión media', fmt: (v) => v.toFixed(1) },
  { key: 'excluidosBasicoPct', label: 'Excluidos nivel básico (%)', fmt: (v) => v.toFixed(1) + ' %' },
  { key: 'dignidadHeadcountPct', label: 'Bajo piso de dignidad (%)', fmt: (v) => v.toFixed(1) + ' %' },
  { key: 'dignidadBrecha', label: 'Brecha de dignidad media', fmt: (v) => v.toFixed(2) },
  { key: 'urgenciaGastoPct', label: 'Presupuesto urgencia gastado (%)', fmt: (v) => v.toFixed(1) + ' %' },
  { key: 'urgenciaAgotadaPct', label: 'Agentes con urgencia agotada (%)', fmt: (v) => v.toFixed(1) + ' %' },
];

export default function EnsayoDeStress() {
  const router = useRouter();
  const [data, setData] = useState<Presentacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selPanel, setSelPanel] = useState(0);
  const [selOverlay, setSelOverlay] = useState(0);
  const [selBarrido, setSelBarrido] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.user || d.user.role !== 'SUPER_ADMIN') router.replace('/admin');
      })
      .catch(() => router.replace('/admin'));
  }, [router]);

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
          <h1 className="text-lg font-semibold text-red-800">Ensayo de Stress — RONDA C+D</h1>
          <p className="mt-2 text-sm text-red-700">
            No se pudieron cargar los datos del ensayo ({error}). Ejecutá el export:{' '}
            <code>pnpm dlx tsx scripts/stress-capacity/export-web.ts</code>
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

  const paneles = data.charts.paneles;
  const selPanelInfo = paneles[selPanel];
  const overlays = data.charts.overlays;
  const selOverlayFile = overlays[selOverlay];
  const escDs = data.escenarios.filter((e) => !e.id.startsWith('L-'));
  const barridos = data.barridos;
  const selBarridoInfo = barridos[selBarrido];

  const agg = data.monteCarlo.metricas.agg;
  const aggOf = (k: string) => agg[k] ?? { media: 0, p05: 0, p95: 0, min: 0, max: 0 };
  const mcPresion = aggOf('presionMedia');
  const mcSat = aggOf('pctSatisfecha');
  const mcDignidad = aggOf('dignidadHeadcountPct');
  const mcBrecha = aggOf('dignidadBrecha');

  return (
    <main>
      {/* HERO */}
      <section className="from-slate-950 via-slate-900 to-indigo-950 bg-gradient-to-br">
        <div className="mx-auto max-w-6xl px-4 py-14 text-white">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-sky-300 uppercase">Laboratorio de participación</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-bold sm:text-4xl">{data.titulo}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
                Ensayo de stress de capacidad sobre el modelo vigente: señales de demanda, oferta humana y automatización
                (RONDA C) y la apuesta de urgencia periódica no acumulable (RONDA D). Cada escenario corrió en modo D
                (con presupuesto de urgencia) y en modo C espejo (apuesta libre), para medir qué cambia la urgencia.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-sky-200">
                {data.meta.experimentos} escenarios
              </span>
              <span className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-3 py-1 text-indigo-200">
                {data.meta.sweeps} barridos de sensibilidad
              </span>
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                Monte Carlo ×{data.meta.monteCarloRuns} · semilla {data.meta.seedBase}
              </span>
              <span className="rounded-full border border-slate-500/40 bg-slate-500/10 px-3 py-1 text-slate-300">
                v{data.version} · {data.meta.generado.slice(0, 10)}
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Escenarios mínimos</p>
              <p className="mt-1 text-3xl font-bold text-white">{data.meta.experimentos}</p>
              <p className="mt-1 text-[11px] text-slate-400">{data.meta.experimentos / 2} en modo D + {data.meta.experimentos / 2} espejo C</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Presión media (MC)</p>
              <p className="mt-1 text-3xl font-bold text-amber-300">{fmt(mcPresion.media)}</p>
              <p className="mt-1 text-[11px] text-slate-400">P5–P95 {fmt(mcPresion.p05)}–{fmt(mcPresion.p95)}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Demanda satisfecha</p>
              <p className="mt-1 text-3xl font-bold text-sky-300">{fmt(mcSat.media)} %</p>
              <p className="mt-1 text-[11px] text-slate-400">P5–P95 {fmt(mcSat.p05)}–{fmt(mcSat.p95)}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Dignidad · bajo piso</p>
              <p className="mt-1 text-3xl font-bold text-emerald-300">{fmt(mcDignidad.media)} %</p>
              <p className="mt-1 text-[11px] text-slate-400">brecha media {fmt(mcBrecha.media)}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <Link
              href={data.referencia.rondaA}
              className="rounded-full border border-slate-600 bg-slate-900/70 px-3 py-1 text-slate-300 hover:border-slate-400"
            >
              RONDA A archivada →
            </Link>
          </div>
        </div>
      </section>

      {/* RONDA C vs D */}
      <section className="mx-auto max-w-6xl px-4 pt-10">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-teal-200 bg-teal-50 p-6">
            <p className="text-xs font-semibold tracking-wide text-teal-700 uppercase">RONDA C · apuesta libre</p>
            <h2 className="mt-1 text-lg font-bold text-teal-900">Señales de capacidad y prioridad sin costo</h2>
            <p className="mt-2 text-sm leading-relaxed text-teal-800">
              Los pedidos compiten por recursos humanos escasos; las CU de compromiso marcan la prioridad de cada
              apuesta sin costo virtual. Reproduce la realidad de RONDA C: la oferta efectiva la dan los participantas
              con capacidad ofrecida y horas disponibles.
            </p>
          </div>
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-6">
            <p className="text-xs font-semibold tracking-wide text-sky-700 uppercase">RONDA D · urgencia</p>
            <h2 className="mt-1 text-lg font-bold text-sky-900">Presupuesto de urgencia periódico y no acumulable</h2>
            <p className="mt-2 text-sm leading-relaxed text-sky-800">
              Cada participante recibe un presupuesto periódico de urgencia (base 3, tope 3, costo cuadrático por
              nivel). Marcar una urgencia gasta presupuesto real; agotarlo excluye de marcar más. La hipótesis: la
              escasez sin costo expulsa exactamente a quienes más necesitan ser oídos.
            </p>
          </div>
        </div>
      </section>

      {/* NAV ANCLA */}
      <nav className="mt-8 border-b border-slate-200 bg-white/95 backdrop-blur sticky top-16 z-40">
        <div className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 py-2 text-sm text-slate-600">
          {[
            ['#hallazgos', 'Hallazgos'],
            ['#comparativa', 'Comparativa'],
            ['#barridos', 'Barridos'],
            ['#montecarlo', 'Monte Carlo'],
            ['#graficos', 'Gráficos'],
            ['#metodologia', 'Metodología'],
            ['#datos', 'Datos'],
          ].map(([href, label]) => (
            <a key={href} href={href} className="whitespace-nowrap rounded-md px-2 py-1 hover:bg-slate-100">
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* HALLAZGOS */}
      <section id="hallazgos" className="mx-auto max-w-6xl px-4 pb-12 pt-12">
        <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Veredicto experimental</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">La urgencia elimina la exclusión por escasez</h2>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-600">
          En escasez, la apuesta libre sin costo expulsa a los que menos pueden: excluidos de nivel básico 52 %
          (C) frente a 11 % (D) en escasez extrema, y 76,5 % frente a 16 % en escasez persistente. La presión indica
          dónde falta oferta; la urgencia y el piso de dignidad capturan quién queda fuera. Ningún modo aumenta el
          acceso a nivel básico con automatización creciente: el acceso estructural requiere más que oferta.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {data.hallazgos.map((h, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
              {h}
            </div>
          ))}
        </div>
      </section>

      {/* COMPARATIVA */}
      <section id="comparativa" className="bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-bold text-slate-900">Comparativa D vs C · escenarios mínimos</h2>
          <p className="mt-1 text-sm text-slate-500">
            Cada escenario D enfrenta a su espejo C. Las columnas de urgencia solo aplican a la variante D.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Escenario</th>
                  <th className="px-3 py-3 text-right font-semibold">% sat</th>
                  <th className="px-3 py-3 text-right font-semibold">presMed</th>
                  <th className="px-3 py-3 text-right font-semibold">presMax</th>
                  <th className="px-3 py-3 text-right font-semibold">exclBas D</th>
                  <th className="px-3 py-3 text-right font-semibold">exclBas C</th>
                  <th className="px-3 py-3 text-right font-semibold">dig HC D</th>
                  <th className="px-3 py-3 text-right font-semibold">urg gasto D</th>
                  <th className="px-3 py-3 text-right font-semibold">urg efic D</th>
                  <th className="px-3 py-3 text-right font-semibold">corr CU·urg</th>
                </tr>
              </thead>
              <tbody>
                {escDs.map((d) => {
                  const l = data.escenarios.find((e) => e.id === 'L-' + d.id);
                  const m = d.metrics;
                  return (
                    <tr
                      key={d.id}
                      onClick={() => {
                        setSelPanel(paneles.findIndex((p) => p.id === d.id) >= 0 ? paneles.findIndex((p) => p.id === d.id) : 0);
                        document.getElementById('graficos')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="cursor-pointer border-b border-slate-100 hover:bg-sky-50/60"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">{d.label}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{m.pctSatisfecha.toFixed(1)}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{m.presionMedia.toFixed(1)}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{m.presionMax.toFixed(1)}</td>
                      <td className={`px-3 py-3 text-right font-semibold ${m.excluidosBasicoPct > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {m.excluidosBasicoPct.toFixed(1)} %
                      </td>
                      <td className={`px-3 py-3 text-right ${l ? (l.metrics.excluidosBasicoPct > 0 ? 'text-orange-500' : 'text-emerald-600') : 'text-slate-400'}`}>
                        {l ? l.metrics.excluidosBasicoPct.toFixed(1) + ' %' : '—'}
                      </td>
                      <td className={`px-3 py-3 text-right ${m.dignidadHeadcountPct > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {m.dignidadHeadcountPct.toFixed(1)} %
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600">{m.urgenciaGastoPct.toFixed(1)} %</td>
                      <td className="px-3 py-3 text-right text-slate-600">{m.urgenciaEficaciaPct.toFixed(1)} %</td>
                      <td className="px-3 py-3 text-right text-slate-600">{m.corrCuUrgencia === null ? '—' : m.corrCuUrgencia.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* BARRIDOS */}
      <section id="barridos" className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Barridos de sensibilidad</h2>
            <p className="mt-1 text-sm text-slate-500">Un parámetro a la vez. Haz clic en el gráfico para ver la serie completa.</p>
          </div>
          <select
            value={selBarrido}
            onChange={(e) => setSelBarrido(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-sky-500"
          >
            {barridos.map((b, i) => (
              <option key={b.id} value={i}>
                {b.id} · {b.label}
              </option>
            ))}
          </select>
        </div>
        {selBarridoInfo && (
          <>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Caso</th>
                    <th className="px-3 py-3 text-right font-semibold">% sat</th>
                    <th className="px-3 py-3 text-right font-semibold">exclBas %</th>
                    <th className="px-3 py-3 text-right font-semibold">dig HC %</th>
                    <th className="px-3 py-3 text-right font-semibold">urg gasto %</th>
                    <th className="px-3 py-3 text-right font-semibold">presMax</th>
                  </tr>
                </thead>
                <tbody>
                  {selBarridoInfo.cases.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-800">{c.id}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{c.metrics.pctSatisfecha.toFixed(1)}</td>
                      <td className={`px-3 py-3 text-right ${c.metrics.excluidosBasicoPct > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {c.metrics.excluidosBasicoPct.toFixed(1)}
                      </td>
                      <td className={`px-3 py-3 text-right ${c.metrics.dignidadHeadcountPct > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {c.metrics.dignidadHeadcountPct.toFixed(1)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600">{c.metrics.urgenciaGastoPct.toFixed(1)}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{c.metrics.presionMax.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* MONTE CARLO */}
      <section id="montecarlo" className="bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-bold text-slate-900">
            Monte Carlo · {data.monteCarlo.runs} corridas con semilla reproducible
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Jitter en demanda, oferta, participación y shocks (semilla base {data.meta.seedBase}). La dignidad agrega
            una capa que la presión no ve: registra exclusión aun cuando la presión es pequeña.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {VARDIAS_MC.map((v) => {
              const m = data.monteCarlo.metricas.agg[v.key];
              if (!m) return null;
              return (
                <div key={v.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{v.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{fmt(m.media)}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    P5–P95: {fmt(m.p05)} – {fmt(m.p95)} · min {fmt(m.min)} / max {fmt(m.max)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* GRAFICOS */}
      <section id="graficos" className="mx-auto max-w-6xl px-4 pb-12 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Gráficos por escenario</h2>
            <p className="mt-1 text-sm text-slate-500">Paneles SVG por escenario con las trazas de RONDA C+D.</p>
          </div>
          <select
            value={selPanel}
            onChange={(e) => setSelPanel(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-sky-500"
          >
            {paneles.map((c, i) => (
              <option key={c.id} value={i}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        {selPanelInfo && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <img src={`/stress-test/${selPanelInfo.panel}`} alt={`Panel ${selPanelInfo.label}`} className="w-full" />
          </div>
        )}

        <div className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900">Series superpuestas (barridos)</h3>
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

      {/* METODOLOGIA */}
      <section id="metodologia" className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Metodología</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
              <li>16 escenarios mínimos en modo D (urgencia activa) + espejo C (apuesta libre sin costo), sobre el motor RONDA C.</li>
              <li>10 barridos de sensibilidad (población, demanda, oferta, participación, propensión a urgencia, presupuesto, nivel máximo, automatización, patrimonio, shocks).</li>
              <li>200 corridas Monte Carlo con semilla reproducible (mulberry32, semilla {data.meta.seedBase}) y jitter de segmento.</li>
              <li>Métricas por escenario: demanda, presión, acceso, CU, urgencia y piso de dignidad (PISO_ACTIVIDAD = 2).</li>
              <li>El motor es el mismo de la producción (src/lib/agents/engine.ts + cap-formulas), no una réplica aproximada.</li>
            </ol>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Notas de interpretación</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• RONDA C es el espejo de control: mismo escenario sin urgencia. La diferencia D−C es el efecto de la urgencia.</li>
              <li>• La exclusión de nivel básico se define sobre el acceso: quienes no logran ningún pedido satisfecho a ese nivel.</li>
              <li>• El piso de dignidad (headcount bajo PISO_ACTIVIDAD) detecta exclusión que la presión de capacidades no muestra.</li>
              <li>• Las CU <span className="font-semibold">no son dinero</span>: son señal de compromiso/participación, no medio de cambio.</li>
              <li>
                • Este ensayo sustituye al histórico RONDA A (controlador PID). Sus datos permanecen archivados en{' '}
                <Link href={data.referencia.rondaA} className="text-sky-600 underline">
                  ronda-a/
                </Link>
                .
              </li>
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
            <a
              href="/stress-test/data/summary_capacidad_stress.csv"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              summary_capacidad_stress.csv
            </a>
            <a
              href="/stress-test/data/montecarlo.json"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              montecarlo.json
            </a>
            <a
              href="/stress-test/data/presentation.json"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              presentation.json
            </a>
            <a
              href="/stress-test/REPORTE.md"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              REPORTE.md · análisis completo
            </a>
            <a
              href="/stress-test/ronda-a/REPORTE.md"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              REPORTE RONDA A (archivado)
            </a>
            <Link href="/admin" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              ← Panel de administración
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Trazas ciclo a ciclo disponibles en <code>/stress-test/data/</code> (un CSV por escenario y por caso de barrido).
          </p>
        </div>
      </section>
    </main>
  );
}

function fmt(v: number): string {
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + 'k';
  if (Math.abs(v) >= 100) return v.toFixed(0);
  return v.toFixed(1);
}