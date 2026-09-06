import Link from 'next/link';
import Section from '../src/components/ui/Section';
import Diagram from '../src/components/ui/Diagram';
import ProfessionalCard from '../src/components/ui/ProfessionalCard';
import KeyPhrase from '../src/components/ui/KeyPhrase';
import TwoColumnLayout from '../src/components/ui/TwoColumnLayout';

const guilds = [
  {
    category: 'GREMIOS / DERECHO',
    icon: '⚖️',
    description: 'Diseñar la estructura legal del patrimonio.',
    whyNeeded:
      'Determinar qué vehículo jurídico permite recibir capital, invertirlo, conservar patrimonio, reinvertir rendimientos, distribuir recursos y mantener reglas de gobernanza. Puede ser un fondo, fideicomiso, sociedad, cooperativa o estructura híbrida.',
    questions: [
      '¿Qué vehículo legal permite todo esto sin violar regulaciones?',
      '¿Qué cosas requieren autorización o estructuras separadas?',
      '¿Cómo separar patrimonio, miembros y gobernanza?',
      '¿Cuándo esto se convierte en actividad financiera regulada?',
    ],
    projects: [
      'Diseñar la arquitectura jurídica del patrimonio común de inversión',
      'Mapear regulaciones relevantes para la captación de capital',
    ],
    href: '/register?category=derecho',
  },
  {
    category: 'GREMIOS / FINANZAS',
    icon: '📈',
    description: 'Proponer criterios de inversión, riesgo y reinversión.',
    whyNeeded:
      'Diseñar una cartera inicial de activos tradicionales, líquidos, auditables y comprensibles, y definir criterios de riesgo, diversificación y reinversión para el patrimonio común.',
    questions: [
      '¿Qué instrumentos financieros existentes son apropiados para la primera cartera?',
      '¿Qué criterios de riesgo y diversificación deben gobernar?',
      '¿Cómo se mide y audita el rendimiento real?',
      '¿Qué proporción debería reinvertirse para que el patrimonio crezca?',
    ],
    projects: [
      'Proponer la estrategia de inversión de la primera cartera',
      'Diseñar el sistema de transparencia y auditoría del patrimonio',
    ],
    href: '/register?category=finanzas',
  },
  {
    category: 'GREMIOS / ECONOMÍA',
    icon: '📊',
    description: 'Modelar CU y distribución.',
    whyNeeded:
      'Modelar cómo las CU representan participación y cómo se relacionan con el acceso a los rendimientos distribuibles, sin generar inflación, concentración o comportamientos perversos.',
    questions: [
      '¿Cómo se obtienen y circulan las CU sin inflación?',
      '¿Qué reglas de acceso a rendimientos son justas y sostenibles?',
      '¿Cómo evitamos concentración y comportamiento estratégico?',
      '¿Qué datos debería producir el primer experimento?',
    ],
    projects: [
      'Modelar un sistema limitado de participación comunitaria (CU)',
      'Diseñar el primer experimento de distribución de rendimientos',
    ],
    href: '/register?category=economia',
  },
  {
    category: 'GREMIOS / TECNOLOGÍA',
    icon: '💻',
    description: 'Construir identidad, registro de CU y transparencia.',
    whyNeeded:
      'Construir el sistema de identidad, registro, contabilidad de CU y transparencia que permita operar la comunidad y auditar el patrimonio. Sin implementar todo de golpe.',
    questions: [
      '¿Qué se necesita construir ahora y qué se pospone?',
      '¿Cómo diseñamos un registro de CU transparente y auditable?',
      '¿Cómo garantizamos identidad sin control social?',
    ],
    projects: [
      'Mantener y evolucionar la plataforma actual',
      'Prototipar el registro de participación y CU',
    ],
    href: '/register?category=tecnologia',
  },
  {
    category: 'GREMIOS / SOCIOLOGÍA',
    icon: '👥',
    description: 'Analizar incentivos, poder y efectos sociales del sistema.',
    whyNeeded:
      'Analizar incentivos, comportamiento, relaciones de poder, pertenencia y efectos sociales de un sistema donde el acceso a recursos se relaciona con participación comunitaria.',
    questions: [
      '¿Qué incentivos produce la participación comunitaria?',
      '¿Cómo evitar que la reputación se transforme en control social?',
      '¿Cómo surgen relaciones de poder dentro de los gremios?',
      '¿Qué sucede con quienes no quieren participar?',
    ],
    projects: [
      'Diseñar el análisis de incentivos y comportamiento del sistema',
      'Estudiar efectos sociales de la distribución por participación',
    ],
    href: '/register?category=sociologia',
  },
];

const otherBuilders = [
  'FILOSOFÍA',
  'DISEÑO',
  'INVESTIGACIÓN',
  'COMUNICACIÓN',
  'OTROS',
];

const roadmap = [
  {
    etapa: 'ETAPA 1',
    titulo: 'Diseñar el vehículo',
    actores: 'Derecho + finanzas + contabilidad + gobernanza.',
    resultado: 'Una arquitectura legal y económica viable.',
  },
  {
    etapa: 'ETAPA 2',
    titulo: 'Formar el patrimonio',
    actores: 'Captar los primeros aportes bajo la estructura correspondiente.',
    resultado: 'Capital real.',
  },
  {
    etapa: 'ETAPA 3',
    titulo: 'Invertir',
    actores: 'Construir una cartera inicial utilizando activos existentes.',
    resultado: 'Patrimonio productivo.',
  },
  {
    etapa: 'ETAPA 4',
    titulo: 'Generar rendimientos',
    actores: 'Medir resultados reales.',
    resultado: 'Recursos reales generados por capital.',
  },
  {
    etapa: 'ETAPA 5',
    titulo: 'Probar CU',
    actores: 'Implementar un sistema limitado de participación comunitaria.',
    resultado: 'Datos reales sobre circulación, incentivos y comportamiento.',
  },
  {
    etapa: 'ETAPA 6',
    titulo: 'Conectar CU con rendimientos',
    actores: 'Destinar experimentalmente una parte limitada de los rendimientos disponibles.',
    resultado: 'Primer mecanismo real: CU → acceso a recursos.',
  },
  {
    etapa: 'ETAPA 7',
    titulo: 'Escalar',
    actores: 'Solo después: más miembros, más capital, nuevos activos, gremios, gobernanza más sofisticada, interoperabilidad, otras comunidades.',
    resultado: 'El sistema crece con base en datos reales.',
  },
];

const foundingSteps = [
  { icon: '👥', title: 'Comunidad fundadora', text: 'Reunir personas capaces de diseñar la estructura.' },
  { icon: '📋', title: 'Arquitectura jurídica y financiera', text: 'Determinar qué vehículo permite recibir capital, invertirlo, conservarlo y distribuir recursos.' },
  { icon: '🏛️', title: 'Primer patrimonio', text: 'Crear el vehículo real y comenzar a acumular capital.' },
  { icon: '📈', title: 'Primera cartera', text: 'Invertir inicialmente en activos tradicionales, líquidos, auditables y comprensibles.' },
  { icon: '💵', title: 'Primer rendimiento', text: 'Generar rendimiento financiero real.' },
  { icon: '🧪', title: 'Primer experimento de distribución', text: 'Destinar una pequeña parte del rendimiento y experimentar con reglas de acceso asociadas a CU.' },
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
              <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Quiero Contribuir
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="bg-gray-900 text-white py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
            Construir capital antes de necesitarlo.
          </h1>
          <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto leading-relaxed">
            La inteligencia artificial puede reducir progresivamente el valor económico de una parte
            del trabajo humano. Esperar a que eso ocurra para discutir cómo distribuir riqueza sería
            llegar tarde.
          </p>
          <p className="text-lg sm:text-xl text-blue-300 font-medium mb-10 max-w-3xl mx-auto leading-relaxed">
            Queremos empezar antes: construir un patrimonio común, invertirlo en activos reales y
            experimentar con una forma comunitaria de distribuir parte de sus rendimientos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#modelo"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              ENTENDER EL MODELO
            </Link>
            <Link
              href="#capital"
              className="bg-transparent border-2 border-gray-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors"
            >
              AYUDAR A CONSTRUIR EL PRIMER PATRIMONIO
            </Link>
          </div>
        </div>
      </section>

      {/* ===== DOS CLASES DE CONTRIBUCIÓN ===== */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-center text-gray-500 text-sm uppercase tracking-wider font-semibold mb-6">
            Hay dos formas de sumarte desde el comienzo
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
              <div className="text-3xl mb-2">🧠</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">CAPITAL INTELECTUAL</h3>
              <p className="text-gray-700 text-sm mb-4">
                Personas que ayuden a diseñar el sistema: derecho, finanzas, economía, tecnología,
                sociología.
              </p>
              <Link
                href="#construir"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                QUIERO APORTAR CONOCIMIENTO
              </Link>
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
              <div className="text-3xl mb-2">💼</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">CAPITAL FINANCIERO</h3>
              <p className="text-gray-700 text-sm mb-4">
                Personas e instituciones dispuestas eventualmente a aportar capital al patrimonio,
                una vez definida una estructura jurídicamente viable.
              </p>
              <Link
                href="/register?category=inversion"
                className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                ME INTERESA APORTAR CAPITAL
              </Link>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-4">
            Todavía no recibimos dinero: registramos interés hasta definir el vehículo legal.
          </p>
        </div>
      </section>

      {/* ===== EL PROBLEMA ACTUAL ===== */}
      <Section background="gray">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm uppercase tracking-wider text-blue-600 font-semibold text-center mb-3">
            El problema actual
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            Hoy, la mayoría de las personas accede a recursos casi exclusivamente a través del trabajo
          </h2>
          <div className="text-center mb-8">
            <Diagram
              steps={[
                { label: 'TRABAJO' },
                { label: '↓', type: 'arrow' },
                { label: 'INGRESO' },
                { label: '↓', type: 'arrow' },
                { label: 'ACCESO A RECURSOS', type: 'highlight' },
              ]}
            />
          </div>
          <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-8">
            Si una parte creciente de la producción depende de máquinas, software e inteligencia
            artificial, depender exclusivamente del salario puede generar cada vez más incertidumbre.
          </p>
          <div className="bg-white border-l-4 border-blue-500 p-6 rounded-r-lg shadow-sm">
            <p className="text-xl sm:text-2xl text-gray-900 font-bold text-center">
              La pregunta es: ¿quién se beneficia de esa productividad?
            </p>
          </div>
        </div>
      </Section>

      {/* ===== ESTRATEGIA ECONÓMICA / TRANSICIÓN ===== */}
      <Section background="white">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm uppercase tracking-wider text-blue-600 font-semibold text-center mb-3">
            La transición que queremos construir
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            Una segunda fuente de acceso a recursos
          </h2>
          <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-10">
            No necesitamos destruir ni reemplazar los mecanismos existentes. Proponemos construir,
            en paralelo, una segunda fuente de acceso a recursos basada en la propiedad colectiva
            de capital productivo.
          </p>

          <TwoColumnLayout
            left={{
              title: 'MODELO ACTUAL',
              icon: '🕰️',
              color: 'gray',
              children: (
                <Diagram
                  steps={[
                    { label: 'TRABAJO' },
                    { label: '↓', type: 'arrow' },
                    { label: 'INGRESO' },
                    { label: '↓', type: 'arrow' },
                    { label: 'ACCESO A RECURSOS', type: 'highlight' },
                  ]}
                />
              ),
            }}
            right={{
              title: 'TRANSICIÓN QUE QUEREMOS CONSTRUIR',
              icon: '🌱',
              color: 'green',
              children: (
                <Diagram
                  steps={[
                    { label: 'PATRIMONIO' },
                    { label: '↓', type: 'arrow' },
                    { label: 'INVERSIONES' },
                    { label: '↓', type: 'arrow' },
                    { label: 'RENDIMIENTOS' },
                    { label: '↓', type: 'arrow' },
                    { label: 'ACCESO A RECURSOS', type: 'highlight' },
                  ]}
                />
              ),
            }}
          />

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
            <p className="text-center text-gray-700">
              El trabajo, los mercados, las empresas y el dinero siguen existiendo.{' '}
              <strong>La propuesta no requiere destruirlos.</strong> Lo que queremos es que la
              comunidad también pueda acceder a recursos porque <strong>posee</strong> parte del
              capital productivo.
            </p>
          </div>

          <div className="mt-8 bg-gray-900 rounded-xl p-8 text-white text-center">
            <p className="text-lg text-gray-300 mb-4">
              Si empresas de inteligencia artificial, energía, automatización, infraestructura o
              cualquier otro sector aumentan su productividad, una comunidad que posea parte de esos
              activos también participa de ese crecimiento.
            </p>
            <KeyPhrase text="En lugar de intentar protegernos de la productividad, queremos poseer una parte de ella." />
          </div>
        </div>
      </Section>

      {/* ===== EMPEZAMOS CON ALGO QUE YA FUNCIONA ===== */}
      <Section background="gray">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6">
            Empezamos con algo que ya sabemos que funciona
          </h2>
          <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-8">
            No necesitamos esperar a que exista una economía completamente automatizada. Tampoco
            necesitamos inventar desde cero una nueva forma de producir riqueza.
          </p>
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
            <p className="text-gray-700 mb-4">
              Ya existen activos productivos que generan rendimientos todos los días:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {['Empresas', 'Acciones', 'Bonos', 'Fondos', 'Infraestructura', 'Energía', 'Tecnología', 'Otras formas de capital'].map((item) => (
                <div key={item} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center text-sm font-medium text-gray-700">
                  {item}
                </div>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 text-center">
              <p className="text-xl font-bold text-gray-900">
                Nuestro primer objetivo es más concreto:
              </p>
              <p className="text-lg text-gray-800 mt-3">
                Construir un <strong>patrimonio común de inversión</strong> en activos existentes y
                estudiar cómo distribuir parte de sus rendimientos entre quienes participan de la
                comunidad.
              </p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900 text-sm">
            <p>
              <strong>Nota:</strong> todavía no afirmamos qué estructura jurídica concreta tendrá ese
              patrimonio. Puede requerir un fondo, fideicomiso, sociedad, cooperativa, estructura
              híbrida u otro vehículo. Lo llamamos «patrimonio común de inversión» en sentido
              conceptual hasta que especialistas jurídicos determinen la estructura apropiada.
            </p>
          </div>
        </div>
      </Section>

      {/* ===== UN EJEMPLO CON NÚMEROS ===== */}
      <Section background="white" id="modelo">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3">
            Un ejemplo con números
          </h2>
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-red-600 mb-8">
            Ejemplo conceptual. No representa una promesa de rentabilidad ni un modelo financiero definitivo.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
            <p className="text-gray-700 mb-4 text-center">
              100 personas construyen progresivamente un patrimonio común. El patrimonio alcanza:
            </p>
            <p className="text-center text-4xl font-bold text-gray-900 mb-4">USD 100.000</p>
            <p className="text-gray-600 text-center text-sm">
              Ese capital se invierte de manera diversificada en activos existentes.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
            <p className="text-gray-700 mb-4 text-center">
              Supongamos, exclusivamente como ejemplo, que durante cierto período genera rendimiento neto disponible de:
            </p>
            <p className="text-center text-4xl font-bold text-blue-700 mb-4">USD 8.000</p>
            <p className="text-gray-600 text-center text-sm mb-6">
              La comunidad podría decidir:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-green-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-700">USD 5.000</p>
                <p className="text-sm text-gray-600 mt-1">Reinvertir</p>
              </div>
              <div className="bg-white border border-amber-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">USD 1.000</p>
                <p className="text-sm text-gray-600 mt-1">Reservar</p>
              </div>
              <div className="bg-white border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">USD 2.000</p>
                <p className="text-sm text-gray-600 mt-1">A disposición de los participantes</p>
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <Diagram
              steps={[
                { label: 'USD 2.000' },
                { label: '↓', type: 'arrow' },
                { label: 'RECURSOS DISTRIBUIBLES' },
                { label: '↓', type: 'arrow' },
                { label: 'REGLAS DE ACCESO' },
                { label: '↓', type: 'arrow' },
                { label: 'CU' },
                { label: '↓', type: 'arrow' },
                { label: 'PARTICIPANTES', type: 'highlight' },
              ]}
            />
          </div>

          <KeyPhrase text="La innovación no es que una inversión pueda generar rendimientos. Eso ya existe. La innovación es cómo construir colectivamente ese patrimonio y cómo relacionar sus rendimientos con la participación humana en la comunidad." />
        </div>
      </Section>

      {/* ===== DIFERENCIA CON UN FONDO TRADICIONAL ===== */}
      <Section background="gray">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10">
            ¿En qué se diferencia de un fondo de inversión tradicional?
          </h2>

          <TwoColumnLayout
            left={{
              title: 'FONDO TRADICIONAL',
              icon: '🏦',
              color: 'gray',
              children: (
                <Diagram
                  steps={[
                    { label: 'APORTÁS CAPITAL' },
                    { label: '↓', type: 'arrow' },
                    { label: 'POSEÉS PARTICIPACIÓN' },
                    { label: '↓', type: 'arrow' },
                    { label: 'RECIBÍS RENDIMIENTO SEGÚN TU CAPITAL', type: 'highlight' },
                  ]}
                />
              ),
            }}
            right={{
              title: 'NUESTRA HIPÓTESIS',
              icon: '🌱',
              color: 'blue',
              children: (
                <Diagram
                  steps={[
                    { label: 'SE CONSTRUYE UN PATRIMONIO COMÚN' },
                    { label: '↓', type: 'arrow' },
                    { label: 'EL PATRIMONIO GENERA RENDIMIENTOS' },
                    { label: '↓', type: 'arrow' },
                    { label: 'UNA PARTE SE REINVIERTE' },
                    { label: '↓', type: 'arrow' },
                    { label: 'UNA PARTE PUEDE CONVERTIRSE EN RECURSOS DISPONIBLES' },
                    { label: '↓', type: 'arrow' },
                    { label: 'LA PARTICIPACIÓN COMUNITARIA EN CU AYUDA A DETERMINAR EL ACCESO', type: 'highlight' },
                  ]}
                />
              ),
            }}
          />
        </div>
      </Section>

      {/* ===== ¿DÓNDE ENTRAN LAS CU? ===== */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6">
            ¿Dónde entran las CU?
          </h2>
          <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-8">
            Si un patrimonio común genera rendimientos y existen cientos o miles de participantes,
            aparece una pregunta: <strong>¿cómo determinamos quién puede acceder a qué parte de esos
            recursos?</strong>
          </p>

          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700">Una solución sería repartir exactamente lo mismo a todo el mundo. Sería uniforme, pero ignoraría la participación.</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700">Otra sería repartir según cuánto dinero aportó cada uno. Pero eso nos devolvería simplemente a un fondo de inversión tradicional.</p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-gray-900 font-medium">
                Nuestra hipótesis es introducir una tercera dimensión: <strong>la participación en la
                comunidad.</strong>
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <p className="text-gray-800 text-lg">
              Las <strong>CU</strong> serían una unidad interna para representar esa participación.
              Se obtendrían mediante intercambios y contribuciones entre miembros, y podrían utilizarse
              como uno de los mecanismos que determinan acceso a parte de los rendimientos disponibles.
            </p>
          </div>

          <div className="mt-8 text-center">
            <Diagram
              steps={[
                { label: 'COLABORACIÓN' },
                { label: '↓', type: 'arrow' },
                { label: 'CU' },
                { label: '↓', type: 'arrow' },
                { label: 'ACUMULACIÓN / PARTICIPACIÓN' },
                { label: '↓', type: 'arrow' },
                { label: 'UMBRAL DE ACCESO' },
                { label: '↓', type: 'arrow' },
                { label: 'RECURSOS DISPONIBLES DEL PATRIMONIO', type: 'highlight' },
              ]}
            />
          </div>
        </div>
      </Section>

      {/* ===== CU NO CREA EL DINERO ===== */}
      <Section background="gray">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            Importante: las CU no crean el dinero
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
            <div className="text-center">
              <Diagram
                steps={[
                  { label: 'ACCIONES / BONOS / EMPRESAS / ACTIVOS' },
                  { label: '↓', type: 'arrow' },
                  { label: 'RENDIMIENTO REAL' },
                  { label: '↓', type: 'arrow' },
                  { label: 'PATRIMONIO', type: 'highlight' },
                ]}
              />
            </div>
          </div>
          <div className="text-center">
            <div className="inline-block bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-red-700 font-medium">NO es</p>
              <p className="text-red-800 font-bold text-lg">CU → dinero mágico</p>
            </div>
          </div>
          <KeyPhrase text="Las CU no generan rendimientos. Los activos generan rendimientos. Las CU sirven para organizar participación y eventualmente determinar acceso a una parte de esos rendimientos." />
        </div>
      </Section>

      {/* ===== REINVERSIÓN ===== */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6">
            Reinversión: la clave del crecimiento
          </h2>
          <div className="text-center mb-8">
            <Diagram
              steps={[
                { label: 'RENDIMIENTO' },
                { label: '↙ ↓ ↘', type: 'arrow' },
                { label: 'REINVERSIÓN' },
                { label: 'RESERVAS' },
                { label: 'DISTRIBUCIÓN' },
              ]}
            />
          </div>
          <p className="text-center text-gray-600 text-lg mb-6">
            No queremos repartir automáticamente todo lo que genere el patrimonio. Si hacemos eso,
            nunca adquirirá suficiente tamaño.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
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
      </Section>

      {/* ===== LOS DOS CIRCUITOS ===== */}
      <Section background="gray">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            El modelo comienza conectando dos circuitos
          </h2>

          <TwoColumnLayout
            left={{
              title: 'CIRCUITO PRODUCTIVO',
              icon: '🏭',
              color: 'blue',
              children: (
                <Diagram
                  steps={[
                    { label: 'APORTES DE CAPITAL' },
                    { label: '↓', type: 'arrow' },
                    { label: 'VEHÍCULO JURÍDICO / PATRIMONIAL' },
                    { label: '↓', type: 'arrow' },
                    { label: 'CARTERA DE ACTIVOS EXISTENTES' },
                    { label: '↓', type: 'arrow' },
                    { label: 'ACCIONES + FONDOS + BONOS + OTROS ACTIVOS' },
                    { label: '↓', type: 'arrow' },
                    { label: 'RENDIMIENTOS' },
                    { label: '↓', type: 'arrow' },
                    { label: 'REINVERSIÓN + RESERVAS + RECURSOS DISTRIBUIBLES', type: 'highlight' },
                  ]}
                />
              ),
            }}
            right={{
              title: 'CIRCUITO HUMANO',
              icon: '👥',
              color: 'green',
              children: (
                <Diagram
                  steps={[
                    { label: 'PERSONAS' },
                    { label: '↓', type: 'arrow' },
                    { label: 'COMUNIDAD' },
                    { label: '↓', type: 'arrow' },
                    { label: 'COLABORACIÓN' },
                    { label: '↓', type: 'arrow' },
                    { label: 'CU' },
                    { label: '↓', type: 'arrow' },
                    { label: 'PARTICIPACIÓN', type: 'highlight' },
                  ]}
                />
              ),
            }}
          />

          <div className="mt-10 bg-gray-900 rounded-2xl p-8 text-white">
            <p className="text-center text-gray-400 mb-6">Y se encuentran aquí:</p>
            <div className="text-center">
              <Diagram
                steps={[
                  { label: 'RECURSOS DISTRIBUIBLES', type: 'highlight' },
                  { label: '+' },
                  { label: 'CU', type: 'highlight' },
                  { label: '+' },
                  { label: 'REGLAS DE ACCESO', type: 'highlight' },
                  { label: '↓', type: 'arrow' },
                  { label: 'DISTRIBUCIÓN', type: 'highlight' },
                ]}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ===== LA COMUNIDAD NO ES UN CLUB SOCIAL ===== */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
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
              'Qué proporción se distribuye',
              'Reglas de acceso a los recursos distribuibles',
              'Cómo se obtienen y circulan las CU',
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
      </Section>

      {/* ===== GREMIOS ===== */}
      <Section background="gray">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Los gremios son la capa de ejecución
          </h2>
          <p className="text-center text-gray-600 text-lg mb-12 max-w-3xl mx-auto">
            Nos agrupamos por profesión o problema concreto. Cada gremio tiene objetivos inmediatos
            que resolver.
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: '⚖️', titulo: 'Gremio Jurídico', objetivo: 'Diseñar la estructura legal del patrimonio.' },
              { icon: '📈', titulo: 'Gremio Financiero', objetivo: 'Proponer criterios de inversión, riesgo y reinversión.' },
              { icon: '📊', titulo: 'Gremio Económico', objetivo: 'Modelar CU y distribución.' },
              { icon: '💻', titulo: 'Gremio Tecnológico', objetivo: 'Construir identidad, registro de CU y transparencia.' },
              { icon: '👥', titulo: 'Gremio Sociológico', objetivo: 'Analizar incentivos, poder y efectos sociales del sistema.' },
            ].map((g) => (
              <div key={g.titulo} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="text-3xl mb-2">{g.icon}</div>
                <h3 className="font-bold text-gray-900">{g.titulo}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Objetivo inmediato: <span className="font-medium text-gray-800">{g.objetivo}</span>
                </p>
              </div>
            ))}

            {otherBuilders.map((category) => (
              <Link
                key={category}
                href={`/register?category=${category.toLowerCase()}`}
                className="group bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center min-h-[160px]"
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
      </Section>

      {/* ===== QUÉ QUEREMOS CONSTRUIR PRIMERO ===== */}
      <Section background="white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10">
            Qué queremos construir primero
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {foundingSteps.map((step, i) => (
              <div key={step.title} className="bg-gray-50 border border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{step.icon}</span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.text}</p>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900 text-sm mt-8">
            <p>
              La selección concreta de instrumentos financieros NO se define aquí: la determinará el
              equipo financiero y jurídico una vez constituida la estructura.
            </p>
          </div>
        </div>
      </Section>

      {/* ===== ROADMAP ===== */}
      <Section background="gray">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            El roadmap
          </h2>
          <ol className="space-y-4">
            {roadmap.map((r) => (
              <li key={r.etapa} className="flex flex-col sm:flex-row sm:items-start gap-4 bg-white border border-gray-200 rounded-xl p-5">
                <span className="sm:w-28 flex-shrink-0 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-center sm:mt-1 h-fit">
                  {r.etapa}
                </span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{r.titulo}</h3>
                  <p className="text-gray-700 text-sm mt-1">{r.actores}</p>
                  <p className="text-sm mt-2">
                    <span className="font-semibold text-green-700">Resultado: </span>
                    <span className="text-gray-600">{r.resultado}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* ===== EL IDEAL SIN PODER ===== */}
      <Section background="dark">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            El ideal sin poder no sirve. El poder sin ideal tampoco.
          </h2>
          <div className="text-left space-y-5 max-w-3xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <p className="text-xl font-semibold text-blue-300 mb-2">«El ideal sin poder no sirve»</p>
              <p className="text-gray-300">
                Una comunidad puede tener principios extraordinarios, pero sin patrimonio depende de
                recursos ajenos.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <p className="text-xl font-semibold text-blue-300 mb-2">«El poder sin ideal tampoco»</p>
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
      </Section>

      {/* ===== NO PROMETER RETORNOS / LÍMITE ACTUAL ===== */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            Hasta acá no prometemos nada
          </h2>
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-6 mb-8">
            <p className="text-gray-800">
              Aunque queremos crear un patrimonio real, no estamos presentando una oferta de
              inversión ni prometiendo rentabilidad, dividendos, retorno garantizado, propiedad
              proporcional, rescate ni convertibilidad de CU. Todo eso requiere antes un vehículo
              jurídico definido.
            </p>
            <p className="text-gray-800 mt-3">
              Esta landing explica la arquitectura que queremos construir y capta colaboradores e
              interés de potenciales aportantes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-3">Lo que ya existe hoy</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ Una primera comunidad</li>
                <li>✓ Registro de colaboradores</li>
                <li>✓ Gremios iniciales</li>
                <li>✓ Arquitectura conceptual</li>
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-3">Lo que estamos diseñando</h3>
              <ul className="space-y-2 text-sm text-gray-800">
                <li>• El vehículo jurídico del patrimonio</li>
                <li>• La primera cartera de activos</li>
                <li>• El sistema de CU</li>
                <li>• El primer experimento de distribución</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* ===== FASE 2: VISIÓN POST-SINGULARIDAD ===== */}
      <Section background="gray">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm uppercase tracking-wider text-blue-600 font-semibold text-center mb-3">
            Fase posterior
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6">
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
      </Section>

      {/* ===== BUSCAMOS CONSTRUCTORES ===== */}
      <Section background="white" id="construir">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Buscamos constructores
          </h2>
          <p className="text-center text-gray-600 text-lg mb-12 max-w-3xl mx-auto">
            No buscamos empleados ni solo entusiastas. Buscamos personas capaces de resolver los
            problemas concretos que el primer patrimonio necesita: diseño jurídico, estrategia
            financiera, modelado económico, infraestructura tecnológica y análisis social.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {guilds.map((g) => (
              <ProfessionalCard
                key={g.category}
                category={g.category}
                icon={g.icon}
                description={g.description}
                whyNeeded={g.whyNeeded}
                questions={g.questions}
                projects={g.projects}
                href={g.href}
              />
            ))}

            {otherBuilders.map((category) => (
              <Link
                key={category}
                href={`/register?category=${category.toLowerCase()}`}
                className="group bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center min-h-[180px]"
              >
                <span className="text-4xl mb-3 opacity-60 group-hover:opacity-100">✚</span>
                <h3 className="font-semibold text-gray-900 text-lg">{category}</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Aportá desde tu disciplina: todavía no está detallada.
                </p>
              </Link>
            ))}
          </div>

          <div id="capital" className="mt-14 bg-gray-900 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-3">¿Te interesa aportar capital?</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Una vez definida una estructura jurídicamente viable, buscaremos aportantes e
              instituciones dispuestos a formar el primer patrimonio. Todavía no recibimos dinero:
              registramos tu interés.
            </p>
            <Link
              href="/register?category=inversion"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              ME INTERESA APORTAR CAPITAL
            </Link>
          </div>
        </div>
      </Section>

      {/* ===== INVITACIÓN FINAL ===== */}
      <Section background="gray">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Empecemos construyendo capital.
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Necesitamos especialistas para diseñar el vehículo, constructores para edificar la
            infraestructura y personas con interés de aportar capital. Empezamos con lo que ya
            existe, hoy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors text-center"
            >
              QUIERO CONTRIBUIR
            </Link>
            <Link
              href="/register?category=inversion"
              className="bg-gray-900 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors text-center"
            >
              ME INTERESA APORTAR CAPITAL
            </Link>
            <Link
              href="/login"
              className="bg-transparent border-2 border-gray-700 text-gray-900 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors text-center"
            >
              YA SOY PARTE
            </Link>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-medium text-gray-300">
            Comunidad Post Singularidad - Patrimonio común de inversión
          </p>
          <p className="text-sm mt-3">
            «El ideal sin poder no sirve. El poder sin ideal tampoco.»
          </p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <Link href="/login" className="hover:text-gray-200 transition-colors">Iniciar sesión</Link>
            <Link href="/register" className="hover:text-gray-200 transition-colors">Registrarse</Link>
            <Link href="/guilds" className="hover:text-gray-200 transition-colors">Gremios</Link>
            <Link href="/projects" className="hover:text-gray-200 transition-colors">Proyectos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}