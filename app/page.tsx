import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Comunidad de Capital Humano
              </h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Iniciar sesión
              </Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Quiero Contribuir
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - Section 16 */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            ¿Qué pasa cuando el trabajo deja de ser necesario?
          </h1>
          <div className="prose prose-lg prose-invert max-w-none mx-auto mb-8 text-gray-300">
            <p>
              La inteligencia artificial y la automatización pueden producir una transformación económica 
              mucho más profunda que la pérdida de algunos empleos.
            </p>
            <p>
              Si cada vez necesitamos menos trabajo humano para producir lo que necesitamos, 
              también tenemos que preguntarnos:
            </p>
          </div>
          <blockquote className="text-2xl sm:text-3xl font-semibold italic mb-8 border-l-4 border-blue-500 pl-6">
            <strong>¿Quién será dueño de esa productividad?</strong>
          </blockquote>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Nosotros estamos explorando una respuesta: <strong>construir colectivamente el capital 
            que permita participar de ella.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              QUIERO CONTRIBUIR
            </Link>
            <Link 
              href="#entender" 
              className="bg-transparent border-2 border-gray-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors"
            >
              QUIERO ENTENDER LA IDEA
            </Link>
          </div>
        </div>
      </section>

      {/* Section 17 - No queremos detener el futuro */}
      <section className="py-20 bg-white" id="entender">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            No queremos detener el futuro. Queremos participar de él.
          </h2>
          <div className="prose prose-lg max-w-none mx-auto">
            <p className="text-gray-600 mb-8">
              No estamos proponiendo prohibir la IA, destruir empresas, eliminar mercados, 
              reemplazar al Estado, obligar a nadie a participar, ni garantizar un resultado 
              que todavía no sabemos construir.
            </p>
            <p className="text-gray-600">
              Estamos proponiendo <strong>experimentar</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Section 18 - El ideal necesita poder material */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            El ideal necesita poder material
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-4 mb-12 text-center">
            <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-sm">
              <span className="text-2xl font-bold sm:text-3xl">IDEAL</span>
              <span className="text-3xl font-bold sm:text-4xl" aria-hidden="true">*</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-sm">
              <span className="text-2xl font-bold sm:text-3xl">COMUNIDAD</span>
              <span className="text-3xl font-bold sm:text-4xl" aria-hidden="true">*</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-sm">
              <span className="text-2xl font-bold sm:text-3xl">CAPITAL</span>
              <span className="text-3xl font-bold sm:text-4xl" aria-hidden="true">*</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-sm">
              <span className="text-2xl font-bold sm:text-3xl">TECNOLOGÍA</span>
              <span className="text-3xl font-bold sm:text-4xl" aria-hidden="true">=</span>
            </div>
            <div className="rounded-lg bg-blue-600 px-4 py-3 text-white shadow-sm">
              <span className="text-2xl font-bold sm:text-3xl">AUTONOMÍA</span>
            </div>
          </div>
          <p className="text-gray-600 text-center max-w-2xl mx-auto">
            Una comunidad sin patrimonio depende permanentemente de terceros. Por eso uno de los 
            objetivos fundamentales es acumular <strong>capital productivo colectivo</strong>.
          </p>
        </div>
      </section>

      {/* Section 19 - ¿Cómo podría funcionar? */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            ¿Cómo podría funcionar?
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-center">CIRCUITO HUMANO</h3>
              <div className="space-y-3 text-center">
                <div className="font-medium">PERSONAS</div>
                <div className="text-blue-600">↓</div>
                <div className="font-medium">NECESIDADES + CAPACIDADES</div>
                <div className="text-blue-600">↓</div>
                <div className="font-medium">COLABORACIÓN</div>
                <div className="text-blue-600">↓</div>
                <div className="font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded">CU</div>
                <div className="text-blue-600">↓</div>
                <div className="font-medium">PARTICIPACIÓN COMUNITARIA</div>
                <div className="text-blue-600">↓</div>
                <div className="font-medium bg-green-100 text-green-800 px-3 py-1 rounded">ACCESO A RECURSOS</div>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-center">CIRCUITO PRODUCTIVO</h3>
              <div className="space-y-3 text-center">
                <div className="font-medium">CAPITAL</div>
                <div className="text-green-600">↓</div>
                <div className="font-medium">INVERSIÓN</div>
                <div className="text-green-600">↓</div>
                <div className="font-medium">PRODUCTIVIDAD</div>
                <div className="text-green-600">↓</div>
                <div className="font-medium">UTILIDADES</div>
                <div className="text-green-600">↓</div>
                <div className="font-medium">PATRIMONIO COLECTIVO</div>
                <div className="text-green-600">↓</div>
                <div className="font-medium bg-green-100 text-green-800 px-3 py-1 rounded">RECURSOS</div>
              </div>
            </div>
          </div>
          <p className="text-center text-gray-600 mt-8 max-w-2xl mx-auto">
            Ambos circuitos se encuentran en: <strong>CU + comunidad → acceso a recursos</strong>
          </p>
        </div>
      </section>

      {/* Section 20 - Nadie decide desde arriba */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            Nadie decide desde arriba cuánto vale tu trabajo
          </h2>
          <div className="prose prose-lg max-w-none mx-auto text-gray-600">
            <p>
              Las personas pueden solicitar tareas y ofrecer CU. Los participantes pueden 
              aceptar o rechazar. Los precios emergen de la oferta y la demanda.
            </p>
            <p>
              La comunidad puede experimentar con distintos mecanismos para descubrir 
              qué capacidades humanas continúan siendo valiosas en un mundo automatizado.
            </p>
            <ul>
              <li>Programar podría ser barato</li>
              <li>Reparar algo podría seguir siendo escaso</li>
              <li>Enseñar, acompañar, escuchar, resolver conflictos, crear confianza...</li>
            </ul>
            <p>
              La comunidad puede convertirse en un mecanismo para observar qué cosas 
              los propios seres humanos siguen valorando.
            </p>
          </div>
        </div>
      </section>

      {/* Section 21 - ¿Y quién decide las reglas? */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            ¿Y quién decide las reglas?
          </h2>
          <div className="text-center mb-12">
            <p className="text-2xl font-bold text-gray-900 mb-4">La comunidad.</p>
            <p className="text-gray-600">
              Pero no afirmamos que ya tenemos resuelto el mecanismo democrático.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">Votación</div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">Consenso</div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">Delegación</div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">Reputación</div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">Democracia líquida</div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">Mercados de predicción</div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">Gobernanza distribuida</div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">Representación</div>
          </div>
          <p className="text-center text-gray-600 mt-8">
            La pregunta no está cerrada. <strong>Las reglas importantes deberían surgir 
            de la comunidad y poder evolucionar con ella.</strong>
          </p>
        </div>
      </section>

      {/* Section 22 - No tiene que existir una sola comunidad */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            No tiene que existir una sola comunidad
          </h2>
          <div className="prose prose-lg max-w-none mx-auto text-gray-600 mb-12">
            <p>
              La visión a largo plazo contempla una red de comunidades interoperables.
              Cada una puede tener sus propias reglas, gremios, cultura, unidades CU, 
              mecanismos de gobernanza y experimentos económicos.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="bg-white px-6 py-3 rounded-lg shadow">COMUNIDAD A</div>
            <span className="text-2xl text-gray-400 self-center">↔</span>
            <div className="bg-white px-6 py-3 rounded-lg shadow">COMUNIDAD B</div>
            <span className="text-2xl text-gray-400 self-center">↔</span>
            <div className="bg-white px-6 py-3 rounded-lg shadow">COMUNIDAD C</div>
            <span className="text-2xl text-gray-400 self-center">↔</span>
            <div className="bg-white px-6 py-3 rounded-lg shadow">COMUNIDAD D</div>
          </div>
          <p className="text-center text-gray-600">
            La analogía conceptual es: <strong>dólares ↔ euros ↔ pesos</strong>, 
            pero aplicada a comunidades económicas experimentales.
          </p>
        </div>
      </section>

      {/* Section 23 - Esto todavía no existe */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-red-600">
            Esto todavía no existe
          </h2>
          <div className="bg-red-50 border-l-4 border-red-500 p-8 mb-8">
            <p className="text-gray-800 mb-4"><strong>No tenemos todas las respuestas.</strong></p>
            <p className="text-gray-800 mb-4">No tenemos todavía la estructura jurídica definitiva.</p>
            <p className="text-gray-800 mb-4">No tenemos todavía el mecanismo económico definitivo.</p>
            <p className="text-gray-800 mb-4">No sabemos cuál será el mejor modelo de gobernanza.</p>
            <p className="text-gray-800 mb-4">No sabemos si todas las hipótesis funcionarán.</p>
            <p className="text-gray-800 font-medium">
              Precisamente por eso estamos buscando personas capaces de ayudarnos a descubrirlo.
            </p>
          </div>
        </div>
      </section>

      {/* Section 24 - Buscamos constructores */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Buscamos constructores
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            No estamos buscando empleados. Estamos buscando constructores capaces de aportar 
            conocimiento, trabajo, crítica, capital o infraestructura.
          </p>
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
            {[
              'ECONOMÍA', 'FINANZAS', 'DERECHO', 'SOCIOLOGÍA', 'FILOSOFÍA',
              'TECNOLOGÍA', 'IA', 'DISEÑO', 'INVESTIGACIÓN', 'INVERSIÓN', 'COMUNICACIÓN', 'OTROS'
            ].map((category) => (
              <Link
                key={category}
                href={`/register?category=${category.toLowerCase()}`}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center"
              >
                <h3 className="font-semibold text-gray-900">{category}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Section 36 */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8">
            ¿Querés ayudarnos a construirlo?
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="bg-blue-600 px-6 py-3 rounded hover:bg-blue-700">
              QUIERO CONTRIBUIR
            </Link>
            <Link href="/projects" className="bg-transparent border-2 border-gray-600 px-6 py-3 rounded hover:bg-gray-800">
              QUIERO INVESTIGAR
            </Link>
            <Link href="/register?category=inversion" className="bg-transparent border-2 border-gray-600 px-6 py-3 rounded hover:bg-gray-800">
              QUIERO INVERTIR
            </Link>
            <Link href="/register?category=tecnologia" className="bg-transparent border-2 border-gray-600 px-6 py-3 rounded hover:bg-gray-800">
              QUIERO CONSTRUIR LA TECNOLOGÍA
            </Link>
            <Link href="#entender" className="bg-transparent border-2 border-gray-600 px-6 py-3 rounded hover:bg-gray-800">
              QUIERO ENTENDERLO MEJOR
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>
            Comunidad de Capital Humano - Explorando la transición económica frente a la automatización
          </p>
          <p className="text-sm mt-2">
            "El ideal sin poder no sirve. El poder sin ideal tampoco."
          </p>
        </div>
      </footer>
    </div>
  );
}
