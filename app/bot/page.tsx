import type { Metadata } from 'next';

const github = 'https://github.com/LeandroMagno13/Comunidad';
const raw = 'https://raw.githubusercontent.com/LeandroMagno13/Comunidad/main/BOT';

export const metadata: Metadata = {
  title: 'Bot de avisos | Comunidad Post Singularidad',
  description: 'Descargá y configurá el bot de Telegram de PostSingular para recibir avisos cuando cambie la comunidad.',
};

export default function BotPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl space-y-6 px-4">
        <header className="rounded-2xl bg-slate-900 p-8 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-300">Herramienta opcional</p>
          <h1 className="mt-2 text-3xl font-bold">Bot de avisos por Telegram</h1>
          <p className="mt-4 text-slate-300">
            Si te interesa participar, el bot te evita revisar la página todo el tiempo. Te avisa cuando detecta cambios públicos y también envía una confirmación diaria a las 20:00, hora Argentina.
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Qué recibe el bot</h2>
          <p className="mt-3 text-slate-700">
            Un informe simple con miembros, publicaciones, gremios, solicitudes, encuestas y actividad reciente. Si llega una notificación, hubo un cambio público o corresponde al informe periódico. También podés pedirlo cuando quieras con <code>/informe</code> o <code>/reporte</code>.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            El bot solo consulta la API pública de PostSingular. No inicia sesión en la web, no lee mensajes privados y no puede publicar ni modificar contenido.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Descarga</h2>
          <p className="mt-3 text-slate-700">Descargá estos archivos y guardalos juntos en <code>C:\Comunidad\BOT</code>.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700" href={`${raw}/Instalar.bat`}>Descargar instalador</a>
            <a className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href={`${github}/tree/main/BOT`}>Ver carpeta completa en GitHub</a>
            <a className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" href={`${raw}/telegram-hourly-bot.py`}>Descargar bot Python</a>
          </div>
          <p className="mt-3 text-xs text-slate-500">No descargues ni compartas archivos .env, estados o registros de otra instalación.</p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Instalación en Windows</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-slate-700">
            <li>Guardá la carpeta descargada en <code>C:\Comunidad\BOT</code>.</li>
            <li>Ejecutá <code>Instalar.bat</code>. Si Python no está instalado, intenta instalarlo con Windows Package Manager; si no está disponible, abre la descarga oficial.</li>
            <li>El instalador crea <code>.env</code> y abre el Bloc de notas para cargar el token de Telegram.</li>
            <li>Para que arranque con Windows, copiá <code>Arrancar.bat</code> a <code>shell:startup</code>.</li>
            <li>En Telegram enviá <code>/start</code> a tu bot. Recibirás el primer informe y luego los avisos.</li>
          </ol>
          <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm text-slate-600">No requiere instalar librerías de Python ni clonar repositorios: usa solo la biblioteca estándar de Python.</p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Crear el token con BotFather</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-slate-700">
            <li>En Telegram abrí <strong>@BotFather</strong> y enviá <code>/newbot</code>.</li>
            <li>Elegí el nombre visible y un usuario único terminado en <code>bot</code>.</li>
            <li>BotFather mostrará un token. Copialo una sola vez.</li>
            <li>En <code>C:\Comunidad\BOT\.env</code>, completá <code>TELEGRAM_BOT_TOKEN=tu_token</code>.</li>
            <li>Guardá el archivo. No lo publiques, no lo subas a GitHub y no lo envíes por chat.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}
