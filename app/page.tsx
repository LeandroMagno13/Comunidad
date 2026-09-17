import Link from 'next/link';
import AuthStatus from '../src/components/AuthStatus';
import GuestRegisterButton from '../src/components/GuestRegisterButton';
import Section from '../src/components/ui/Section';
import Diagram from '../src/components/ui/Diagram';
import ProfessionalCard from '../src/components/ui/ProfessionalCard';
import KeyPhrase from '../src/components/ui/KeyPhrase';
import TwoColumnLayout from '../src/components/ui/TwoColumnLayout';

const guilds = [
  {
    category: 'GREMIOS / CONSTRUCCIÓN COMUNITARIA',
    icon: '🧭',
    description: 'Investigar y experimentar con la propia organización.',
    whyNeeded:
      'Estudiar la gobernanza, la resolución de conflictos y la evolución del sistema, sin convertirse en un órgano burocrático. Es el primer gremio del laboratorio y su backlog define las fricciones prioritarias a investigar.',
    questions: [
      '¿Cómo se gobierna la comunidad sin burocracia?',
      '¿Cómo se resuelven los conflictos internos?',
      '¿Cómo evoluciona el sistema con datos reales?',
    ],
    projects: [
      'Conducir el backlog de investigación del laboratorio',
      'Diseñar los primeros mecanismos de gobernanza experimental',
    ],
    href: '/register?category=construccion-comunitaria',
  },
  {
    category: 'GREMIOS / DERECHO',
    icon: '⚖️',
    description: 'Diseñar la estructura legal del patrimonio.',
    whyNeeded:
      'Determinar qué vehículo jurídico permitiría recibir capital, invertirlo, conservar patrimonio, reinvertir rendimientos, permitir que la comunidad participe de ellos y mantener reglas de gobernanza. Puede ser un fondo, fideicomiso, sociedad, cooperativa o estructura híbrida.',
    questions: [
      '¿Qué vehículo legal permite todo esto sin violar regulaciones?',
      '¿Qué cosas requieren autorización o estructuras separadas?',
      '¿Cómo separar patrimonio, miembros y gobernanza?',
      '¿Cuándo esto se convierte en actividad financiera regulada?',
    ],
    projects: [
      'Diseñar la arquitectura jurídica del patrimonio común de inversión',
      'Determinar cuándo y cómo podría recibirse capital sin captación no autorizada',
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
    description: 'Modelar señales de participación y demanda.',
    whyNeeded:
      'Estudiar si señales de participación, demanda y acceso (CU) permiten detectar qué capacidades humanas continúan siendo necesarias bajo automatización creciente, sin vincularlas al patrimonio ni al dinero.',
    questions: [
      '¿Qué distingue demanda real de demanda artificial?',
      '¿Cómo cambia la señal cuando aumenta la automatización?',
      '¿Cómo evitar que una señal de participación termine pareciéndose a dinero?',
      '¿Qué datos debería producir el primer experimento?',
    ],
    projects: [
      'Modelar señales de participación y capacidad humana (CU experimentales)',
      'Diseñar el primer experimento de observación de capacidades',
    ],
    href: '/register?category=economia',
  },
  {
    category: 'GREMIOS / TECNOLOGÍA',
    icon: '💻',
    description: 'Construir identidad, señales de participación y transparencia.',
    whyNeeded:
      'Construir el sistema de identidad, registro de señales de participación y transparencia que permita operar la comunidad y auditar el patrimonio. Sin implementar todo de golpe.',
    questions: [
      '¿Qué se necesita construir ahora y qué se pospone?',
      '¿Cómo diseñamos un registro de señales transparente y auditable?',
      '¿Cómo garantizamos identidad sin control social?',
    ],
    projects: [
      'Mantener y evolucionar la plataforma actual',
      'Prototipar el registro de participación y señales',
    ],
    href: '/register?category=tecnologia',
  },
  {
    category: 'GREMIOS / SOCIOLOGÍA',
    icon: '👥',
    description: 'Analizar incentivos, poder y efectos sociales del sistema.',
    whyNeeded:
      'Analizar incentivos, comportamiento, relaciones de poder, pertenencia y efectos sociales de un sistema donde la comunidad participa de los rendimientos de una propiedad productiva compartida.',
    questions: [
      '¿Qué incentivos produce la participación comunitaria?',
      '¿Cómo evitar que la reputación se transforme en control social?',
      '¿Cómo surgen relaciones de poder dentro de los gremios?',
      '¿Qué sucede con quienes no quieren participar?',
    ],
    projects: [
      'Diseñar el análisis de incentivos y comportamiento del sistema',
      'Estudiar los efectos sociales de participar en los rendimientos según la participación comunitaria',
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
    titulo: 'Diseñar la arquitectura definitiva',
    actores: 'Especialistas jurídicos, financieros y de gobernanza. Sin captación de fondos todavía.',
    resultado: 'Una estructura viable. Solo después se estudia cómo formarla.',
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
    titulo: 'Probar señales de capacidad (CU)',
    actores: 'Implementar un sistema limitado de participación comunitaria.',
    resultado: 'Datos reales sobre participación, demanda y capacidad humana.',
  },
  {
    etapa: 'ETAPA 6',
    titulo: 'Separar los circuitos',
    actores: 'Observar en paralelo señales (CU) y patrimonio, sin conexión automática entre ambos.',
    resultado: 'Dos capas que se estudian por separado, sin conversión CU → recursos.',
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
  { icon: '📋', title: 'Arquitectura jurídica y financiera', text: 'Determinar qué vehículo permite recibir capital, invertirlo, conservarlo y regular la participación en los rendimientos.' },
  { icon: '🏛️', title: 'Primer patrimonio', text: 'Crear el vehículo real y comenzar a acumular capital.' },
  { icon: '📈', title: 'Primera cartera', text: 'Invertir inicialmente en activos tradicionales, líquidos, auditables y comprensibles.' },
  { icon: '💵', title: 'Primer rendimiento', text: 'Generar rendimiento financiero real.' },
  { icon: '🧪', title: 'Primer experimento de señales', text: 'Experimentar con señales de participación (CU) como información, separadas del patrimonio.' },
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

      {/* ===== HERO ===== */}
      <section className="bg-gray-900 text-white py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
            Construir capital antes de necesitarlo.
          </h1>
          <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto leading-relaxed">
            La inteligencia artificial puede producir cada vez más riqueza. La pregunta no es
            solamente cómo distribuirla cuando las máquinas produzcan más: la pregunta es quién
            será propietario de esa productividad y cómo puede participar de ella una comunidad.
          </p>
          <p className="text-lg sm:text-xl text-blue-300 font-medium mb-10 max-w-3xl mx-auto leading-relaxed">
            Hoy es un laboratorio comunitario para investigar si las personas pueden participar de
            esa productividad también siendo propietarias de una parte del capital productivo que
            la genera. Participar no significa pertenecer exclusivamente: tu trabajo, tus proyectos
            y tu patrimonio personales siguen siendo tuyos.
          </p>
          <p className="text-base sm:text-lg text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Queremos aclarar además la segunda parte de esa pregunta, porque «participar en comunidad»
            no es participar de lo mismo que se reparte. Si en algún escenario el acceso a lo material
            deja de ser escaso, los incentivos para interactuar dejan de apoyarse en la falta de cosas:
            la pregunta pasa a ser qué incentivos quedan para abastecer necesidades que no son
            estrictamente materiales, o que una máquina no puede suministrar —reconocimiento,
            pertenencia, ser útil a otros, cuidado, juicio humano. No damos la respuesta por sabida:
            queremos observarla con datos reales de nuestro propio laboratorio, no asumirla ni
            prometerla.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#modelo"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              ENTENDER EL MODELO
            </Link>
            <Link
              href="/principios"
              className="bg-transparent border-2 border-gray-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors"
            >
              NUESTROS PRINCIPIOS
            </Link>
            <Link
              href="#laboratorio"
              className="bg-transparent border-2 border-gray-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors"
            >
              PARTICIPAR DEL LABORATORIO
            </Link>
          </div>
        </div>
      </section>

      {/* ===== ESTADO DEL MODELO (Lee §15) ===== */}
      <section className="bg-slate-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="rounded-2xl border border-slate-300 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-900 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold tracking-wide text-white">ESTADO DEL MODELO</p>
                <span className="rounded-full border border-amber-400/60 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
                  EXPERIMENTAL
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-300">
                Versión experimental actual — <span className="font-bold text-white">Ronda C + Ronda D</span>
              </p>
            </div>
            <dl className="grid gap-x-6 gap-y-3 px-6 py-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-slate-500">Objetivo</dt>
                <dd className="mt-0.5 text-sm text-slate-800">
                  Estudiar señales de demanda, participación, capacidad humana y urgencia presupuestada bajo
                  automatización creciente.
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">Patrimonio real</dt>
                <dd className="mt-0.5 text-sm text-slate-800">Capa separada / experimental</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">CU</dt>
                <dd className="mt-0.5 text-sm text-slate-800">Unidad interna experimental — no monetaria. No compran prioridad</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">PID</dt>
                <dd className="mt-0.5 text-sm text-slate-800">Legacy / histórico — no utilizado por Ronda C</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">Urgencia (Ronda D)</dt>
                <dd className="mt-0.5 text-sm text-slate-800">Presupuesto periódico, no acumulable, costo cuadrático — reemplaza la apuesta de CU</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">Piso de dignidad (Ronda D)</dt>
                <dd className="mt-0.5 text-sm text-slate-800">Indicador principal (suficientarismo): cuántos quedan debajo del piso y cuánto les falta</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">Gestión de gremios</dt>
                <dd className="mt-0.5 text-sm text-slate-800">Representantes elegidos entre los miembros y encuestas gremiales/comunitarias con voto registrado y trazabilidad</dd>
              </div>
            </dl>
            <p className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
              Laboratorio experimental sobre participación, capacidades humanas, automatización y propiedad
              productiva participativa del capital. Hipótesis, no dogma. Experimento, no doctrina. Resultados, no consignas.
            </p>
          </div>
        </div>
      </section>

      {/* ===== DOS CLASES DE CONTRIBUCIÓN ===== */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-center text-gray-500 text-sm uppercase tracking-wider font-semibold mb-6">
            Sumate desde el comienzo
          </p>
          <div className="mx-auto max-w-2xl">
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
          </div>
          <p className="text-center text-xs text-gray-500 mt-4">
            En esta etapa el proyecto es un laboratorio de investigación: buscamos capital
            intelectual para diseñar el sistema. No recibimos fondos.
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
              La pregunta es: ¿quién será propietario de esa productividad?
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
            Una segunda fuente de participación en la productividad
          </h2>
          <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-10">
            No necesitamos destruir ni reemplazar los mecanismos existentes. Proponemos construir,
            en paralelo, una segunda fuente de participación basada en la propiedad compartida
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
                    { label: 'PROPIEDAD' },
                    { label: '↓', type: 'arrow' },
                    { label: 'CAPITAL PRODUCTIVO' },
                    { label: '↓', type: 'arrow' },
                    { label: 'PRODUCCIÓN' },
                    { label: '↓', type: 'arrow' },
                    { label: 'RENDIMIENTOS' },
                    { label: '↓', type: 'arrow' },
                    { label: 'PARTICIPACIÓN', type: 'highlight' },
                  ]}
                />
              ),
            }}
          />

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-8">
            <p className="text-center text-gray-700">
              El trabajo, los mercados, las empresas y el dinero siguen existiendo.{' '}
              <strong>La propuesta no requiere destruirlos.</strong> Lo que queremos es que la
              comunidad también participe de los rendimientos, porque <strong>posee</strong> parte
              del capital productivo.
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

      {/* ===== ANTES DE SEGUIR / PRINCIPIOS ===== */}
      <Section background="white">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 sm:p-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Antes de seguir</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed mb-6">
              <p>
                Comunidad Post Singularidad no propone una forma determinada de vivir, pensar u
                organizar la economía.
              </p>
              <p>
                La participación es voluntaria. La propiedad privada, los proyectos personales y las
                actividades externas a la comunidad continúan siendo independientes de ella. La
                propiedad compartida que investigamos no reemplaza la propiedad individual: puede
                coexistir con ella.
              </p>
              <p>
                No buscamos que todos tengan lo mismo. Investigamos si es posible construir una base
                de autonomía material sin eliminar la libertad de acumular patrimonio, invertir,
                emprender y vivir de maneras diferentes.
              </p>
              <p>
                Dentro de la comunidad pueden coexistir ideas económicas y formas de organización
                diferentes, siempre que respeten los derechos de los demás y los acuerdos aceptados
                voluntariamente.
              </p>
            </div>
            <p className="text-xl font-semibold text-blue-800 mb-6">
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
                Investigar cómo construir un <strong>patrimonio común de inversión</strong> en activos
                existentes y cómo la comunidad puede participar de sus rendimientos según las reglas
                que la propia comunidad defina.
              </p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900 text-sm">
            <p>
              <strong>Nota sobre la estructura jurídica:</strong> muchas de las ideas que
              planteamos tienen antecedentes en el movimiento cooperativo: propiedad colectiva,
              participación de los miembros, acumulación de patrimonio común, reinversión,
              distribución de excedentes, organización democrática y estructuras internas de
              participación. Por eso no buscamos necesariamente inventar una forma jurídica nueva.
              Una posibilidad real es que el modelo pueda implementarse mediante una cooperativa o
              una estructura cooperativa adaptada a sus objetivos, aunque todavía no lo damos por
              resuelto.
            </p>
            <p className="mt-3">
              La pregunta que intentamos responder no es cómo inventar otra forma de organización,
              sino si las estructuras que ya existen permiten implementar el modelo que planteamos.
              Nuestro punto diferencial es que el patrimonio común no estaría pensado principalmente
              para que sus miembros trabajen colectivamente en una misma actividad productiva, sino
              para acumular y administrar capital productivo y otros activos, invertirlos y generar
              rendimientos que puedan beneficiar a la comunidad. Lo vemos como una cadena:
              patrimonio colectivo, inversión, productividad y rendimientos, reinversión de una
              parte y participación de la comunidad en los rendimientos. Es la hipótesis económica
              del proyecto, no una promesa de rentabilidad.
            </p>
            <p className="mt-3">
              Esa larga experiencia cooperativa es parte de lo que queremos estudiar: el proyecto
              podría terminar usando una estructura cooperativa ya existente, una adaptación de ella
              o una combinación con otros vehículos jurídicos. La innovación, si finalmente existe,
              debería estar en el modelo económico, la arquitectura de participación, la relación
              entre patrimonio y comunidad y su funcionamiento internacional, no en cambiarle el
              nombre a una cooperativa. La comunidad tampoco está pensada como algo limitado a un
              único país: el modelo conceptual puede ser común e internacional, mientras que su
              implementación jurídica tendrá que adaptarse a cada jurisdicción y puede requerir
              entidades locales, cooperativas o sociedades independientes, vehículos de inversión u
              otras estructuras vinculadas que determinen especialistas.
            </p>
            <p className="mt-3">
              Por ahora no estamos constituyendo un fondo, ni ofreciendo una inversión, ni
              prometiendo una rentabilidad, ni afirmando que las CU sean valores negociables, ni
              definiendo todavía cómo se distribuirán los rendimientos. La estructura definitiva
              requiere análisis jurídico, financiero, fiscal y regulatorio, y seguimos llamando
              «patrimonio común de inversión» a esta idea en sentido conceptual hasta que
              especialistas determinen la estructura apropiada. Hoy el proyecto es un laboratorio de
              investigación institucional: no se recibirán fondos hasta que el Gremio de Derecho
              defina esa estructura.
            </p>
          </div>
        </div>
      </Section>

      {/* ===== MODELO: CÓMO FUNCIONA (SISTEMA ACTUAL, RONDA C) ===== */}
      <Section background="white" id="modelo">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm uppercase tracking-wider text-blue-600 font-semibold text-center mb-3">
            Ronda C + urgencia presupuestada (Ronda D) · esta versión
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3">
            Cómo funciona el modelo
          </h2>
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-red-600 mb-8">
            Experimento en curso. Todo lo que leés acá puede variar según cómo participe la comunidad.
          </p>

          <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-10">
            Este es un laboratorio. Lo implementado hoy sigue pasos simples: te sumás, recibís un punto de
            partida, participás con tus capacidades y el sistema registra señales (demanda, oferta y
            utilización) más una señal de urgencia presupuestada que todavía estamos aprendiendo a leer. Nada
            de esto es definitivo.
          </p>

          <p className="text-center text-sm text-gray-500 max-w-3xl mx-auto mb-10">
            Estresamos esta versión (Ronda C) con el presupuesto de urgencia (Ronda D) en un{' '}
            <a href="/ensayo-de-stress" className="font-semibold text-blue-600 hover:underline">
              ensayo de stress abierto
            </a>{' '}
            — 16 tensiones con su espejo legacy y 200 corridas de Monte Carlo. Es lectura pública.
          </p>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 mb-8">
            <Diagram
              steps={[
                { label: 'TE SUMÁS A LA COMUNIDAD' },
                { label: '↓', type: 'arrow' },
                { label: 'RECIBÍS UNA CU DE BIENVENIDA' },
                { label: '↓', type: 'arrow' },
                { label: 'PARTICIPÁS: SOLICITUDES, OFERTA DE CAPACIDADES Y GREMIOS' },
                { label: '↓', type: 'arrow' },
                { label: 'SE GENERAN SEÑALES DE DEMANDA, PRESIÓN Y CARGA' },
                { label: '↓', type: 'arrow' },
                { label: 'LA COMUNIDAD OBSERVA, APRENDE Y AJUSTA', type: 'highlight' },
              ]}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="font-bold text-gray-900 mb-2">Qué pasa cuando ingresa una persona nueva</h3>
              <p className="text-sm leading-relaxed text-gray-700">
                Al registrarte creás tu perfil (qué sabés hacer, qué buscás) y, si la política de bienvenida
                está activa, recibís una CU de bienvenida: un punto de partida interno, explícito y acotado
                (con tope anti-abuso). No es dinero. Empezás en nivel de acceso{' '}
                <span className="font-semibold text-gray-900">básico</span>: un piso protegido para que nadie
                quede afuera por no tener nada que ofrecer todavía.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="font-bold text-gray-900 mb-2">Cómo se participa</h3>
              <p className="text-sm leading-relaxed text-gray-700">
                Publicás solicitudes comunitarias o te ofrecés a resolver las de otros; al completar, el autor
                confirma tu participación y queda registrada. Declarás tus capacidades (qué ofrecés y a qué
                disponibilidad y calidad) y te sumás a los gremios donde se organiza el trabajo por
                especialidad. Cada acción alimenta tu nivel de acceso, nunca tu «riqueza».
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="font-bold text-gray-900 mb-2">Qué son los gremios</h3>
              <p className="text-sm leading-relaxed text-gray-700">
                Son los círculos de organización por especialidad (economía, derecho, tecnología, cultura…).
                Ahí la comunidad discute cómo avanzar, propone reglas experimentales y decide el rumbo. No son
                clubes sociales: son la capa donde el experimento se ejecuta. La estructura definitiva del
                patrimonio, por ejemplo, la definiría un gremio. Para gobernarse, los gremios eligen
                representantes entre sus miembros (con distintivo visible) y deciden por encuestas con
                trazabilidad: internas de cada gremio y generales de la comunidad, siempre con el voto
                registrado y consultable.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="font-bold text-gray-900 mb-2">De dónde salen las CU y cómo circulan</h3>
              <p className="text-sm leading-relaxed text-gray-700">
                No hay una moneda que compre nada ni una emisión mágica. Las CU salen de la{' '}
                <span className="font-semibold text-gray-900">política de bienvenida explícita</span> (al
                registrarte, con tope anti-abuso) y se registran como señal de participación y nivel de
                acceso. No se usan para comprar prioridad: esa señal es ahora un{' '}
                <span className="font-semibold text-gray-900">presupuesto de urgencia</span> periódico
                (Ronda D), no acumulable y con costo creciente. Al satisfacer una solicitud no se transfieren
                CU: el proveedor sube su nivel por contribución verificada. En las solicitudes comunitarias
                tampoco se mueven CU: solo se registra la participación.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Oferta y demanda de participación</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
              <div className="rounded-lg border border-sky-200 bg-white p-4">
                <p className="text-xs font-bold text-sky-700 uppercase">Oferta declarada</p>
                <p className="mt-1 text-sm text-gray-700">Cantidad de personas que declaran una capacidad.</p>
              </div>
              <div className="rounded-lg border border-sky-200 bg-white p-4">
                <p className="text-xs font-bold text-sky-700 uppercase">Oferta efectiva</p>
                <p className="mt-1 text-sm text-gray-700">Disponibilidad × calidad, ponderadas por nivel de acceso.</p>
              </div>
              <div className="rounded-lg border border-sky-200 bg-white p-4">
                <p className="text-xs font-bold text-sky-700 uppercase">Demanda vigente</p>
                <p className="mt-1 text-sm text-gray-700">Solicitudes activas o satisfechas en los últimos 30 días. Las viejas expiran y no acumulan.</p>
              </div>
              <div className="rounded-lg border border-sky-200 bg-white p-4">
                <p className="text-xs font-bold text-sky-700 uppercase">Presión y carga</p>
                <p className="mt-1 text-sm text-gray-700">Presión = demanda insatisfecha / oferta efectiva (detecta cuellos). Carga = capacidad utilizada / disponible.</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-sky-900">
              Estas señales son <span className="font-semibold">información, no precios</span>. Nunca se
              convierten en un ranking de personas: se usan para observar dónde la capacidad humana sigue
              siendo necesaria frente a la automatización.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Cómo afecta lo que hacés</h3>
            <ul className="space-y-2 text-sm text-gray-700 leading-relaxed">
              <li>
                <span className="font-semibold text-gray-900">Tu nivel de acceso</span> (básico → medio →
                avanzado) sube por participación y por contribución verificada —por ejemplo, satisfaciendo
                solicitudes de otras personas—, jamás por tu saldo de CU. Tener más CU no te convierte en
                mejor persona.
              </li>
              <li>
                <span className="font-semibold text-gray-900">Tus solicitudes y ofertas</span> alimentan las
                señales que el experimento estudia: cada capacidad medida muestra su demanda y su presión en
                el panel de administración.
              </li>
              <li>
                <span className="font-semibold text-gray-900">El piso se protege</span>: la prioridad no se
                compra con CU. Marcar una solicitud como urgente consume un{' '}
                <span className="font-semibold text-gray-900">presupuesto periódico, no acumulable y con
                costo creciente</span> (1→1, 2→4, 3→9 puntos): gritar más fuerte cuesta más caro, y no se
                puede ahorrar urgencia para acumular poder. Quien no tenga nada todavía participa igual,
                sin quedar afuera.
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-900 text-sm mb-6">
            <p>
              <strong>Esto es un laboratorio.</strong> Llegamos hasta acá: registro, participación, gremios,
              señales, niveles de acceso, presupuesto de urgencia, piso de dignidad y herramientas de gestión
              de gremios (representantes y encuestas con trazabilidad). Toda regla es
              experimental, parametrizada y reversible, y el
              sistema no se detiene en lo que está escrito hoy:{' '}
              <span className="font-semibold">
                todo varía según la interacción real de los usuarios
              </span>
              . La estructura monetaria, la relación de las CU con el patrimonio y cualquier distribución de
              rendimientos quedan para etapas posteriores, sujetas a una estructura jurídica y económica real
              que todavía no está definida.
            </p>
          </div>

          <div className="text-center mb-6">
            <a
              href="/manual"
              className="inline-block rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-700"
            >
              Manual de uso de esta versión →
            </a>
          </div>

          <KeyPhrase text="La pregunta de esta fase no es cuánto se reparte ni cuánto valen las CU, sino qué señales son útiles y cómo se decide el resto. Eso todavía se está investigando, no prometiendo." />
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
              title: 'NUESTRA HIPÓTESIS (circuito material)',
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
                    { label: 'LA COMUNIDAD PARTICIPA DE LOS RENDIMIENTOS', type: 'highlight' },
                  ]}
                />
              ),
            }}
          />
        </div>
      </Section>

      {/* ===== ¿QUÉ SON LAS CU? (§9 + §3 + §11) ===== */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            ¿Qué son las CU?
          </h2>
          <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-8">
            Las CU son una unidad experimental de participación y señalización dentro de la comunidad. No
            representan dinero, patrimonio ni una parte de los activos de la comunidad.
          </p>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6 mb-6">
            <p className="text-gray-800 leading-relaxed">
              Actualmente se investigan como posible instrumento para registrar aspectos de{' '}
              <strong>participación, demanda, interacción, contribución y acceso</strong> dentro de
              determinadas experiencias. Su significado definitivo todavía no está cerrado.
            </p>
            <p className="mt-3 text-gray-700 leading-relaxed">
              La hipótesis actual es estudiar si ciertas señales de participación, demanda y urgencia
              presupuestada pueden ayudar a detectar qué capacidades humanas continúan siendo necesarias en un
              contexto de automatización creciente. La CU no crea riqueza, no determina cuánto dinero existe,
              no determina cuánto patrimonio tiene la comunidad y no convierte automáticamente una
              contribución humana en dinero.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <p className="text-sm font-semibold text-gray-900 mb-3">Por eso las CU no deben interpretarse como:</p>
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

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Niveles de acceso: básico, medio y avanzado</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Son niveles <strong>funcionales experimentales</strong>, no categorías de valor personal ni una
              jerarquía económica basada en el saldo de CU.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="font-bold text-gray-900">Básico</p>
                <p className="mt-1 text-sm text-gray-600">Participación inicial registrada en la comunidad.</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="font-bold text-gray-900">Medio</p>
                <p className="mt-1 text-sm text-gray-600">Mayor actividad de participación registrada.</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="font-bold text-gray-900">Avanzado</p>
                <p className="mt-1 text-sm text-gray-600">Contribución verificada, por ejemplo satisfaciendo demandas de otros miembros.</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold text-gray-900">
              El nivel de acceso no es una medida del valor de una persona.
            </p>
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
          <KeyPhrase text="Las CU no generan rendimientos: los activos generan rendimientos. Las CU pertenecen al circuito de señales y no se conectan automáticamente con el patrimonio." />
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

      {/* ===== LOS DOS CIRCUITOS (§5) ===== */}
      <Section background="gray">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Los dos circuitos se estudian por separado
          </h2>

          <TwoColumnLayout
            left={{
              title: 'CIRCUITO MATERIAL',
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
                    { label: 'RENDIMIENTOS' },
                    { label: '↓', type: 'arrow' },
                    { label: 'REINVERSIÓN + RESERVAS + RECURSOS DISPONIBLES', type: 'highlight' },
                  ]}
                />
              ),
            }}
            right={{
              title: 'CIRCUITO DE SEÑALES',
              icon: '📡',
              color: 'green',
              children: (
                <Diagram
                  steps={[
                    { label: 'PERSONAS' },
                    { label: '↓', type: 'arrow' },
                    { label: 'COMUNIDAD' },
                    { label: '↓', type: 'arrow' },
                    { label: 'DEMANDA + OFERTA HUMANA + AUTOMATIZACIÓN' },
                    { label: '↓', type: 'arrow' },
                    { label: 'SEÑALES DE CAPACIDAD (CU)', type: 'highlight' },
                  ]}
                />
              ),
            }}
          />

          <div className="mt-10 bg-gray-900 rounded-2xl p-8 text-white">
            <p className="text-center text-gray-400 mb-4">
              Por ahora, estos circuitos <span className="font-semibold text-white">no se tocan entre sí</span>:
            </p>
            <div className="text-center text-sm text-gray-300">
              <p>
                Las CU pertenecen al circuito de señales. El patrimonio pertenece al circuito material.
              </p>
              <p className="mt-2 font-semibold text-sky-300">
                No aparecen conectando directamente ambos circuitos.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ===== SEÑALES: PRESIÓN / CARGA / AUTOMATIZACIÓN (§6–§8) ===== */}
      <Section background="white" id="señales">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm uppercase tracking-wider text-blue-600 font-semibold text-center mb-3">
            Ronda C · conceptos
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            Señales de capacidad, explicadas en lenguaje humano
          </h2>

          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="font-bold text-gray-900">Presión de demanda</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Indica cuánto de una determinada capacidad humana está siendo solicitado y no puede ser
                satisfecho por la oferta disponible. Conceptualmente: demanda insatisfecha / oferta efectiva.
              </p>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                Una presión alta indica un posible cuello de botella. Una presión baja no significa
                necesariamente que una capacidad sea poco importante: puede existir suficiente oferta, la
                demanda puede estar satisfecha, la capacidad puede estar automatizada, o simplemente puede
                existir poca demanda. No debe interpretarse aisladamente.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="font-bold text-gray-900">Carga humana</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Indica cuánto de la capacidad humana disponible está siendo utilizada. Permite distinguir
                situaciones que la presión sola no detecta.
              </p>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                Demanda satisfecha con baja carga → capacidad abundante. Demanda satisfecha con alta carga →
                muy utilizada. Demanda insatisfecha con alta carga → posible escasez. Demanda baja con baja
                carga → poca actividad. No se convierte en una puntuación individual de personas.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="font-bold text-gray-900">Automatización</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Es una variable de observación, no un juicio de valor. El experimento busca observar qué
                ocurre cuando una parte creciente de una capacidad puede ser provista tecnológicamente.
              </p>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                No asumimos de antemano que toda automatización es buena, que toda es mala, que toda
                capacidad humana desaparecerá o que toda será indispensable. Eso es precisamente lo que
                queremos observar.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6">
            <p className="text-lg font-semibold text-gray-900">El objetivo experimental es observar relaciones entre:</p>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                'demanda', 'oferta de capacidades', 'capacidad humana disponible',
                'capacidad automatizada', 'utilización', 'demanda satisfecha',
                'demanda insatisfecha', 'participación', 'acceso',
              ].map((item) => (
                <span key={item} className="rounded-md bg-white px-3 py-1.5 text-center text-sm font-medium text-sky-900 ring-1 ring-sky-200">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ===== ¿QUÉ ESTAMOS INTENTANDO DESCUBRIR? (§12) ===== */}
      <Section background="gray">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6">
            ¿Qué estamos intentando descubrir?
          </h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              La automatización puede reducir progresivamente la cantidad de trabajo humano necesario para
              producir determinados bienes y servicios. Pero eso no significa que desaparezcan todas las
              necesidades humanas ni todas las capacidades que las personas pueden aportar.
            </p>
            <p>
              Queremos investigar si una comunidad puede detectar qué capacidades humanas siguen siendo
              demandadas, cuáles están quedando cubiertas por tecnología y dónde aparecen verdaderos cuellos
              de botella.
            </p>
            <p>
              Las CU forman parte de ese experimento como señales internas de participación y demanda. El
              patrimonio, en cambio, pertenece a otra capa: representa la capacidad económica material que una
              comunidad podría llegar a construir y administrar.
            </p>
            <p>
              Todavía no sabemos cuál será la mejor relación entre estas capas. Precisamente por eso las
              estamos separando y estudiando.
            </p>
          </div>
        </div>
      </Section>

      {/* ===== PREGUNTAS ABIERTAS (§13) ===== */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6">Preguntas abiertas</h2>
          <p className="text-center text-gray-600 mb-8">
            No respondemos estas preguntas artificialmente: son parte de la investigación.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              '¿Qué deben representar exactamente las CU?',
              '¿Deben afectar prioridad, acceso, participación o solamente funcionar como señal?',
              '¿Cómo evitar que una señal de participación termine convirtiéndose accidentalmente en dinero?',
              '¿Cómo medir correctamente la escasez de capacidades humanas?',
              '¿Cómo distinguir demanda real de demanda artificial?',
              '¿Cómo cambia la señal cuando aumenta la automatización?',
              '¿Qué relación debería existir entre patrimonio real y capacidad distribuible?',
              '¿Qué parte del patrimonio debería reinvertirse?',
              '¿Qué mecanismos jurídicos podrían soportar eventualmente una estructura patrimonial comunitaria?',
              '¿Qué formas de gobierno deberían decidir sobre ese patrimonio?',
              '¿Puede una estructura de este tipo funcionar sin imponer una forma determinada de vivir o pensar?',
            ].map((q) => (
              <div key={q} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                • {q}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ===== RONDA A → RONDA C (§16) ===== */}
      <Section background="gray">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            La historia experimental: el fracaso también es método
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <p className="text-xs font-bold tracking-wide text-gray-500 uppercase">Ronda A · Control mediante PID</p>
              <h3 className="mt-1 text-lg font-bold text-gray-900">Sistema de control basado en una canasta de referencia</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Se investigó un sistema de control con PID y una canasta de referencia para regular la oferta de
                CU. Resultado: <span className="font-semibold text-red-700">descartado como mecanismo principal</span>.
                El sensor tenía poca sensibilidad y el lazo de control no gobernaba efectivamente la oferta.
              </p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-6">
              <p className="text-xs font-bold tracking-wide text-sky-600 uppercase">Ronda C · Señalización de capacidades</p>
              <h3 className="mt-1 text-lg font-bold text-gray-900">Modelo vigente</h3>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                Estudia demanda + oferta + automatización + carga humana + presión{' '}
                <span className="font-semibold">sin utilizar el PID como controlador</span>. Los experimentos
                anteriores con PID, canasta y SupplyPolicy se conservan como antecedentes y sirven para entender
                por qué fueron descartados.
              </p>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                Ver el{' '}
                <a href="/ensayo-de-stress" className="font-semibold text-sky-700 hover:underline">
                  ensayo de stress abierto de esta versión
                </a>{' '}
                (16 tensiones y su espejo legacy, Monte Carlo de 200 corridas).
              </p>
            </div>
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-6">
              <p className="text-xs font-bold tracking-wide text-teal-700 uppercase">Ronda D · en estudio</p>
              <h3 className="mt-1 text-lg font-bold text-gray-900">Urgencia presupuestada y piso de dignidad</h3>
              <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                La apuesta libre de CU (Ronda C) no tenía costo de oportunidad real: la señal de urgencia se
                saturaba y quien acumulaba CU podía comprar prioridad. La Ronda D la reemplaza por un{' '}
                <span className="font-semibold">presupuesto de urgencia</span> periódico, no acumulable y con
                costo cuadrático (1→1, 2→4, 3→9), y propone que el indicador principal pase de la desigualdad
                relativa (Gini) al <span className="font-semibold">piso de dignidad</span>: cuánta gente queda
                debajo del piso y cuánto le falta (headcount y brecha), no qué tan desigual es la cola. El
                umbral del piso es una decisión de gobernanza que definirán los gremios.
              </p>
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
      </Section>

      {/* ===== GREMIOS ===== */}
      <Section background="gray">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Los gremios son la capa de ejecución
          </h2>
          <p className="text-center text-gray-600 text-lg mb-12 max-w-3xl mx-auto">
            Nos agrupamos por profesión o problema concreto. Cada gremio tiene objetivos inmediatos
            que resolver. Para decidir, los gremios eligen representantes entre sus miembros y votan en
            encuestas internas o generales de la comunidad: cada voto queda registrado y consultable.
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: '🧭', titulo: 'Gremio de Construcción Comunitaria', objetivo: 'Investigar y experimentar con la propia organización: gobernanza, resolución de conflictos y evolución del sistema.' },
              { icon: '⚖️', titulo: 'Gremio Jurídico', objetivo: 'Investigar la estructura legal viable; no se reciben fondos hasta definirla.' },
              { icon: '📈', titulo: 'Gremio Financiero', objetivo: 'Proponer criterios de inversión, riesgo y reinversión.' },
              { icon: '📊', titulo: 'Gremio Económico', objetivo: 'Modelar señales de participación (CU).' },
              { icon: '💻', titulo: 'Gremio Tecnológico', objetivo: 'Identidad, señales de participación y transparencia.' },
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

      {/* ===== LAS 4 CAPAS ===== */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm uppercase tracking-wider text-blue-600 font-semibold text-center mb-3">
            Modelo conceptual
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6">
            Cuatro capas, una sola comunidad real
          </h2>
          <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-8">
            Esta arquitectura nos ayuda a separar lo social, lo experimental y lo que todavía es
            solo investigación, sin mezclar planos.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="font-bold text-gray-900">Capa 1 · Comunidad</h3>
              <p className="text-sm text-gray-700 mt-1">Personas, perfiles, gremios, publicaciones, conversaciones, gobernanza y reglas comunitarias.</p>
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="text-3xl mb-2">🧢</div>
              <h3 className="font-bold text-gray-900">Capa 2 · Participación (CU)</h3>
              <p className="text-sm text-gray-700 mt-1">Un mecanismo experimental de participación interna. No es dinero, cripto ni participación patrimonial, y no se conecta automáticamente con la participación en rendimientos (Capa 4).</p>
            </div>
            <div className="rounded-xl border border-gray-300 bg-gray-50 p-5">
              <div className="text-3xl mb-2">🏛️</div>
              <h3 className="font-bold text-gray-900">Capa 3 · Patrimonio</h3>
              <p className="text-sm text-gray-700 mt-1">Conceptual: investigación sobre cómo una comunidad podría acumular y administrar propiedad productiva colectiva. Hoy no existe patrimonio real.</p>
            </div>
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
              <div className="text-3xl mb-2">🧪</div>
              <h3 className="font-bold text-gray-900">Capa 4 · Participación en rendimientos</h3>
              <p className="text-sm text-gray-700 mt-1">Investigación posterior sobre cómo la comunidad podría participar de los rendimientos que genere el patrimonio. No existe mecanismo económico real.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ===== PRIMER GREMIO / LABORATORIO ===== */}
      <Section background="gray" id="laboratorio">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm uppercase tracking-wider text-blue-600 font-semibold text-center mb-3">
            Primer gremio
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6">
            Gremio de Construcción Comunitaria
          </h2>
          <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-8">
            Es el primer espacio encargado de investigar y experimentar con la propia organización:
            estudia la gobernanza, la resolución de conflictos y la evolución del sistema, sin
            convertirse en un órgano burocrático.
          </p>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🧾</span>
              <h3 className="text-lg font-bold text-gray-900">Backlog de investigación</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              {[
                'Regulación: ¿cómo construir patrimonio colectivo sin violar regulaciones financieras?',
                'Escala: ¿cómo acumular patrimonio suficiente para un impacto real?',
                'Validación de participación: ¿cómo validar contribuciones sin distorsionar las señales?',
                'Infraestructura: ¿cómo financiar la tecnología sin confundirlo con patrimonio colectivo?',
                'Propósito: ¿cómo evitar gamificar trabajo precario?',
                'Liquidez y salida: ¿cómo se gestionará la entrada y salida de participantes en el patrimonio?',
                'Gobernanza de la distribución: ¿cómo evitar que el corto plazo capture la estrategia?',
                'Ejecución empresarial: ¿cómo desarrollar proyectos que generen excedentes reales?',
              ].map((friccion) => (
                <li key={friccion} className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>{friccion}</span>
                </li>
              ))}
            </ul>
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
              Esta landing explica la arquitectura que queremos investigar y convoca a quienes
              quieran estudiar, diseñar y construir el laboratorio.
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
                <li>• El sistema de señales de participación (CU) experimentales</li>
                <li>• La separación experimental entre patrimonio y señales</li>
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
            problemas concretos que el diseño del sistema necesita: cuestión jurídica,
            criterios financieros para un futuro patrimonio, modelado económico, infraestructura
            tecnológica y análisis social.
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

          <div className="mt-14 bg-gray-900 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-3">¿Cómo participar del laboratorio?</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
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
      </Section>

      {/* ===== INVITACIÓN FINAL ===== */}
      <Section background="gray">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
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
      </Section>

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
            <Link href="/guilds" className="hover:text-gray-200 transition-colors">Gremios</Link>
            <Link href="/principios" className="hover:text-gray-200 transition-colors">Principios</Link>
            <Link href="/projects" className="hover:text-gray-200 transition-colors">Proyectos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}