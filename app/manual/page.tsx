import type { Metadata } from 'next';
import Link from 'next/link';
import { MANUAL_CHANGELOG, MANUAL_UPDATED_AT, MANUAL_VERSION } from '../../src/lib/manual';

export const metadata: Metadata = {
  title: 'Manual de uso | Comunidad Post Singularidad',
  description:
    'Manual de uso de esta versión de Comunidad Post Singularidad: cómo participar, de dónde salen las CU, qué se puede y qué no se puede hacer, y cómo funciona el laboratorio.',
  alternates: {
    canonical: '/manual',
  },
  openGraph: {
    title: 'Manual de uso | Comunidad Post Singularidad',
    description:
      'Guía de esta versión del laboratorio: participación, CU de bienvenida, niveles de acceso, gremios, señales y controles de administración.',
    url: 'https://comunidad-i86g.vercel.app/manual',
    siteName: 'Comunidad Post Singularidad',
    locale: 'es_AR',
    type: 'website',
  },
};

function Block({
  id,
  title,
  eyebrow,
  children,
}: {
  id?: string;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24 rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-wide text-sky-600 mb-1">{eyebrow}</p>
      )}
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-4 text-gray-700 leading-relaxed text-sm sm:text-base">{children}</div>
    </div>
  );
}

function L({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-sky-700 underline underline-offset-2 hover:text-sky-900">
      {children}
    </Link>
  );
}

export default function ManualPage() {
  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl space-y-6 px-4">
        <div className="rounded-xl bg-slate-900 p-8 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-300">Manual de uso</p>
          <h1 className="mt-2 text-3xl font-bold">Cómo funciona esta versión del sistema</h1>
          <p className="mt-4 text-sm text-slate-300">
            Este manual cambia con cada versión del sistema. Cuando se actualiza, lo avisamos a los usuarios
            mediante notificaciones. Versión{' '}
            <span className="font-semibold text-sky-300">v{MANUAL_VERSION}</span> · {MANUAL_UPDATED_AT}.
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Esto es un laboratorio. Todo lo que leés aquí puede variar según cómo participe la comunidad.
          </p>
        </div>

        <Block id="version" eyebrow="Versión vigente" title="Qué es esta versión (RONDA C + RONDA D)">
          <p>
            Muchas tareas dejan de depender de personas a medida que las máquinas aprenden:
            <strong> ¿quién será propietario de la productividad que producen las máquinas?</strong>{' '}
            El sistema investiga si una comunidad puede participar de esa productividad siendo
            propietaria de una parte del capital productivo que la genera.
          </p>
          <p>
            Esta versión estudia dos capas <strong>por separado</strong>: la capacidad material
            (patrimonio común de inversión, todavía en estudio) y las señales de capacidad humana (las{' '}
            <strong>CU</strong>). Las CU son una unidad experimental de participación y señal: no son dinero,
            no representan patrimonio, no tienen precio ni se conectan automáticamente con la participación
            en rendimientos. La <strong>Ronda D</strong> introduce un presupuesto de urgencia que reemplaza la
            «apuesta de prioridad» con CU y pone como indicador principal el piso de dignidad (ver{' '}
            <L href="#urgencia">presupuesto de urgencia</L>).
          </p>
          <p>
            Lo que está implementado hoy se concentra en registrar participación, demanda, oferta y acceso, y
            en mostrar las señales que eso produce. La construcción efectiva del patrimonio y cualquier
            participación en rendimientos quedan para etapas posteriores, sujetas a una estructura jurídica y
            económica real que todavía no está definida. Ver <L href="/principios">los principios</L> y la{' '}
            <L href="/">landing</L> para el contexto conceptual.
          </p>
        </Block>

        <Block id="api-publica" eyebrow="Para integraciones" title="API pública de PostSingular">
          <p>
            Personas, bots y agentes de IA pueden consultar contenido que ya es visible públicamente sin iniciar sesión. La base de la API es{' '}
            <a href="https://postsingular.org/api/v1/public/" className="font-medium text-sky-700 underline underline-offset-2 hover:text-sky-900">https://postsingular.org/api/v1/public/</a>.
            Es de <strong>solo lectura</strong>: no publica, modifica ni entrega datos privados.
          </p>
          <p>Los recursos disponibles son:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><code>health</code>: comprobación básica de disponibilidad del servicio público.</li>
            <li><code>community</code>: métricas públicas agregadas de la comunidad.</li>
            <li><code>posts</code>, <code>guilds</code>, <code>requests</code>, <code>polls</code> y <code>activity</code>: contenido y movimiento visibles.</li>
            <li><code>users</code>: perfiles públicos mínimos y sus gremios activos; nunca correo, contraseña, token ni datos administrativos.</li>
          </ul>
          <p>
            Por ejemplo, <code>GET /api/v1/public/posts?limit=50</code> devuelve publicaciones visibles en JSON. Para detectar novedades sin descargar todo cada vez, <code>posts</code>, <code>guilds</code> y <code>users</code> aceptan <code>since=&lt;fecha ISO 8601&gt;</code>. Una integración debe guardar el último momento consultado y respetar una frecuencia moderada (como máximo una consulta por recurso por hora).
          </p>
          <p>La API no requiere autenticación para estos recursos públicos. Los parámetros que intenten solicitar datos privados se ignoran, y no existe una ruta pública para bandejas internas o mensajes privados.</p>
        </Block>

        <Block id="cuenta" eyebrow="Tu cuenta" title="Tu cuenta y tu perfil">
          <p>
            Con tu cuenta podés:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Editar tu perfil: nombre, bio, qué sabés hacer (profesión, habilidades e intereses) y tu disponibilidad.</li>
            <li>Ver tu nivel de acceso y tu registro de CU en <L href="/profile">Perfil</L>.</li>
            <li>Participar en <L href="/community">Comunidad</L> y en los <L href="/guilds">Gremios</L>.</li>
          </ul>
          <p>
            El perfil sirve para que otras personas sepan qué podés aportar. No se usa para calcular cuánto
            valés ni para asignar derechos sobre el patrimonio.
          </p>
        </Block>

        <Block id="bienvenida" eyebrow="De dónde salen las CU" title="La CU de bienvenida">
          <p>
            Al registrarte, si la política de bienvenida está activa, recibís una{' '}
            <strong>CU de bienvenida</strong>: un punto de partida interno, explícito y acotado (con tope
            anti-abuso). No es dinero, no se puede convertir y no representa riqueza.
          </p>
          <p>
            Desde la <strong>Ronda D</strong> las CU <strong>no se usan para comprar prioridad</strong> y no
            se transfieren al satisfacer una solicitud: la prioridad se marca con el{' '}
            <L href="#urgencia">presupuesto de urgencia</L>, que es periódico, no acumulable y con costo
            creciente. Al completar una solicitud, el proveedor sube su nivel de acceso por{' '}
            <span className="font-semibold">contribución verificada</span>, no por CU cobradas.
          </p>
          <p>
            En las solicitudes comunitarias (<L href="/community">Comunidad</L>) no se mueven CU: solo se
            registra la participación. No existe emisión automática por controlador, ni minado, ni compra de
            CU. Una solicitud de capacidad que expira sin resolverse (30 días) se descarta sin ningún cargo.
          </p>
        </Block>

        <Block id="niveles" eyebrow="Acceso" title="Niveles de acceso: básico, medio y avanzado">
          <p>
            El nivel de acceso es una categoría <strong>funcional experimental</strong>, no una jerarquía de
            valor personal.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Básico</strong>: piso protegido. Se entra al registrarse; nadie queda afuera por no tener nada que ofrecer.</li>
            <li><strong>Medio</strong>: sube al participar (por ejemplo, teniendo solicitudes satisfechas).</li>
            <li><strong>Avanzado</strong>: sube con contribución verificada, por ejemplo satisfaciendo solicitudes de otras personas.</li>
          </ul>
          <p>
            El nivel <strong>nunca</strong> depende del saldo de CU. Tener más CU no te convierte en mejor
            persona, y tener menos no te hace valer menos.
          </p>
        </Block>

        <Block id="participar" eyebrow="Participación" title="Cómo participar">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Solicitudes comunitarias</strong> (<L href="/community">Comunidad</L>): publicá una
              necesidad u ofrecerte a resolver la de otra persona. Al completar, el autor confirma tu
              participación y queda registrada. No hay pago de por medio.
            </li>
            <li>
              <strong>Cartelera</strong>: en Comunidad y en cada gremio, los formularios no están
              intercalados: arriba de cada cartelera elegís con tres botones qué querés publicar
              (Información, Solicitud comunitaria o Encuesta) y se abre el formulario correspondiente.
              Debajo hay filtros para ordenar de más antiguo a más nuevo (o al revés) y para mostrar
              solo información, solicitudes o encuestas.
            </li>
            <li>
              <strong>Publicaciones con formato</strong>: el editor da controles simples — titulares
              (H1–H3), negrita, cursiva, listas, citas, bloques de código, separadores y enlaces — sin
              escribir código. Solo se guarda un subconjunto seguro y todo se sanea al guardar y al
              mostrar: pegar HTML ajeno se ve como texto plano.
            </li>
            <li>
              <strong>Oferta de capacidades</strong>: declarás qué capacidades ofrecés y a qué
              disponibilidad y calidad. Esa declaración alimenta la «oferta» de las señales.
            </li>
            <li>
              <strong>Gremios</strong> (<L href="/guilds">Gremios</L>): agrupate por especialidad (economía,
              derecho, tecnología, cultura…). Ahí se discute cómo avanzar el experimento y se proponen reglas.
            </li>
            <li>
              <strong>Representantes</strong>: cada gremio puede elegir uno o varios representantes entre sus
              miembros activos, con distintivo visible. Solo el creador o admin del gremio designa o quita
              representantes, siempre entre miembros activos.
            </li>
            <li>
              <strong>Encuestas</strong>: cada gremio crea sus encuestas internas y la comunidad crea encuestas
              generales, con opciones y un enlace opcional a la publicación referida. Vota quien corresponde
              (miembros activos del gremio; cualquier usuario registrado en la comunidad) y cada voto queda
              registrado con usuario, opción y fecha: los resultados son consultables con trazabilidad.
            </li>
            <li>
              <strong>Cartelera</strong>: en <L href="/community">Comunidad</L> y en cada gremio los
              formularios no interrumpen el contenido. Arriba hay tres botones — <strong>Información</strong>,{' '}
              <strong>Solicitud comunitaria</strong> y <strong>Encuesta</strong> — que abren el formulario del
              tipo elegido, y debajo filtros para ordenar de más antiguas a más nuevas o al revés y para ver
              solo información, solo solicitudes o solo encuestas. El contenido unificado aparece debajo.
            </li>
            <li>
              <strong>Mensajes</strong> (<L href="/messages">Mensajes</L>): conversaciones directas entre
              miembros.
            </li>
          </ul>
        </Block>

        <Block id="senales" eyebrow="Señales" title="Demanda, oferta, presión y carga">
          <p>
            El sistema mide, por capacidad, la <strong>demanda vigente</strong> (solicitudes activas o
            satisfechas en los últimos 30 días; las viejas expiran y no acumulan), la{' '}
            <strong>oferta declarada</strong> (cuánta gente declara ofrecer esa capacidad) y la{' '}
            <strong>oferta efectiva</strong> (disponibilidad × calidad, ponderadas por nivel de acceso).
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Presión</strong> = demanda insatisfecha / oferta efectiva. Alta presión sugiere un posible cuello de botella.</li>
            <li><strong>Carga humana</strong> = capacidad utilizada / disponible. Permite distinguir «abundante» de «saturada» cuando la presión sola no alcanza.</li>
          </ul>
          <p>
            Son señales de <strong>información</strong>, no precios. No se convierten en un ranking de
            personas y no se usan para juzgar a nadie.
          </p>
        </Block>

        <Block id="urgencia" eyebrow="RONDA D" title="Presupuesto de urgencia y piso de dignidad">
          <p>
            La <strong>Ronda D</strong> corrige un problema de la «apuesta de prioridad» anterior: apostar CU
            libres no tenía costo de oportunidad real, la señal de urgencia se saturaba y quien acumulaba CU
            podía comprar prioridad, reintroduciendo concentración.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Presupuesto de urgencia periódico</strong>: cada persona dispone de una cantidad fija de
              puntos por período (semanal). Los puntos <strong>no se acumulan</strong> entre períodos: no se
              pueden ahorrar para después.
            </li>
            <li>
              <strong>Costo creciente (cuadrático)</strong>: marcar una solicitud como urgente en nivel 1
              cuesta 1 punto, nivel 2 cuesta 4 y nivel 3 cuesta 9. Gritar más fuerte cuesta más caro
              (adaptación del voto cuadrático).
            </li>
            <li>
              <strong>No transferible ni convertible</strong>: la urgencia gastada no se transfiere a quien
              satisface la solicitud ni se convierte en CU. El proveedor recibe participación verificada
              (sube de nivel), no urgencia cobrada.
            </li>
          </ul>
          <p>
            En paralelo, el indicador principal deja de ser la <strong>desigualdad relativa</strong> (el Gini
            histórico) y pasa a ser el <strong>piso de dignidad</strong>: cuánta gente queda debajo del piso
            y cuánto le falta (headcount y brecha). El umbral del piso es una decisión de gobernanza; hoy se
            usa un umbral operativo provisional (participación verificada reciente) que los gremios pueden
            discutir y cambiar.
          </p>
        </Block>

        <Block id="cuestas-cu" eyebrow="Tu registro de CU" title="Ver tus CU en Perfil">
          <p>
            En tu perfil, la sección «Mis CU · registro experimental» muestra tu saldo y el historial de
            transacciones (emisiones de bienvenida y consumos). Desde la Ronda D las CU ya no se transfieren
            por solicitudes de capacidad, así que el registro se mantiene como señal de participación, no
            como un monedero.
          </p>
        </Block>

        <Block id="no-se-puede" eyebrow="Límites" title="Qué no se puede hacer todavía">
          <ul className="list-disc space-y-1 pl-5">
            <li>No hay transferencias directas entre usuarios en la interfaz.</li>
            <li>No se puede comprar, vender, convertir ni retirar CU.</li>
            <li>Las CU no tienen precio, tipo de cambio ni equivalencia con dinero.</li>
            <li>La urgencia no se puede ahorrar ni acumular: el presupuesto se renueva por período y no se transfiere a otras personas.</li>
            <li>No hay aportes de capital, promesas de rentabilidad ni distribución de rendimientos.</li>
            <li>Nadie es calificado ni rankeado por su saldo de CU.</li>
          </ul>
        </Block>

        <Block id="panel-admin" eyebrow="Solo personal del sistema" title="Panel de administración («Economía CU»)">
          <p>
            El panel <L href="/admin">Admin</L>, pestaña «Economía CU», tiene varios controles. Acá está qué
            hace cada uno:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>«Medir ahora»</strong>: recalcula las métricas y señales. Es de solo lectura; no cambia
              nada del sistema.
            </li>
            <li>
              <strong>«Señalización y asignación de capacidad (RONDA C)»</strong>: lectura de la demanda,
              presión, carga, urgencia presupuestada y niveles de acceso por capacidad. Incluye el bloque{' '}
              <strong>«Piso de dignidad (RONDA D)»</strong> (headcount y brecha). No es configurable desde acá.
            </li>
            <li>
              <strong>«Patrimonio real + economías personales»</strong>: información, no controles. Las CU no
              representan activos reales.
            </li>
            <li>
              <strong>«HISTÓRICO / LEGACY — RONDA A»</strong> (plegado): PID, canasta, SupplyPolicy, ajustes y
              simulador. Son del experimento histórico y se conservan solo por reproducibilidad. Cambiar esos
              parámetros <strong>no</strong> gobierna el modelo actual: se usan únicamente como diagnóstico.
              La excepción son los campos «CU de bienvenida» y «Dar CU de bienvenida», que sí controlan cuánto
              recibe una persona nueva al registrarse.
            </li>
            <li>
              <strong>«Avisar sobre nueva versión del manual»</strong>: envía una notificación a todos los
              usuarios avisando de la versión actual del manual. Se usa cuando cambia el manual.
            </li>
          </ul>
          <p>
            Regla general para el personal: si no sabés qué hace un control, no lo toques. La configuración
            económica es experimental: primero se observa, se mide y se discute en los gremios.
          </p>
        </Block>

        <Block id="actualizaciones" eyebrow="Actualizaciones" title="Cómo te enterás de los cambios">
          <p>
            Cada vez que el manual cambia, se sube la versión y se avisa a los usuarios con una notificación.
            El historial de versiones del manual:
          </p>
          <ul className="space-y-4 pl-1">
            {MANUAL_CHANGELOG.map((c) => (
              <li key={c.version} className="rounded-lg border border-gray-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
                  v{c.version} · {c.date}
                </p>
                <p className="mt-1 font-semibold text-gray-900">{c.title}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {c.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Block>

        <p className="pb-8 text-center text-xs text-slate-400">
          Comunidad Post Singularidad · Manual de uso v{MANUAL_VERSION} · {MANUAL_UPDATED_AT}
        </p>
      </div>
    </main>
  );
}
