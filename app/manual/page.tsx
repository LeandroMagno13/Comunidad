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
          <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            ¿Cómo se estresa esta versión (C) con urgencia (D)? Tenemos un{' '}
            <L href="/ensayo-de-stress">ensayo de stress abierto</L> con 16 tensiones y su espejo legacy,
            más un Monte Carlo de 200 corridas. Es lectura pública: no es un informe de rendimiento, es un
            laboratorio.
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
          <p>
            Un ejemplo concreto de integración es el <L href="#bot">bot de avisos por Telegram</L>, que usa
            esta API para avisar a quien participa cuando hay novedades. Si preferís un lector de noticias,
            también podés seguir la actividad con los canales <L href="#canales">RSS y Atom</L>.
          </p>
        </Block>

        <Block id="bot" eyebrow="Herramienta opcional" title="Bot de avisos por Telegram">
          <p>
            Si participás de la comunidad y no querés estar revisando la página todo el tiempo, podés usar el{' '}
            <strong>bot de avisos por Telegram</strong> (sección <L href="/bot">Bot</L>). Te avisa cuando
            detecta cambios públicos y también envía una confirmación diaria a las 20:00, hora Argentina.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Qué recibe</strong>: un informe simple con miembros, publicaciones, gremios,
              solicitudes, encuestas y actividad reciente. Si llega una notificación, hubo un cambio público
              o corresponde al informe del día.
            </li>
            <li>
              <strong>Descarga e instalación</strong>: guardá la carpeta <code>BOT</code> en{' '}
              <code>C:\Comunidad\BOT</code> y ejecutá <code>Instalar.bat</code>. Verifica o instala Python,
              prepara el archivo <code>.env</code> y arranca el bot. No requiere librerías externas ni clonar
              repositorios.
            </li>
            <li>
              <strong>Token</strong>: se genera una sola vez con <strong>BotFather</strong> y queda guardado
              solo en tu PC. No lo compartas, no lo subas a GitHub ni lo envíes por chat.
            </li>
            <li>
              <strong>Arranque automático</strong>: copiá <code>Arrancar.bat</code> a la carpeta de Inicio (
              <code>shell:startup</code>) para que el bot se inicie junto con Windows.
            </li>
            <li>
              <strong>Solo lectura</strong>: consulta únicamente la <L href="#api-publica">API pública</L> de
              PostSingular. No inicia sesión, no lee mensajes privados y no puede publicar ni modificar
              contenido.
            </li>
            <li>También podés pedir el informe cuando quieras con <code>/informe</code> o <code>/reporte</code>.</li>
          </ul>
        </Block>

        <Block id="canales" eyebrow="Seguir la comunidad sin registrarse" title="Canales RSS y Atom">
          <p>
            Toda la actividad pública reciente (publicaciones y encuestas visibles) también está disponible
            como canales estándar de sindicación, sin registrarse ni usar la API:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Atom 1.0</strong>: <a href="https://postsingular.org/feed.atom" className="font-medium text-sky-700 underline underline-offset-2 hover:text-sky-900">https://postsingular.org/feed.atom</a>
            </li>
            <li>
              <strong>RSS 2.0</strong>: <a href="https://postsingular.org/feed.xml" className="font-medium text-sky-700 underline underline-offset-2 hover:text-sky-900">https://postsingular.org/feed.xml</a>
            </li>
          </ul>
          <p>
            Son de <strong>solo lectura</strong> y reflejan la misma realidad que la página y la{' '}
            <L href="#api-publica">API pública</L>: cada publicación enlaza a su contenido completo y
            cada encuesta muestra sus opciones con los totales de votos, sin votos personales ni datos
            privados. Aceptan <code>?limit=</code> para controlar cuántas entradas traen (default 20,
            máximo 200), y la mayoría de los navegadores y lectores los detectan automáticamente.
          </p>
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
            En las solicitudes comunitarias (<L href="/community">Comunidad</L>) y de capacidad no se
            transfieren CU de nadie, pero <strong>sí se emiten CU de logro por contribución verificada</strong>:
            al confirmar una tarea o satisfacer una solicitud, quien participó recibe una cantidad acotada y
            configurable (visible en «Economía CU» del panel admin, 0 = desactivado). Es una emisión
            explícita y auditable —el mismo mecanismo que la bienvenida—, no un pago ni una transferencia,
            y llega con una notificación para que ese aporte se perciba y motive a seguir participando.
            No existe emisión automática por controlador, ni minado, ni compra de CU. Una solicitud de
            capacidad que expira sin resolverse (30 días) se descarta sin ningún cargo.
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
              (H1–H3), negrita, cursiva, listas, citas, bloques de código, separadores, enlaces,
              videos de YouTube y posts de X — sin escribir código. Solo se guarda un subconjunto
              seguro (los videos y posts se incrustan solo desde sus dominios oficiales) y todo
              se sanea al guardar y al mostrar: pegar HTML ajeno se ve como texto plano.
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
          <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <strong>Dónde lo ves (RONDA D):</strong> en tu perfil, dentro de la tarjeta «Mis CU», aparece tu
            presupuesto de urgencia con todo lo que necesitás saber: cuántos puntos te quedan de este período,
            cuántos eran el tope, el nivel máximo configurado y la próxima fecha de renovación. No tenés que
            buscarlo ni adivinarlo: la tarjeta lo muestra apenas entrás a tu perfil.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Ver cómo se comporta la urgencia bajo estrés (escasez extrema, persistente, saturación y límites
            de escala) en el <L href="/ensayo-de-stress">ensayo de stress abierto</L>.
          </p>
        </Block>

        <Block id="cuestas-cu" eyebrow="Tu registro de CU" title="Ver tus CU en Perfil">
          <p>
            En tu perfil, la sección «Mis CU · registro experimental» muestra tu saldo y el historial de
            transacciones (emisiones de bienvenida, CU de logro por contribución y consumos). Desde la
            Ronda D las CU ya no se transfieren por solicitudes de capacidad, así que el registro se mantiene
            como señal de participación, no como un monedero.
          </p>
          <p>
            Tu perfil también muestra <strong>«Mis contribuciones»</strong>: las tareas comunitarias que
            confirmaste y las solicitudes de capacidad que satisfaciste, para que cada aporte quede visible
            y se perciba el progreso.
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
            La pestaña «Economía CU» del panel <L href="/admin">Admin</L> tiene dos tipos de elementos:{' '}
            <strong>indicadores</strong> (solo lectura, describen el estado) y <strong>modificadores</strong>{' '}
            (controles que cambian el comportamiento del sistema). Ninguno toca dinero real ni patrimonio:
            todo lo que se configura aquí opera sobre el registro experimental de CU.
          </p>

          <p className="mt-4 text-sm font-bold text-slate-900">1) Controles activos — lo que sí gobierna el modelo (Ronda C y D)</p>
          <p className="text-xs text-slate-500">
            Es el primer bloque de la pantalla. Los cambios se guardan con el botón «Guardar configuración
            activa». No es necesario abrir el histórico.
          </p>

          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-sky-800">Urgencia presupuestada (RONDA D) — define cómo se marca la prioridad</p>
          <div className="mt-1 space-y-1 text-sm">
            <p><span className="font-semibold">Puntos por período</span> <span className="text-slate-400">(3)</span> — <span className="text-slate-600">puntos de urgencia que cada persona puede gastar en un período para marcar que una solicitud le urge.</span> No acumula entre períodos, no se transfiere y no se compra con CU.</p>
            <p><span className="font-semibold">Nivel máximo</span> <span className="text-slate-400">(3)</span> — <span className="text-slate-600">la urgencia se marca por niveles y el costo crece al cuadrado: 1→1, 2→4, 3→9. Este control pone el techo.</span> Subirlo hace más costoso «gritar» más fuerte.</p>
            <p><span className="font-semibold">Días del período</span> <span className="text-slate-400">(7)</span> — <span className="text-slate-600">cada cuántos días se renueva el presupuesto. Al renovarse, todos vuelven al tope: no se hereda nada.</span></p>
          </div>

          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-sky-800">Emisión de participación (RONDA C) — de dónde salen las CU</p>
          <div className="mt-1 space-y-1 text-sm">
            <p><span className="font-semibold">CU de bienvenida (base en equilibrio)</span> <span className="text-slate-400">(20)</span> — <span className="text-slate-600">cuántas CU recibe una cuenta nueva en equilibrio.</span> Puede ser 0 (sin bienvenida).</p>
            <p><span className="font-semibold">Sensibilidad nuevos usuarios</span> <span className="text-slate-400">(1)</span> — <span className="text-slate-600">cuán fuerte responde la asignación de bienvenida a la escasez/abundancia relativa: 0 = constante; cuanto más alto, más se reduce ante escasez (puede llegar a 0) y más sube ante abundancia.</span></p>
            <p><span className="font-semibold">CU por contribución verificada</span> <span className="text-slate-400">(10 · 0 = desactivado)</span> — <span className="text-slate-600">CU que se emiten a quien participa cuando OTRA persona lo confirma: tarea comunitaria confirmada por su autor o solicitud de capacidad satisfecha.</span> Es emisión de logro (con su movimiento auditable por refType/refId y notificación), no un pago ni una transferencia.</p>
            <p><span className="font-semibold">Meta de saldo (aviso)</span> <span className="text-slate-400">(100)</span> — <span className="text-slate-600">solo genera una notificación cuando una persona alcanza ese saldo.</span> No es un tope ni un objetivo económico obligatorio.</p>
            <p><span className="font-semibold">Dar CU de bienvenida (dinámica)</span> <span className="text-slate-400">(activado)</span> — <span className="text-slate-600">interruptor que enciende o apaga la emisión de bienvenida.</span> No es un monto ni una emisión fija.</p>
          </div>

          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-sky-800">Ajuste auditable manual — cuándo se puede dar/quitar CU a mano</p>
          <div className="mt-1 space-y-1 text-sm">
            <p><span className="font-semibold">Habilitar ajustes</span> <span className="text-slate-400">(desactivado)</span> — <span className="text-slate-600">enciende la posibilidad de dar o quitar CU manualmente. Desactivado por defecto: nunca hay confiscación automática.</span></p>
            <p><span className="font-semibold">Método</span> <span className="text-slate-400">(none)</span> — <span className="text-slate-600">cómo se aplican los ajustes legados de saldos: none / flat (fijo) / proportional / manual.</span></p>
            <p><span className="font-semibold">Tope por ajuste</span> <span className="text-slate-400">(0 = sin tope)</span> — <span className="text-slate-600">límite de CU (±) por ajuste, por usuario y por evento.</span></p>
            <p className="text-xs text-slate-500">Regla de uso: primero «Guardar configuración activa», y recién después usar el bloque «Ajuste histórico (manual, auditado)» de abajo.</p>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Qué NO hacen estos controles: no modifican patrimonio, no convierten CU en dinero, no compran
            prioridad ni urgencia, y no suben el nivel de acceso por sí mismos (el nivel sube solo con
            contribución verificada).
          </p>

          <p className="mt-4 text-sm font-bold text-slate-900">2) Ajuste histórico (manual, auditado) — acción puntual sobre un saldo</p>
          <div className="mt-1 space-y-1 text-sm">
            <p><span className="font-semibold">Usuario</span> — <span className="text-slate-600">a quién se le va a dar o quitar CU.</span></p>
            <p><span className="font-semibold">CU (±, entero)</span> — <span className="text-slate-600">cuántas: positivo suma, negativo resta.</span></p>
            <p><span className="font-semibold">Motivo (obligatorio)</span> — <span className="text-slate-600">por qué; sin motivo no se puede aplicar.</span></p>
            <p><span className="font-semibold">Botón de aplicar</span> — <span className="text-slate-600">efecto inmediato en el saldo, y queda registrado en CuTransaction (type adjustment) con actor y motivo.</span> Requiere «Habilitar ajustes» activado.</p>
          </div>

          <p className="mt-4 text-sm font-bold text-slate-900">3) Indicadores de señal (solo lectura)</p>
          <p className="text-xs text-slate-500">Aparecen después de pulsar «Medir ahora». Describen el estado; no cambian nada.</p>
          <div className="mt-1 space-y-1 text-sm">
            <p><span className="font-semibold">Medir ahora</span> — <span className="text-slate-600">recalcula métricas y señales.</span> Solo lectura.</p>
            <p><span className="font-semibold">Patrimonio real (simulado)</span> — <span className="text-slate-600">activos reales simulados de referencia. No todo es distribuible y está separado por completo de las CU.</span></p>
            <p><span className="font-semibold">Capacidad distribuible (tasa)</span> — <span className="text-slate-600">qué fracción del patrimonio permiten las reglas distribuir efectivamente por período.</span></p>
            <p><span className="font-semibold">Demanda insatisfecha (30d)</span> — <span className="text-slate-600">solicitudes registradas menos satisfechas en la ventana. Es la señal central del modelo.</span></p>
            <p><span className="font-semibold">Demanda satisfecha</span> — <span className="text-slate-600">cuántas se resolvieron, con su porcentaje.</span></p>
            <p><span className="font-semibold">Usuarios básico / medio / avanzado</span> — <span className="text-slate-600">cuántas personas hay en cada nivel de acceso. Avanzado sube con contribución verificada.</span></p>
            <p><span className="font-semibold">Tabla por capacidad</span> — <span className="text-slate-600">por capacidad humana: demanda total / satisfecha / insatisfecha, presión (insatisfecha sobre oferta efectiva), oferta declarada y efectiva, y automatización.</span> La presión detecta cuellos de botella; no es un precio.</p>
            <p><span className="font-semibold">Piso de dignidad (RONDA D)</span> — <span className="text-slate-600">indicador principal: cuántas personas quedan debajo del piso de acceso (debajo del piso, headcount e incidencia, brecha o distancia al piso) y la concentración como contexto secundario.</span></p>
            <p><span className="font-semibold">Patrimonio real + economías personales</span> — <span className="text-slate-600">información. Las CU no representan pesos, activos, acciones ni promesas de pago.</span></p>
          </div>

          <p className="mt-4 text-sm font-bold text-slate-900">4) HISTÓRICO / LEGACY — Ronda A (diagnóstico; cambiar esto NO gobierna el modelo)</p>
          <p className="text-xs text-slate-500">
            Plegado por defecto. Se conserva solo por reproducibilidad del experimento histórico. Los
            indicadores sirven de diagnóstico y los modificadores NO actúan sobre el modelo vigente.
          </p>
          <div className="mt-1 space-y-1 text-sm">
            <p><span className="font-semibold">Indicadores históricos</span> — <span className="text-slate-600">Set point (CU objetivo de la canasta), canasta observada, sensor v2 (integrado), acceso real, error de control, señal del PID, fase de la política de oferta, emisión/quema decidida por esa política, velocidad (actividad, no un precio), transferidas y consumidas del período, cuentas, usuarios activos, saldos promedio y mediano, concentración (10% mayor), emisión y consumo acumulados y el estado del controlador.</span></p>
            <p><span className="font-semibold">Controlador PID</span> — <span className="font-semibold text-slate-700">Kp, Ki, Kd</span> <span className="text-slate-400">(0.5 / 0.1 / 0.05)</span> — <span className="text-slate-600">ganancias proporcional / integral / derivada de la señal histórica.</span></p>
            <p><span className="font-semibold">Salida mín. / máx.</span> <span className="text-slate-400">(−100 / 100)</span> — <span className="text-slate-600">acotan la señal de corrección del PID.</span></p>
            <p><span className="font-semibold">Periodo (días)</span> <span className="text-slate-400">(30)</span> — <span className="text-slate-600">ventana de cálculo del controlador histórico.</span></p>
            <p><span className="font-semibold">Política de oferta (SupplyPolicy)</span> — <span className="text-slate-600">Gan. expansión/contracción (apertura de las válvulas; 0 = la política no emite/quema automáticamente), Máx emisión/quema por ciclo (límites anti-shock), y las proporciones Reserva / Nuevos / Históricos del reparto de esa emisión.</span></p>
            <p><span className="font-semibold">Sensor v2</span> — <span className="text-slate-600">Acceso objetivo (fracción de cuentas que deberían acceder a la canasta), Sens. flujo (sensibilidad al flujo neto), Sens. acceso (sensibilidad a la brecha de acceso) y «Set point alcanzable» (ancla la meta a la distribución).</span></p>
            <p><span className="font-semibold">Control de oferta activo</span> <span className="text-slate-400">(activado)</span> — <span className="text-slate-600">interruptor de la política de oferta legada.</span> Su cambio no afecta las emisiones por grants ni la urgencia.</p>
            <p><span className="font-semibold">Canasta representativa</span> — <span className="text-slate-600">nombre, descripción, set point, valor observado, metodología (manual o auto) y los ítems con su peso. Es la hipótesis de medición del sensor histórico.</span></p>
          </div>

          <p className="mt-4 text-sm font-bold text-slate-900">5) General</p>
          <div className="mt-1 space-y-1 text-sm">
            <p><span className="font-semibold">Avisar sobre nueva versión del manual</span> — <span className="text-slate-600">envía una notificación a todos los usuarios avisando de la versión vigente.</span> Se usa cuando cambia el manual.</p>
            <p><span className="font-semibold">Estimación de «liberación»</span> — <span className="text-slate-600">percepción colectiva reportada por usuarios (promedio, mediana, ponderada). NO alimenta al PID: no modifica emisiones ni saldos.</span></p>
          </div>

          <p className="mt-4 text-sm">
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
