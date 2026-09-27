import type { Metadata } from 'next';

const github = 'https://github.com/LeandroMagno13/Comunidad';
const raw = 'https://raw.githubusercontent.com/LeandroMagno13/Comunidad/main/BOT';

export const metadata: Metadata = {
  title: 'Bot de avisos | Comunidad Post Singularidad',
  description:
    'Bot de Telegram para recibir avisos cuando cambia la comunidad. Instalación simple en Windows, sin librerías externas. También incluye una skill experimental de previsión de datos.',
};

export default function BotPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl space-y-6 px-4">
        {/* Header */}
        <header className="rounded-2xl bg-slate-900 p-8 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-300">Herramienta opcional</p>
          <h1 className="mt-2 text-3xl font-bold">Bot de avisos por Telegram</h1>
          <p className="mt-4 text-slate-300">
            ¿No querés estar revisando la página todo el tiempo? Este bot te avisa cuando hay novedades
            en la community. Es opcional: podés participar sin él.
          </p>
        </header>

        {/* Tabla de contenidos */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">¿Qué querés hacer?</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <a href="#que-hace" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">¿Qué hace el bot?</a>
            <a href="#instalar" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">Instalar en Windows</a>
            <a href="#token" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">Crear el token</a>
            <a href="#prevision" className="text-sky-700 hover:text-sky-900 underline underline-offset-2">Skill de previsión (avanzado)</a>
          </div>
        </div>

        {/* QUÉ HACE */}
        <section id="que-hace" className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Qué hace el bot?</h2>
          <p className="text-gray-700 mb-4">
            El bot es un <strong>avisador automático</strong>. Funciona así:
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-xl font-bold text-sky-700">1</div>
              <div>
                <p className="font-bold text-gray-900">Revisa la comunidad</p>
                <p className="text-gray-600">Cada tanto, consulta la API pública de PostSingular para ver si hay novedades.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-xl font-bold text-sky-700">2</div>
              <div>
                <p className="font-bold text-gray-900">Te avisa por Telegram</p>
                <p className="text-gray-600">Si detecta cambios (nuevos posts, gremios, encuestas, etc.), te manda un mensaje.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-xl font-bold text-sky-700">3</div>
              <div>
                <p className="font-bold text-gray-900">También podés pedirle el informe</p>
                <p className="text-gray-600">Cuando quieras, enviale <code className="bg-gray-100 px-1 rounded">/informe</code> o <code className="bg-gray-100 px-1 rounded">/reporte</code> y te responde con el estado actual.</p>
              </div>
            </div>
          </div>
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-800">
              <strong>¿Es seguro?</strong> El bot solo lee información pública. No inicia sesión en la web,
              no lee mensajes privados y no puede publicar ni modificar contenido.
            </p>
          </div>
        </section>

        {/* INSTALAR */}
        <section id="instalar" className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Instalar en Windows</h2>
          <p className="text-gray-700 mb-4">
            No necesitás saber programar ni instalar librerías. Seguí estos pasos:
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-xl font-bold text-sky-700">1</div>
              <div>
                <p className="font-bold text-gray-900">Descargá los archivos</p>
                <p className="text-gray-600">Guardalos en <code className="bg-gray-100 px-1 rounded">C:\Comunidad\BOT</code></p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-xl font-bold text-sky-700">2</div>
              <div>
                <p className="font-bold text-gray-900">Ejecutá el instalador</p>
                <p className="text-gray-600">Doble clic en <code className="bg-gray-100 px-1 rounded">Instalar.bat</code>. Si no tenés Python, el instalador te ayuda a descargarlo.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-xl font-bold text-sky-700">3</div>
              <div>
                <p className="font-bold text-gray-900">Pegá tu token</p>
                <p className="text-gray-600">El instalador abre el Bloc de notas con un archivo <code className="bg-gray-100 px-1 rounded">.env</code>. Pegá tu token de Telegram (lo creás en el siguiente paso).</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-xl font-bold text-sky-700">4</div>
              <div>
                <p className="font-bold text-gray-900">Arrancá el bot</p>
                <p className="text-gray-600">Ejecutá <code className="bg-gray-100 px-1 rounded">Arrancar.bat</code>. Para que arranque solo con Windows, copialo a <code className="bg-gray-100 px-1 rounded">shell:startup</code>.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-xl font-bold text-sky-700">5</div>
              <div>
                <p className="font-bold text-gray-900">Probá en Telegram</p>
                <p className="text-gray-600">Enviá <code className="bg-gray-100 px-1 rounded">/start</code> a tu bot. Recibirás el primer informe.</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700" href={`${raw}/Instalar.bat`}>
              Descargar instalador
            </a>
            <a className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href={`${github}/tree/main/BOT`}>
              Ver carpeta en GitHub
            </a>
            <a className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href={`${raw}/telegram-hourly-bot.py`}>
              Descargar bot Python
            </a>
          </div>
        </section>

        {/* TOKEN */}
        <section id="token" className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Crear el token de Telegram</h2>
          <p className="text-gray-700 mb-4">
            El token es la clave que conecta tu bot con Telegram. Se crea una sola vez:
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-xl font-bold text-sky-700">1</div>
              <div>
                <p className="font-bold text-gray-900">Abrí @BotFather</p>
                <p className="text-gray-600">En Telegram, buscá <strong>@BotFather</strong> (el bot oficial de Telegram para crear bots).</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-xl font-bold text-sky-700">2</div>
              <div>
                <p className="font-bold text-gray-900">Creá el bot</p>
                <p className="text-gray-600">Enviá <code className="bg-gray-100 px-1 rounded">/newbot</code> y seguí las instrucciones: elegí un nombre y un usuario que termine en <code className="bg-gray-100 px-1 rounded">bot</code>.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-xl font-bold text-sky-700">3</div>
              <div>
                <p className="font-bold text-gray-900">Copiá el token</p>
                <p className="text-gray-600">BotFather te va a mostrar un token (una cadena larga). Copialo.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-xl font-bold text-sky-700">4</div>
              <div>
                <p className="font-bold text-gray-900">Pegalo en el archivo</p>
                <p className="text-gray-600">En <code className="bg-gray-100 px-1 rounded">C:\Comunidad\BOT\.env</code>, completá: <code className="bg-gray-100 px-1 rounded">TELEGRAM_BOT_TOKEN=tu_token</code></p>
              </div>
            </div>
          </div>
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800">
              <strong>Importante:</strong> el token es secreto. No lo compartas, no lo subas a GitHub
              y no lo envíes por chat. Cualquiera con tu token puede controlar tu bot.
            </p>
          </div>
        </section>

        {/* PREVISIÓN (avanzado) */}
        <section id="prevision" className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Skill de previsión (avanzado)</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-amber-900">
              <strong>Esta sección es para usuarios técnicos.</strong> Si solo querés los avisos,
              podés saltarte esto.
            </p>
          </div>
          <p className="text-gray-700 mb-4">
            Además del bot de avisos, incluimos una <strong>skill experimental</strong> que intenta
            proyectar los datos de la comunidad. No es un predictor mágico: es una
            <strong> base metodológica</strong> para estudiar los datos que la comunidad genere en el futuro.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
            <p className="font-bold text-gray-900 mb-2">¿Qué hace en resumen?</p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• <strong>Descarga</strong> los datos públicos de la comunidad (posts, usuarios, gremios)</li>
              <li>• <strong>Agrupa</strong> todo en series diarias (cuántos posts nuevos por día, etc.)</li>
              <li>• <strong>Proyecta</strong> los próximos días con un modelo de series temporales (TimesFM de Google)</li>
              <li>• <strong>Publica</strong> el resultado como una publicación informativa más</li>
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800">
              <strong>Aclaración importante:</strong> el pronóstico es observacional y probabilístico,
              no causal. No decide nada dentro de la comunidad. Hoy corre a modo demo porque hay pocos
              datos. Su valor está en mostrar el método, no en predecir el futuro.
            </p>
          </div>
        </section>

        {/* Footer */}
        <p className="pb-8 text-center text-xs text-slate-400">
          Comunidad Post Singularidad · Bot de avisos · Herramienta opcional
        </p>
      </div>
    </main>
  );
}
