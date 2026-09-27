import type { Metadata } from 'next';
import Link from 'next/link';
import { MANUAL_CHANGELOG, MANUAL_UPDATED_AT, MANUAL_VERSION } from '../../src/lib/manual';

export const metadata: Metadata = {
  title: 'Manual de uso | Comunidad Post Singularidad',
  description:
    'Guía amigable de Comunidad Post Singularidad: qué es, cómo participar, qué son las CU, niveles de acceso, gremios, señales y administración. De lo básico a lo complejo.',
  alternates: {
    canonical: '/manual',
  },
  openGraph: {
    title: 'Manual de uso | Comunidad Post Singularidad',
    description:
      'Guía de esta versión del laboratorio: participación, CU de bienvenida, niveles de acceso, gremios, señales y controles de administración.',
    url: 'https://www.postsingular.org/manual',
    siteName: 'Comunidad Post Singularidad',
    locale: 'es_AR',
    type: 'website',
  },
};

function Block({
  id,
  title,
  emoji,
  children,
}: {
  id?: string;
  title: string;
  emoji?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24 rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        {emoji && <span className="mr-2">{emoji}</span>}
        {title}
      </h2>
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
        {/* Header */}
        <div className="rounded-xl bg-slate-900 p-8 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-300">Manual de uso</p>
          <h1 className="mt-2 text-3xl font-bold">Cómo funciona esta comunidad</h1>
          <p className="mt-4 text-sm text-slate-300">
            Te explicamos de lo más simple a lo más complejo. No necesitás leer todo:
            empezá por lo básico y después profundizá si te interesa.
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Versión <span className="font-semibold text-sky-300">v{MANUAL_VERSION}</span> · {MANUAL_UPDATED_AT}
          </p>
        </div>

        {/* Tabla de contenidos */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">¿Qué querés aprender?</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <a href="#que-es" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">¿Qué es esto?</a>
            <a href="#como-participar" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">¿Cómo participo?</a>
            <a href="#cu" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">¿Qué son las CU?</a>
            <a href="#niveles" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">Niveles de acceso</a>
            <a href="#gremios" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">Gremios</a>
            <a href="#senales" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">Señales del sistema</a>
            <a href="#urgencia" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">Urgencia y prioridad</a>
            <a href="#panel" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">Panel de administración</a>
            <a href="#api" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">API pública</a>
            <a href="#bot" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">Bot de Telegram</a>
          </div>
        </div>

        {/* ===== LO BÁSICO ===== */}

        <Block id="que-es" title="¿Qué es esto?" emoji="🌱">
          <p>
            Somos un <strong>laboratorio comunitario</strong> que investiga una pregunta:
          </p>
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-center">
            <p className="text-lg font-semibold text-sky-900">
              ¿Quién será propietario de la productividad que producen las máquinas?
            </p>
          </div>
          <p>
            La inteligencia artificial puede producir cada vez más riqueza. La pregunta no es
            cómo frenar eso, sino <strong>cómo puede participar la comunidad de esa productividad</strong>.
          </p>
          <p>
            Nuestra idea: construir un <strong>patrimonio común de inversión</strong> (empresas, acciones,
            bonos, infraestructura) y que la comunidad participa de sus rendimientos.
          </p>
          <p>
            <strong>No es una empresa, no es un gobierno, no es una criptomoneda.</strong>{' '}
            Es un experimento comunitario. Las reglas las decidimos entre todos.
          </p>
        </Block>

        <Block id="como-participar" title="¿Cómo participo?" emoji="👣">
          <p>Es más simple de lo que parece. Tres pasos:</p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-xl font-bold text-sky-700">1</div>
              <div>
                <p className="font-bold text-gray-900">Creá tu cuenta</p>
                <p>Registrate en <L href="/register">/register</L> con tu email y una contraseña. Pedimos tu profesión, qué sabés hacer y qué te interesa.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-xl font-bold text-sky-700">2</div>
              <div>
                <p className="font-bold text-gray-900">Participá</p>
                <p>Ofrecé lo que sabés hacer, ayudá a otros con sus necesidades, sumate a un gremio. No hay pago de por medio: es colaboración comunitaria.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-xl font-bold text-sky-700">3</div>
              <div>
                <p className="font-bold text-gray-900">La comunidad decide</p>
                <p>Entre todos definimos cómo funciona el proyecto. Tu voz cuenta tanto como la de cualquier otro.</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-800">
              <strong>¿Necesito saber de tecnología o finanzas?</strong> No. La comunidad es para personas
              de todos los perfiles. Lo importante es la curiosidad y las ganas de construir.
            </p>
          </div>
        </Block>

        {/* ===== CU (lo técnico pero esencial) ===== */}

        <Block id="cu" title="¿Qué son las CU?" emoji="🧢">
          <p>
            Las <strong>CU</strong> (Community Units) son una <strong>unidad experimental de participación</strong>
            dentro de la comunidad.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="font-bold text-red-800 mb-2">Las CU NO son:</p>
            <div className="grid grid-cols-2 gap-2">
              {['Dinero', 'Criptomoneda', 'Acciones', 'Patrimonio', 'Salario', 'Promesa de pago', 'Crédito', 'Inversión'].map((item) => (
                <div key={item} className="bg-white border border-red-200 rounded px-2 py-1 text-center text-sm text-red-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <p>
            Las CU son <strong>señales de participación</strong>: registran cuánto participás, no cuánto valés.
            Se usan para observar qué capacidades humanas siguen siendo necesarias frente a la automatización.
          </p>
          <p>
            <strong>De dónde salen:</strong> al registrarte recibís una CU de bienvenida (si la política está activa).
            También recibís CU cuando alguien confirma que ayudaste (contribución verificada).
          </p>
          <p>
            <strong>Para qué NO sirven:</strong> no compran prioridad, no se transfieren entre personas,
            no se convierten en dinero y no representan parte del patrimonio.
          </p>
        </Block>

        <Block id="niveles" title="Niveles de acceso" emoji="📊">
          <p>
            El nivel de acceso es una <strong>categoría funcional</strong>, no una jerarquía de valor personal.
            Indica cuánto participás, no cuánto valés.
          </p>
          <div className="space-y-3">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="font-bold text-gray-900">Básico</p>
              <p className="text-sm text-gray-600">Es el piso. Se entra al registrarse; nadie queda afuera por no tener nada que ofrecer todavía.</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="font-bold text-gray-900">Medio</p>
              <p className="text-sm text-gray-600">Sube al participar, por ejemplo teniendo solicitudes satisfechas.</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="font-bold text-gray-900">Avanzado</p>
              <p className="text-sm text-gray-600">Sube con contribución verificada, por ejemplo satisfaciendo solicitudes de otras personas.</p>
            </div>
          </div>
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
            <p className="text-sky-900">
              <strong>Importante:</strong> el nivel nunca depende del saldo de CU. Tener más CU no te convierte
              en mejor persona.
            </p>
          </div>
        </Block>

        {/* ===== GREMIOS ===== */}

        <Block id="gremios" title="Gremios" emoji="⚒️">
          <p>
            Los <strong>gremios</strong> son los círculos de organización por especialidad.
            Ahí se discute cómo avanzar, se proponen reglas y se decide el rumbo.
          </p>
          <p>No son clubes sociales: son la capa donde el experimento se ejecuta.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🧭', name: 'Construcción Comunitaria', desc: 'Investigar la organización y gobernanza' },
              { icon: '⚖️', name: 'Derecho', desc: 'Diseñar la estructura legal del patrimonio' },
              { icon: '📈', name: 'Finanzas', desc: 'Proponer criterios de inversión y riesgo' },
              { icon: '📊', name: 'Economía', desc: 'Modelar señales de participación' },
              { icon: '💻', name: 'Tecnología', desc: 'Construir la plataforma y transparencia' },
              { icon: '👥', name: 'Sociología', desc: 'Analizar incentivos y efectos sociales' },
            ].map((g) => (
              <div key={g.name} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{g.icon}</span>
                  <p className="font-bold text-gray-900">{g.name}</p>
                </div>
                <p className="text-sm text-gray-600">{g.desc}</p>
              </div>
            ))}
          </div>
          <p>
            Cada gremio puede elegir <strong>representantes</strong> entre sus miembros, con distintivo visible.
            También puede crear <strong>encuestas</strong> internas: cada voto queda registrado con usuario,
            opción y fecha.
          </p>
        </Block>

        {/* ===== SEÑALES ===== */}

        <Block id="senales" title="Señales del sistema" emoji="📡">
          <p>
            El sistema mide qué capacidades humanas se están pidiendo y cuáles hay disponibles.
            Esto ayuda a detectar dónde hay cuellos de botella.
          </p>
          <div className="space-y-3">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="font-bold text-gray-900">Demanda</p>
              <p className="text-sm text-gray-600">Cuántas personas están pidiendo una capacidad (solicitudes activas o satisfechas en los últimos 30 días).</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="font-bold text-gray-900">Oferta</p>
              <p className="text-sm text-gray-600">Cuántas personas declaran ofrecer esa capacidad (y con qué disponibilidad y calidad).</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="font-bold text-gray-900">Presión</p>
              <p className="text-sm text-gray-600">Cuándo la demanda supera la oferta. Indica un posible cuello de botella.</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="font-bold text-gray-900">Carga</p>
              <p className="text-sm text-gray-600">Cuánto de la capacidad disponible está siendo utilizada.</p>
            </div>
          </div>
          <p>
            <strong>Importante:</strong> son señales de información, no precios. No se convierten en un
            ranking de personas.
          </p>
        </Block>

        {/* ===== URGENCIA ===== */}

        <Block id="urgencia" title="Urgencia y prioridad" emoji="⏰">
          <p>
            A veces una necesidad es más urgente que otras. El sistema tiene un{' '}
            <strong>presupuesto de urgencia</strong> para marcar eso.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <p className="font-bold text-amber-900">¿Cómo funciona?</p>
            <ul className="space-y-1 text-sm text-amber-900">
              <li>• Cada persona tiene <strong>3 puntos por semana</strong></li>
              <li>• Marcar una solicitud como urgente cuesta puntos: nivel 1 → 1 punto, nivel 2 → 4 puntos, nivel 3 → 9 puntos</li>
              <li>• Los puntos <strong>no se acumulan</strong> entre semanas: si no los usás, se pierden</li>
              <li>• La urgencia no se puede transferir ni comprar</li>
            </ul>
          </div>
          <p>
            <strong>En tu perfil</strong> podés ver cuántos puntos te quedan y cuándo se renuevan.
          </p>
          <p>
            El objetivo: que marcar urgencia tenga un costo real, para que nadie pueda "comprar" prioridad
            acumulando poder.
          </p>
        </Block>

        {/* ===== PANEL ADMIN (lo complejo) ===== */}

        <Block id="panel" title="Panel de administración" emoji="🛠️">
          <p>
            El panel <L href="/admin">Admin</L> tiene controles para configurar el experimento.
            <strong> Nunca toca dinero real ni patrimonio:</strong> todo lo que se configura aquí opera sobre
            el registro experimental de CU.
          </p>

          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
            <p className="font-bold text-sky-900 mb-2">Controles principales (lo que sí gobierna el modelo)</p>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Presupuesto de urgencia:</strong> puntos por período (3), nivel máximo (3),
                días del período (7).
              </p>
              <p>
                <strong>Emisión de CU:</strong> CU de bienvenida (20), sensibilidad (1),
                CU por contribución verificada (10), meta de saldo (100).
              </p>
              <p>
                <strong>Ajuste manual:</strong> desactivado por defecto. Permite dar o quitar CU con motivo
                auditable.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="font-bold text-gray-900 mb-2">Indicadores (solo lectura)</p>
            <div className="space-y-1 text-sm text-gray-600">
              <p>• <strong>Demanda insatisfecha:</strong> cuántas solicitudes quedaron sin resolver en 30 días</p>
              <p>• <strong>Usuarios por nivel:</strong> cuántos hay en básico, medio y avanzado</p>
              <p>• <strong>Tabla por capacidad:</strong> demanda, oferta, presión y automatización</p>
              <p>• <strong>Piso de dignidad:</strong> cuántas personas quedan debajo del piso de acceso</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="font-bold text-red-800 mb-2">HISTÓRICO / LEGACY (NO tocar)</p>
            <p className="text-sm text-red-700">
              El bloque "HISTÓRICO / LEGACY" es solo para reproducibilidad del experimento anterior.
              Sus controles <strong>no gobiernan el modelo vigente</strong>. Si no sabés qué hace algo, no lo toques.
            </p>
          </div>
        </Block>

        {/* ===== API PÚBLICA ===== */}

        <Block id="api" title="API pública para integraciones" emoji="🔌">
          <p>
            Personas, bots y agentes de IA pueden consultar contenido público sin iniciar sesión.
            La base es{' '}
            <code className="bg-gray-100 px-1 rounded">https://www.postsingular.org/api/v1/public/</code>
          </p>
          <p>Es de <strong>solo lectura</strong>: no publica, modifica ni entrega datos privados.</p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="font-bold text-gray-900 mb-2">Recursos disponibles:</p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• <code>health</code>: comprobación de disponibilidad</li>
              <li>• <code>community</code>: métricas públicas agregadas</li>
              <li>• <code>posts</code>, <code>guilds</code>, <code>requests</code>, <code>polls</code>, <code>activity</code>: contenido visible</li>
              <li>• <code>users</code>: perfiles públicos mínimos (nunca email, contraseña ni datos privados)</li>
            </ul>
          </div>
          <p>
            Los recursos aceptan <code>?since=&lt;fecha ISO&gt;</code> para consultar solo novedades
            y <code>?limit=</code> para controlar el tamaño de cada página.
          </p>
        </Block>

        {/* ===== BOT ===== */}

        <Block id="bot" title="Bot de avisos por Telegram" emoji="🤖">
          <p>
            Si no querés estar revisando la página todo el tiempo, podés instalar un{' '}
            <strong>bot de Telegram</strong> que te avisa cuando hay novedades.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
            <p className="font-bold text-gray-900">Instalación rápida:</p>
            <ol className="space-y-1 text-sm text-gray-600">
              <li>1. Descargá la carpeta <code>BOT</code> en <code>C:\Comunidad\BOT</code></li>
              <li>2. Ejecutá <code>Instalar.bat</code> (verifica Python y crea <code>.env</code>)</li>
              <li>3. Generá un token con <strong>BotFather</strong> en Telegram</li>
              <li>4. Ejecutá <code>Arrancar.bat</code></li>
            </ol>
            <p className="text-xs text-gray-500">
              El token queda guardado solo en tu PC. El bot solo lee la API pública: no publica,
              no lee mensajes privados.
            </p>
          </div>
        </Block>

        {/* ===== CANALES ===== */}

        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📡 Seguir la comunidad sin registrarse</h2>
          <p className="text-gray-700 mb-4">
            Toda la actividad pública también está disponible como canales estándar:
          </p>
          <div className="space-y-2">
            <p>
              <strong>Atom 1.0:</strong>{' '}
              <a href="https://www.postsingular.org/feed.atom" className="text-sky-700 underline underline-offset-2">
                https://www.postsingular.org/feed.atom
              </a>
            </p>
            <p>
              <strong>RSS 2.0:</strong>{' '}
              <a href="https://www.postsingular.org/feed.xml" className="text-sky-700 underline underline-offset-2">
                https://www.postsingular.org/feed.xml
              </a>
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Son de solo lectura y reflejan la misma realidad que la página. Aceptan <code>?limit=</code> para
            controlar cuántas entradas traen.
          </p>
        </div>

        {/* ===== LÍMITES ===== */}

        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🚫 Qué no se puede hacer todavía</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• No hay transferencias directas entre usuarios</li>
            <li>• No se puede comprar, vender, convertir ni retirar CU</li>
            <li>• Las CU no tienen precio ni equivalencia con dinero</li>
            <li>• La urgencia no se puede ahorrar ni acumular</li>
            <li>• No hay aportes de capital ni promesas de rentabilidad</li>
            <li>• Nadie es calificado ni rankeado por su saldo de CU</li>
          </ul>
        </div>

        {/* ===== ACTUALIZACIONES ===== */}

        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Historial de versiones</h2>
          <p className="text-gray-600 mb-4">
            Cada vez que el manual cambia, subimos la versión y avisamos a los usuarios con una notificación.
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
        </div>

        <p className="pb-8 text-center text-xs text-slate-400">
          Comunidad Post Singularidad · Manual de uso v{MANUAL_VERSION} · {MANUAL_UPDATED_AT}
        </p>
      </div>
    </main>
  );
}
