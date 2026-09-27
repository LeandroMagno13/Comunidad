import Link from 'next/link';
import AuthStatus from '../src/components/AuthStatus';
import GuestRegisterButton from '../src/components/GuestRegisterButton';
import MemberOnlyLink from '../src/components/MemberOnlyLink';
import Section from '../src/components/ui/Section';
import KeyPhrase from '../src/components/ui/KeyPhrase';
import TwoColumnLayout from '../src/components/ui/TwoColumnLayout';

const guilds = [
  {
    category: '🧭 Construcción Comunitaria',
    description: 'Investigar y experimentar con la propia organización.',
    whyNeeded:
      'Estudiar la gobernanza, la resolución de conflictos y la evolución del sistema, sin convertirse en un órgano burocrático.',
    href: '/register?category=construccion-comunitaria',
  },
  {
    category: '⚖️ Derecho',
    description: 'Diseñar la estructura legal del patrimonio.',
    whyNeeded:
      'Determinar qué vehículo jurídico permitiría recibir capital, invertirlo, conservar patrimonio y mantener reglas de gobernanza.',
    href: '/register?category=derecho',
  },
  {
    category: '📈 Finanzas',
    description: 'Proponer criterios de inversión, riesgo y reinversión.',
    whyNeeded:
      'Diseñar una cartera inicial de activos tradicionales, líquidos, auditables y comprensibles.',
    href: '/register?category=finanzas',
  },
  {
    category: '📊 Economía',
    description: 'Modelar señales de participación y demanda.',
    whyNeeded:
      'Estudiar si señales de participación permiten detectar qué capacidades humanas continúan siendo necesarias bajo automatización creciente.',
    href: '/register?category=economia',
  },
  {
    category: '💻 Tecnología',
    description: 'Construir identidad, señales de participación y transparencia.',
    whyNeeded:
      'Construir el sistema de identidad, registro de señales de participación y transparencia que permita operar la comunidad.',
    href: '/register?category=tecnologia',
  },
  {
    category: '👥 Sociología',
    description: 'Analizar incentivos, poder y efectos sociales del sistema.',
    whyNeeded:
      'Analizar incentivos, comportamiento, relaciones de poder y pertenencia en un sistema donde la comunidad participa de los rendimientos.',
    href: '/register?category=sociologia',
  },
];

const otherBuilders = ['Filosofía', 'Diseño', 'Investigación', 'Comunicación', 'Otros'];

const simpleSteps = [
  {
    icon: '👋',
    title: 'Te sumás',
    text: 'Creás tu perfil: qué sabés hacer, qué buscás, en qué te gustaría colaborar.',
  },
  {
    icon: '🤝',
    title: 'Participás',
    text: 'Ofrecés lo que sabés hacer, ayudás a otros con sus necesidades, te sumás a gremios.',
  },
  {
    icon: '🗳️',
    title: 'La comunidad decide',
    text: 'Entre todos definimos cómo funciona el proyecto. Tu voz cuenta tanto como la de cualquier otro.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Comunidad Post Singularidad
              </h1>
            </Link>
            <nav className="flex items-center space-x-4">
              <AuthStatus />
              <GuestRegisterButton
                label="Quiero Participar"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              />
            </nav>
          </div>
        </div>
      </header>

      {/* ===== HERO AMISTOSO ===== */}
      <section className="bg-gradient-to-b from-sky-50 to-white py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 leading-tight text-gray-900">
            ¿Y si tu trabajo deja de ser la única opción?
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 mb-6 max-w-3xl mx-auto leading-relaxed">
            No hablamos de frenar el futuro ni de prometer que todo va a estar bien.
            Somos personas que nos hacemos una pregunta que nos importa:
          </p>
          <p className="text-2xl sm:text-3xl font-semibold text-sky-800 mb-10 max-w-3xl mx-auto leading-relaxed">
            ¿Podemos construir, entre todos, una forma de participar de lo que las máquinas producen?
          </p>
          <p className="text-lg text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Si esa pregunta te resonó, este espacio es para vos. No necesitás saber de
            tecnología, finanzas ni economía. Solo necesitás curiosidad y ganas de construir algo distinto.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#de-que-se-trata"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              ¿De qué se trata?
            </Link>
            <Link
              href="#para-mi"
              className="bg-white border-2 border-gray-300 text-gray-900 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
            >
              ¿Esto es para mí?
            </Link>
          </div>
        </div>
      </section>

      {/* ===== ¿ESTO ES PARA MÍ? ===== */}
      <section className="bg-white border-b border-gray-100" id="para-mi">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-gray-900">
            ¿Esto es para vos?
          </h2>
          <p className="text-center text-gray-600 text-lg mb-10 max-w-2xl mx-auto">
            No sos especialista en tecnología ni en finanzas? Perfecto. Esto es para personas como vos.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { emoji: '😰', text: 'Te preocupa qué pasará con tu trabajo cuando la inteligencia artificial avance' },
              { emoji: '🤔', text: 'Querés entender qué está pasando antes de opinar, pero no sabés por dónde empezar' },
              { emoji: '🛠️', text: 'Tenés algo para aportar: tiempo, conocimiento, ganas de ayudar' },
              { emoji: '🏗️', text: 'Querés ser parte de algo en lugar de solo mirar desde afuera' },
              { emoji: '👥', text: 'Te gusta la idea de construir comunidad, no solo consumir contenido' },
              { emoji: '💰', text: 'Te interesa la idea de que entre todos podamos ser dueños de algo que produce' },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-4 bg-sky-50 rounded-xl p-5">
                <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                <p className="text-gray-800 text-lg">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600 mt-8 text-lg">
            Si alguna de estas frases te sintió, este proyecto es para vos.
          </p>
        </div>
      </section>

      {/* ===== DE QUÉ SE TRATA ===== */}
      <section className="bg-slate-50" id="de-que-se-trata">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-gray-900">
            De qué se trata, en palabras simples
          </h2>

          <div className="space-y-8 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">El problema</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Hoy, la mayoría de las personas accede a recursos casi exclusivamente a través del trabajo.
                Si una parte creciente de la producción depende de máquinas, software e inteligencia artificial,
                depender exclusivamente del salario puede generar cada vez más incertidumbre.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mt-4">
                La pregunta es: <strong className="text-gray-900">¿quién será propietario de esa productividad?</strong>
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">La idea</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                No necesitamos destruir ni reemplazar los mecanismos existentes. Proponemos construir,
                en paralelo, una segunda fuente de participación basada en la <strong className="text-gray-900">propiedad compartida de capital productivo</strong>.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mt-4">
                Si entre todos poseemos algo que produce, entre todos participamos de lo que genera.
                Es como un fondo de inversión, pero comunitario y con propósito social.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Cómo funciona</h3>
              <div className="space-y-6">
                {simpleSteps.map((step, i) => (
                  <div key={step.title} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center text-2xl">
                      {step.icon}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">
                        {i + 1}. {step.title}
                      </h4>
                      <p className="text-gray-700 text-lg mt-1">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-sky-100 border border-sky-200 rounded-xl p-6 text-center">
            <p className="text-lg text-sky-900">
              <strong>En resumen:</strong> somos personas que se organizan para construir un patrimonio común
              y participar de sus rendimientos. No es una empresa, no es un gobierno, no es una criptomoneda.
              Es un experimento comunitario.
            </p>
          </div>
        </div>
      </section>

      {/* ===== ANTES DE SEGUIR ===== */}
      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 sm:p-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Antes de seguir, algo importante</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                Comunidad Post Singularidad no propone una forma determinada de vivir, pensar u organizar la economía.
              </p>
              <p>
                La participación es voluntaria. La propiedad privada, los proyectos personales y las actividades
                externas a la comunidad continúan siendo independientes de ella.
              </p>
              <p>
                No buscamos que todos tengan lo mismo. Investigamos si es posible construir una base de autonomía
                material sin eliminar la libertad de acumular patrimonio, invertir, emprender y vivir de maneras diferentes.
              </p>
            </div>
            <p className="text-xl font-semibold text-sky-800 mt-8 mb-6">
              No partimos de una ideología. Partimos de una pregunta.
            </p>
            <Link
              href="/principios"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
            >
              Conocer nuestros principios
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== EMPEZAMOS CON ALGO QUE YA FUNCIONA ===== */}
      <section className="bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6 text-gray-900">
            Empezamos con algo que ya sabemos que funciona
          </h2>
          <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-10">
            No necesitamos esperar a que exista una economía completamente automatizada. Tampoco necesitamos
            inventar desde cero una nueva forma de producir riqueza.
          </p>
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
            <p className="text-gray-700 mb-4 text-lg">
              Ya existen activos productivos que generan rendimientos todos los días:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {['Empresas', 'Acciones', 'Bonos', 'Fondos', 'Infraestructura', 'Energía', 'Tecnología', 'Otras formas de capital'].map((item) => (
                <div key={item} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center text-sm font-medium text-gray-700">
                  {item}
                </div>
              ))}
            </div>
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-5 text-center">
              <p className="text-xl font-bold text-gray-900">Nuestro primer objetivo es más concreto:</p>
              <p className="text-lg text-gray-800 mt-3">
                Investigar cómo construir un <strong>patrimonio común de inversión</strong> en activos existentes
                y cómo la comunidad puede participar de sus rendimientos según las reglas que la propia comunidad defina.
              </p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900 text-sm">
            <p>
              <strong>Nota importante:</strong> hoy no estamos constituyendo un fondo, ni ofreciendo una inversión,
              ni prometiendo una rentabilidad. La estructura definitiva requiere análisis jurídico, financiero, fiscal
              y regulatorio. Hoy el proyecto es un laboratorio de investigación institucional.
            </p>
          </div>
        </div>
      </section>

      {/* ===== DIFERENCIA CON UN FONDO TRADICIONAL ===== */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-gray-900">
            ¿En qué se diferencia de un fondo de inversión tradicional?
          </h2>

          <TwoColumnLayout
            left={{
              title: 'FONDO TRADICIONAL',
              icon: '🏦',
              color: 'gray',
              children: (
                <div className="space-y-3 text-gray-700">
                  <p className="text-lg">1. Aportás capital</p>
                  <p className="text-lg">2. Poseés participación proporcional</p>
                  <p className="text-lg font-semibold">3. Recibís rendimiento según tu capital</p>
                </div>
              ),
            }}
            right={{
              title: 'NUESTRA HIPÓTESIS',
              icon: '🌱',
              color: 'blue',
              children: (
                <div className="space-y-3 text-gray-700">
                  <p className="text-lg">1. Se construye un patrimonio común</p>
                  <p className="text-lg">2. El patrimonio genera rendimientos</p>
                  <p className="text-lg">3. Una parte se reinvierte</p>
                  <p className="text-lg font-semibold">4. La comunidad participa de los rendimientos</p>
                </div>
              ),
            }}
          />

          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
            <p className="text-center text-gray-700 text-lg">
              El trabajo, los mercados, las empresas y el dinero siguen existiendo.{' '}
              <strong>La propuesta no requiere destruirlos.</strong> Lo que queremos es que la comunidad
              también participe de los rendimientos, porque <strong>posee</strong> parte del capital productivo.
            </p>
          </div>
        </div>
      </section>

      {/* ===== LOS DOS CIRCUITOS ===== */}
      <section className="bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gray-900">
            Dos circuitos, estudiados por separado
          </h2>
          <p className="text-center text-gray-600 text-lg mb-10 max-w-3xl mx-auto">
            No mezclamos las cosas. Por un lado está el patrimonio real. Por otro, las señales de participación.
          </p>

          <TwoColumnLayout
            left={{
              title: 'CIRCUITO MATERIAL',
              icon: '🏭',
              color: 'blue',
              children: (
                <div className="space-y-3 text-gray-700">
                  <p className="text-lg">Aportes de capital</p>
                  <p className="text-lg">Vehículo jurídico / patrimonial</p>
                  <p className="text-lg">Cartera de activos existentes</p>
                  <p className="text-lg">Rendimientos</p>
                  <p className="text-lg font-semibold">Reinversión + reservas + recursos disponibles</p>
                </div>
              ),
            }}
            right={{
              title: 'CIRCUITO DE SEÑALES',
              icon: '📡',
              color: 'green',
              children: (
                <div className="space-y-3 text-gray-700">
                  <p className="text-lg">Personas</p>
                  <p className="text-lg">Comunidad</p>
                  <p className="text-lg">Demanda + oferta humana + automatización</p>
                  <p className="text-lg font-semibold">Señales de capacidad (CU)</p>
                </div>
              ),
            }}
          />

          <div className="mt-10 bg-gray-900 rounded-2xl p-8 text-white">
            <p className="text-center text-gray-400 mb-4">
              Por ahora, estos circuitos <span className="font-semibold text-white">no se tocan entre sí</span>:
            </p>
            <p className="text-center text-gray-300">
              Las CU pertenecen al circuito de señales. El patrimonio pertenece al circuito material.
              No aparecen conectando directamente ambos circuitos.
            </p>
          </div>
        </div>
      </section>

      {/* ===== ¿QUÉ SON LAS CU? ===== */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gray-900">
            ¿Qué son las CU?
          </h2>
          <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-8">
            Las CU son una unidad experimental de participación dentro de la comunidad.
            No representan dinero, patrimonio ni una parte de los activos.
          </p>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6 mb-6">
            <p className="text-gray-800 leading-relaxed text-lg">
              Actualmente se investigan como posible instrumento para registrar aspectos de{' '}
              <strong>participación, demanda, interacción, contribución y acceso</strong> dentro de
              determinadas experiencias. Su significado definitivo todavía no está cerrado.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <p className="text-sm font-semibold text-gray-900 mb-3">Las CU no son:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {[
                'pesos', 'dólares', 'acciones', 'participaciones patrimoniales', 'salario', 'deuda',
                'crédito', 'depósito', 'inversión', 'dividendo', 'derecho sobre el patrimonio',
                'promesa de pago',
              ].map((item) => (
                <div key={item} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-700">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 text-center text-white mb-8">
            <p className="text-lg font-bold">Tener más CU no significa ser más rico.</p>
            <p className="mt-1 text-gray-300">Tener menos CU no significa tener menos valor como persona.</p>
          </div>
        </div>
      </section>

      {/* ===== REINVERSIÓN ===== */}
      <section className="bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6 text-gray-900">
            Reinversión: la clave del crecimiento
          </h2>
          <p className="text-center text-gray-600 text-lg mb-6 max-w-3xl mx-auto">
            No queremos repartir automáticamente todo lo que genere el patrimonio. Si hacemos eso,
            nunca adquirirá suficiente tamaño.
          </p>
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-6">
            <p className="text-center text-gray-900 text-lg">
              Una parte relevante de los rendimientos debería reinvertirse para que el patrimonio
              pueda crecer. El objetivo no es consumir el fondo. El objetivo es construir una fuente
              de recursos cada vez mayor.
            </p>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            La proporción de cada componente (reinversión, reservas, distribución) sería una decisión
            de gobernanza de la comunidad.
          </p>
        </div>
      </section>

      {/* ===== LA COMUNIDAD NO ES UN CLUB SOCIAL ===== */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-gray-900">
            La comunidad no es un club social
          </h2>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
            <p className="text-gray-800 text-lg text-center">
              La comunidad es la estructura humana que gobierna el patrimonio, desarrolla sus reglas,
              produce conocimiento, intercambia capacidades y decide cómo evoluciona el sistema.
            </p>
            <p className="text-center text-gray-600 mt-4">
              Tiene una función económica e institucional. No solamente social.
            </p>
          </div>

          <h3 className="text-2xl font-semibold text-gray-900 text-center mb-6">
            ¿Qué decide la comunidad?
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {[
              'Qué se invierte y con qué criterios',
              'Qué proporción de rendimientos se reinvierte',
              'Qué proporción se reserva',
              'Qué proporción de los rendimientos se distribuye',
              'Reglas de participación en los rendimientos del patrimonio',
              'Cómo se registran las señales de participación (CU)',
              'Cómo funciona la gobernanza',
              'Qué proyectos se financian',
              'Cómo se resuelven disputas',
            ].map((item) => (
              <div key={item} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center text-sm font-medium text-gray-700">
                {item}
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600">
            Estas decisiones no se resuelven desde arriba: son el objeto de los mecanismos de
            gobernanza que la propia comunidad estudiará y adoptará.
          </p>
        </div>
      </section>

      {/* ===== GREMIOS ===== */}
      <section className="bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gray-900">
            Los gremios son la capa de ejecución
          </h2>
          <p className="text-center text-gray-600 text-lg mb-12 max-w-3xl mx-auto">
            Nos agrupamos por profesión o problema concreto. Cada gremio tiene objetivos inmediatos
            que resolver. Para decidir, los gremios eligen representantes entre sus miembros y votan en
            encuestas internas o generales de la comunidad: cada voto queda registrado y consultable.
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {guilds.map((g) => (
              <div key={g.category} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-sky-300 hover:shadow-sm transition-all">
                <h3 className="font-bold text-gray-900 text-lg">{g.category}</h3>
                <p className="text-sm text-gray-600 mt-1">{g.description}</p>
                <p className="text-sm text-gray-500 mt-2">{g.whyNeeded}</p>
              </div>
            ))}

            {otherBuilders.map((category) => (
              <Link
                key={category}
                href={`/register?category=${category.toLowerCase()}`}
                className="group bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-sky-400 hover:bg-sky-50/50 transition-all flex flex-col items-center justify-center min-h-[160px]"
              >
                <span className="text-4xl mb-3 opacity-60 group-hover:opacity-100">✚</span>
                <h3 className="font-semibold text-gray-900 text-lg">{category}</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Aportá desde tu disciplina: todavía no está detallada.
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LAS 4 CAPAS ===== */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6 text-gray-900">
            Cuatro capas, una sola comunidad real
          </h2>
          <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-8">
            Esta arquitectura nos ayuda a separar lo social, lo experimental y lo que todavía es
            solo investigación, sin mezclar planos.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-5">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="font-bold text-gray-900">Capa 1 · Comunidad</h3>
              <p className="text-sm text-gray-700 mt-1">Personas, perfiles, gremios, publicaciones, conversaciones, gobernanza y reglas comunitarias.</p>
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="text-3xl mb-2">🧢</div>
              <h3 className="font-bold text-gray-900">Capa 2 · Participación (CU)</h3>
              <p className="text-sm text-gray-700 mt-1">Un mecanismo experimental de participación interna. No es dinero, cripto ni participación patrimonial.</p>
            </div>
            <div className="rounded-xl border border-gray-300 bg-gray-50 p-5">
              <div className="text-3xl mb-2">🏛️</div>
              <h3 className="font-bold text-gray-900">Capa 3 · Patrimonio</h3>
              <p className="text-sm text-gray-700 mt-1">Conceptual: investigación sobre cómo una comunidad podría acumular y administrar propiedad productiva colectiva.</p>
            </div>
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
              <div className="text-3xl mb-2">🧪</div>
              <h3 className="font-bold text-gray-900">Capa 4 · Participación en rendimientos</h3>
              <p className="text-sm text-gray-700 mt-1">Investigación posterior sobre cómo la comunidad podría participar de los rendimientos que genere el patrimonio.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== QUÉ QUEREMOS CONSTRUIR PRIMERO ===== */}
      <section className="bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-gray-900">
            Qué queremos construir primero
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: '👥', title: 'Comunidad fundadora', text: 'Reunir personas capaces de diseñar la estructura.' },
              { icon: '📋', title: 'Arquitectura jurídica y financiera', text: 'Determinar qué vehículo permite recibir capital, invertirlo, conservarlo y regular la participación en los rendimientos.' },
              { icon: '🏛️', title: 'Primer patrimonio', text: 'Crear el vehículo real y comenzar a acumular capital.' },
              { icon: '📈', title: 'Primera cartera', text: 'Invertir inicialmente en activos tradicionales, líquidos, auditables y comprensibles.' },
              { icon: '💵', title: 'Primer rendimiento', text: 'Generar rendimiento financiero real.' },
              { icon: '🧪', title: 'Primer experimento de señales', text: 'Experimentar con señales de participación (CU) como información, separadas del patrimonio.' },
            ].map((step, i) => (
              <div key={step.title} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-sky-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{step.icon}</span>
                  <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded-full">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== EL IDEAL SIN PODER ===== */}
      <section className="bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-white">
            El ideal sin poder no sirve. El poder sin ideal tampoco.
          </h2>
          <div className="text-left space-y-5 max-w-3xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <p className="text-xl font-semibold text-sky-300 mb-2">«El ideal sin poder no sirve»</p>
              <p className="text-gray-300">
                Una comunidad puede tener principios extraordinarios, pero sin patrimonio depende de
                recursos ajenos.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <p className="text-xl font-semibold text-sky-300 mb-2">«El poder sin ideal tampoco»</p>
              <p className="text-gray-300">
                El capital sin una estructura de propósito termina reproduciendo exclusivamente los
                incentivos existentes.
              </p>
            </div>
            <p className="text-center text-xl text-white font-medium mt-6">
              Queremos combinar ambos: propósito común + propiedad productiva.
            </p>
          </div>
        </div>
      </section>

      {/* ===== NO PROMETER RETORNOS ===== */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-gray-900">
            Hasta acá no prometemos nada
          </h2>
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-6 mb-8">
            <p className="text-gray-800 text-lg">
              Aunque queremos crear un patrimonio real, no estamos presentando una oferta de
              inversión ni prometiendo rentabilidad, dividendos, retorno garantizado, propiedad
              proporcional, rescate ni convertibilidad de CU. Todo eso requiere antes un vehículo
              jurídico definido.
            </p>
            <p className="text-gray-800 mt-3 text-lg">
              Esta landing explica la arquitectura que queremos investigar y convoca a quienes
              quieran estudiar, diseñar y construir el laboratorio.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Lo que ya existe hoy</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ Una primera comunidad</li>
                <li>✓ Registro de colaboradores</li>
                <li>✓ Gremios iniciales</li>
                <li>✓ Arquitectura conceptual</li>
              </ul>
            </div>
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Lo que estamos diseñando</h3>
              <ul className="space-y-2 text-sm text-gray-800">
                <li>• El vehículo jurídico del patrimonio</li>
                <li>• La primera cartera de activos</li>
                <li>• El sistema de señales de participación (CU) experimentales</li>
                <li>• La separación experimental entre patrimonio y señales</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FASE 2: VISIÓN POST-SINGULARIDAD ===== */}
      <section className="bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6 text-gray-900">
            Más adelante: la visión de largo plazo
          </h2>
          <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-8">
            Primero patrimonio real y un primer experimento. Después, y solo después, el sistema
            podría evolucionar hacia capas más complejas:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {[
              'Más miembros y más capital',
              'Nuevos activos productivos',
              'Gobernanza más sofisticada',
              'Múltiples comunidades',
              'Interoperabilidad entre comunidades',
              'Experimentos sobre qué valor tiene el trabajo humano',
            ].map((item) => (
              <div key={item} className="bg-white border border-gray-200 rounded-lg p-4 text-center text-sm font-medium text-gray-700">
                {item}
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600">
            La singularidad es el contexto, no el punto de partida. El proyecto comienza hoy, con la
            economía que ya existe.
          </p>
        </div>
      </section>

      {/* ===== BUSCAMOS CONSTRUCTORES ===== */}
      <section className="bg-white" id="construir">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gray-900">
            Buscamos constructores
          </h2>
          <p className="text-center text-gray-600 text-lg mb-12 max-w-3xl mx-auto">
            No buscamos empleados ni solo entusiastas. Buscamos personas capaces de resolver los
            problemas concretos que el diseño del sistema necesita.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {guilds.map((g) => (
              <div key={g.category} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-sky-300 hover:shadow-sm transition-all">
                <h3 className="font-bold text-gray-900 text-lg mb-2">{g.category}</h3>
                <p className="text-sm text-gray-600">{g.description}</p>
                <p className="text-sm text-gray-500 mt-2">{g.whyNeeded}</p>
              </div>
            ))}

            {otherBuilders.map((category) => (
              <Link
                key={category}
                href={`/register?category=${category.toLowerCase()}`}
                className="group bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-sky-400 hover:bg-sky-50/50 transition-all flex flex-col items-center justify-center min-h-[180px]"
              >
                <span className="text-4xl mb-3 opacity-60 group-hover:opacity-100">✚</span>
                <h3 className="font-semibold text-gray-900 text-lg">{category}</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Aportá desde tu disciplina: todavía no está detallada.
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-14 bg-gray-900 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-3">¿Cómo participar del laboratorio?</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto text-lg">
              Sumate a un gremio, colaborá en la comunidad y ayudá a diseñar el sistema. En esta
              etapa no se reciben fondos: primero definimos, junto al Gremio de Derecho, la
              estructura jurídica y los marcos aplicables.
            </p>
            <GuestRegisterButton
              label="SUMARME AL LABORATORIO"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* ===== INVITACIÓN FINAL ===== */}
      <section className="bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900">
            Empecemos construyendo capital.
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Necesitamos especialistas que ayuden a diseñar el vehículo, constructores para edificar la
            infraestructura y personas dispuestas a investigar y experimentar con la comunidad.
            Empezamos con lo que ya existe, hoy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GuestRegisterButton
              label="QUIERO PARTICIPAR"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors text-center"
            />
            <Link
              href="#construir"
              className="bg-gray-900 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors text-center"
            >
              CONOCER LOS GREMIOS
            </Link>
            <Link
              href="/login"
              className="bg-transparent border-2 border-gray-700 text-gray-900 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors text-center"
            >
              YA SOY PARTE
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-medium text-gray-300">
            Comunidad Post Singularidad · Laboratorio experimental sobre participación, capacidades humanas,
            automatización y propiedad productiva participativa del capital
          </p>
          <p className="text-sm mt-3">
            Hipótesis, no dogma. Experimento, no doctrina. Resultados, no consignas.
          </p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <Link href="/login" className="hover:text-gray-200 transition-colors">Iniciar sesión</Link>
            <Link href="/register" className="hover:text-gray-200 transition-colors">Registrarse</Link>
            <MemberOnlyLink href="/guilds" label="Gremios" className="hover:text-gray-200 transition-colors" />
            <Link href="/principios" className="hover:text-gray-200 transition-colors">Principios</Link>
            <Link href="/projects" className="hover:text-gray-200 transition-colors">Proyectos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
