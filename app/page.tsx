import Link from 'next/link';
import Section from '../src/components/ui/Section';
import Diagram from '../src/components/ui/Diagram';
import ExampleCard from '../src/components/ui/ExampleCard';
import ProfessionalCard from '../src/components/ui/ProfessionalCard';
import KeyPhrase from '../src/components/ui/KeyPhrase';
import TwoColumnLayout from '../src/components/ui/TwoColumnLayout';
import ComparisonTable from '../src/components/ui/ComparisonTable';
import CTASection from '../src/components/ui/CTASection';

const builders = [
  {
    category: 'SOCIOLOGÍA',
    icon: '👥',
    color: 'bg-amber-500',
    description: 'Encontrar los problemas que los tecnólogos probablemente no vemos.',
    whyNeeded: 'Estamos planteando una posible transición desde una sociedad donde empleo, ingreso, identidad y estatus están fuertemente conectados hacia otra donde el trabajo humano podría dejar de ser económicamente necesario en muchas actividades. Eso genera preguntas que no son técnicas.',
    questions: [
      '¿Qué reemplaza al trabajo como espacio de integración social?',
      '¿Qué sucede con el sentido de propósito?',
      '¿Cómo se construye prestigio sin profesión?',
      '¿Cómo evitamos nuevas castas?',
      '¿Qué incentivos produce una economía basada en colaboración?',
      '¿Qué sucede con quienes no quieren participar?',
      '¿Cómo surgen relaciones de poder dentro de los gremios?',
      '¿Cómo evitamos que la reputación se transforme en control social?',
    ],
    projects: [
      'Diseñar el estudio de las preguntas abiertas del proyecto',
      'Documentar hipótesis sobre integración social sin empleo',
    ],
    href: '/register?category=sociologia',
  },
  {
    category: 'ECONOMÍA',
    icon: '📊',
    color: 'bg-blue-500',
    description: 'Necesitamos que intentes romper nuestra propia idea.',
    whyNeeded: 'Necesitamos investigar los fundamentos económicos de un sistema de unidades internas, patrimonio colectivo y mecanismos de acceso a recursos. No necesitamos que confirmes que nuestra idea funciona. Necesitamos que intentes romperla.',
    questions: [
      'Oferta monetaria de CU: ¿cómo debería funcionar?',
      'Inflación y velocidad de circulación',
      'Formación de precios en una economía de colaboración',
      'Concentración y comportamiento estratégico',
      'Mecanismos de acceso a recursos',
      'Relación entre patrimonio y CU',
      'Sostenibilidad del sistema',
      'Posibles ataques económicos al sistema',
    ],
    projects: [
      'Modelar escenarios de emisión, transferencia y destrucción de CU',
      'Diseñar mecanismos anti-concentración e anti-inflación',
    ],
    href: '/register?category=economia',
  },
  {
    category: 'DERECHO',
    icon: '⚖️',
    color: 'bg-green-500',
    description: 'Determinar qué es posible, qué requiere estructura y qué no puede hacerse.',
    whyNeeded: 'Necesitamos determinar qué cosas de esta idea ya son posibles, requieren estructuras separadas, están reguladas, podrían considerarse actividad financiera, requieren autorización, o directamente no pueden hacerse como las imaginamos.',
    questions: [
      'Separación entre patrimonio, miembros y gobernanza',
      'Separación entre beneficiarios, aportantes e inversionistas',
      '¿Cuándo una unidad interna se vuelve actividad financiera regulada?',
      'Vehículos legales: cooperativas, asociaciones, estructuras híbridas',
      'Distribución de recursos y marco legal',
    ],
    projects: [
      'Investigar la arquitectura jurídica viable para el patrimonio colectivo',
      'Mapear regulaciones relevantes para unidades internas',
    ],
    href: '/register?category=derecho',
  },
  {
    category: 'INVERSIÓN / FINANZAS',
    icon: '💼',
    color: 'bg-purple-500',
    description: 'Transformar una comunidad con buenas ideas en una institución con capacidad económica real.',
    whyNeeded: 'Para que exista patrimonio colectivo necesitamos estudiar formas legítimas y sostenibles de captar capital. Podrían existir distintas clases de aportantes, inversionistas, donantes, instituciones o vehículos financieros. Necesitamos expertos que nos ayuden a determinar qué arquitectura es viable.',
    questions: [
      '¿Cómo formamos patrimonio de largo plazo?',
      'Diversificación, riesgo y liquidez',
      'Modelos de aportación y vehículos de inversión',
      'Transparencia, auditoría y protección del patrimonio',
      'Incentivos para quienes aportan capital',
      '¿Podemos construir un vehículo donde el capital privado preserve la misión del sistema?',
    ],
    projects: [
      'Diseñar la estructura de captación de capital del proyecto',
      'Estudiar casos de estructuras híbridas (lucro + misión social)',
    ],
    href: '/register?category=inversion',
  },
  {
    category: 'TECNOLOGÍA',
    icon: '💻',
    color: 'bg-red-500',
    description: 'No necesitamos solo una web: necesitamos infraestructura eventual.',
    whyNeeded: 'No necesitamos solamente desarrollar una web. Necesitamos eventualmente infraestructura para identidad, perfiles, gremios, solicitudes, intercambio de CU, reputación, gobernanza, proyectos, auditoría, transparencia e interoperabilidad entre comunidades. Pero NO implementar todo ahora.',
    questions: [
      '¿Qué arquitectura permite transparencia y auditoría?',
      '¿Cómo diseñamos identidad y reputación sin control social?',
      '¿Cómo se construye interoperabilidad entre comunidades?',
      '¿Qué se construye ahora y qué se pospone?',
    ],
    projects: [
      'Mantener y evolucionar la plataforma actual',
      'Prototipar los mecanismos de intercambio de colaboración',
    ],
    href: '/register?category=tecnologia',
  },
];

const otherBuilders = [
  'FILOSOFÍA',
  'DISEÑO',
  'INVESTIGACIÓN',
  'COMUNICACIÓN',
  'OTROS',
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
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            ¿Qué pasa cuando el trabajo deja de ser necesario?
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 mb-6 max-w-3xl mx-auto leading-relaxed">
            Durante siglos vinculamos trabajo, ingreso y acceso a recursos.
          </p>
          <p className="text-lg text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Si la automatización rompe gradualmente ese vínculo, necesitamos experimentar con otro.
          </p>
          <p className="text-lg sm:text-xl text-blue-300 font-medium mb-10 max-w-3xl mx-auto leading-relaxed">
            Nuestra hipótesis: construir comunidades que posean capital productivo y permitan
            que las personas participen de la riqueza que ese capital genera.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#entender"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              ENTENDER CÓMO PODRÍA FUNCIONAR
            </Link>
            <Link
              href="#construir"
              className="bg-transparent border-2 border-gray-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors"
            >
              CONSTRUIRLO CON NOSOTROS
            </Link>
          </div>
        </div>
      </section>

{/* ===== EL PROBLEMA ===== */}
      <Section background="gray" id="entender">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm uppercase tracking-wider text-blue-600 font-semibold text-center mb-3">
            El problema
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            Nuestra economía conecta tres cosas
          </h2>

          <div className="text-center mb-10">
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

          <p className="text-center text-gray-600 text-lg mb-6">
            Pero si la automatización produce cada vez más con cada vez menos trabajo humano,
            esa conexión se vuelve inestable.
          </p>

          <div className="text-center mb-10">
            <Diagram
              steps={[
                { label: 'MÁQUINAS + IA' },
                { label: '↓', type: 'arrow' },
                { label: 'MAYOR PRODUCTIVIDAD' },
                { label: '↓', type: 'arrow' },
                { label: 'MENOR NECESIDAD DE TRABAJO HUMANO' },
                { label: '↓', type: 'arrow' },
                { label: 'INCERTIDUMBRE SOBRE EL INGRESO', type: 'highlight' },
              ]}
            />
          </div>

          <div className="bg-white border-l-4 border-blue-500 p-6 rounded-r-lg shadow-sm">
            <p className="text-lg text-gray-800 mb-2 font-semibold">
              La pregunta más profunda no es solo «¿qué trabajos desaparecerán?»
            </p>
            <p className="text-xl sm:text-2xl text-gray-900 font-bold">
              ¿Cómo accede una persona a recursos en una economía que necesita cada vez menos
              de su trabajo para producirlos?
            </p>
          </div>
        </div>
      </Section>

      {/* ===== NUESTRA HIPÓTESIS ===== */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm uppercase tracking-wider text-blue-600 font-semibold text-center mb-3">
            Nuestra hipótesis
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6">
            No queremos detener la automatización.
          </h2>
          <h3 className="text-2xl sm:text-3xl font-semibold text-center text-blue-700 mb-12">
            Queremos ampliar el acceso a su productividad.
          </h3>

          <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-10">
            Si las máquinas son cada vez más capaces de producir recursos, la pregunta es quién
            accede a esos recursos y bajo qué condiciones. Nuestra propuesta: que las comunidades
            puedan poseer capital productivo, colectivamente.
          </p>

          <div className="text-center">
            <Diagram
              steps={[
                { label: 'CAPITAL PRODUCTIVO COLECTIVO' },
                { label: '↓', type: 'arrow' },
                { label: 'PRODUCTIVIDAD' },
                { label: '↓', type: 'arrow' },
                { label: 'RECURSOS' },
                { label: '↓', type: 'arrow' },
                { label: 'NUEVO MECANISMO DE ACCESO', type: 'highlight' },
              ]}
            />
          </div>

          <KeyPhrase text="El ideal sin poder no sirve. El poder sin ideal tampoco." variant="blockquote" />
          <div className="max-w-3xl mx-auto text-gray-600 space-y-3">
            <p>
              <strong>El ideal</strong> es construir una comunidad donde el progreso tecnológico
              amplíe la autonomía humana.
            </p>
            <p>
              <strong>El poder</strong> es poseer el capital, la infraestructura y las instituciones
              necesarias para hacerlo posible.
            </p>
          </div>
        </div>
      </Section>

      {/* ===== EL PODER MATERIAL ===== */}
      <Section background="gray">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm uppercase tracking-wider text-blue-600 font-semibold text-center mb-3">
            El poder material
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            ¿Por qué el capital es indispensable?
          </h2>
          <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-8">
            Colaborar entre personas NO crea por sí solo los recursos materiales que queremos
            distribuir. Una comunidad puede compartir conocimiento, tiempo y ayuda, pero para
            generar capacidad económica real necesita también poseer activos productivos.
          </p>

          <TwoColumnLayout
            left={{
              title: 'MOTOR HUMANO',
              icon: '👥',
              color: 'blue',
              children: (
                <p className="text-gray-700">
                  Personas que colaboran entre ellas. Aportan capacidades, tiempo, conocimientos
                  y decisiones.
                </p>
              ),
            }}
            right={{
              title: 'MOTOR MATERIAL',
              icon: '🏭',
              color: 'purple',
              children: (
                <p className="text-gray-700">
                  Capital que posee activos capaces de producir rendimiento. Es la base
                  económica real del sistema.
                </p>
              ),
            }}
          />

          <KeyPhrase text="La comunidad organiza el valor humano. El patrimonio genera capacidad material." variant="center" />
        </div>
      </Section>

      {/* ===== QUÉ SON LAS CU ===== */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm uppercase tracking-wider text-blue-600 font-semibold text-center mb-3">
            Una pieza de la arquitectura
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            ¿Qué son las CU?
          </h2>

          <p className="text-center text-gray-600 text-lg mb-8">
            CU significa provisionalmente <strong>Community Units</strong>.
            Son unidades internas que permiten registrar e intercambiar colaboración dentro de una comunidad.
          </p>

          <div className="grid gap-4 md:grid-cols-2 mb-8">
            {[
              'No representan cuánto vale una persona.',
              'No son acciones del patrimonio colectivo.',
              'No significan ser dueño de una cantidad de dinero.',
              'No prometen una conversión fija a pesos, dólares o cualquier otra moneda.',
            ].map((item) => (
              <div key={item} className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                <span className="font-bold mr-2">✕</span>{item}
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <p className="text-gray-800 mb-4 text-lg">
              Su función sería otra:
            </p>
            <p className="text-gray-900 font-medium text-xl mb-3">
              Permitir que las personas intercambien capacidades entre ellas y construir un
              registro económico de participación dentro de la comunidad.
            </p>
            <p className="text-gray-700">
              CU es solamente una pieza de una arquitectura mucho mayor. No es una criptomoneda,
              ni un token especulativo, ni una acción, ni un salario.
            </p>
          </div>
        </div>
      </Section>

      {/* ===== EJEMPLO REAL: ANA Y MARTÍN ===== */}
      <Section background="gray">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Una CU se entiende mejor con un ejemplo
          </h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
            Así imaginamos que podría funcionar el intercambio de colaboración dentro de una comunidad.
          </p>

          <ExampleCard
            title="Ana necesita una herramienta web"
            steps={[
              { actor: 'Ana', action: 'Tiene una necesidad: crear un pequeño formulario web.', type: 'need' },
              { actor: 'Ana', action: 'Publica una solicitud: “Necesito ayuda para crear este formulario. Ofrezco 30 CU.”', cue: 30, type: 'offer' },
              { actor: 'Martín', action: 'Sabe programarlo. Acepta la solicitud y realiza el trabajo.', type: 'work' },
              { actor: 'Ana', action: 'Transfiere las 30 CU a Martín en agradecimiento por su capacidad.', cue: -30, type: 'transfer' },
            ]}
            conclusion="Las CU no fueron el producto. El producto fue la colaboración entre Ana y Martín. Las CU permitieron expresar e intercambiar valor dentro de la comunidad."
          />

          <div className="mt-10">
            <ExampleCard
              title="Martín gasta sus CU"
              steps={[
                { actor: 'Martín', action: 'Ahora tiene 30 CU y necesita otra cosa: “Necesito ayuda de un contador.”', type: 'offer' },
                { actor: 'Martín', action: 'Publica la solicitud ofreciendo 20 CU.', cue: 20, type: 'offer' },
                { actor: 'Otro miembro', action: 'Acepta, realiza el trabajo de contabilidad.', type: 'work' },
                { actor: 'Martín', action: 'Transfiere las 20 CU.', cue: -20, type: 'transfer' },
              ]}
              conclusion="Así las CU circulan: se acumulan, se gastan, se ganan, en función de la colaboración entre personas."
            />
          </div>
        </div>
      </Section>

      {/* ===== CU NO ES PAGO POR TRABAJAR ===== */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            CU no es «pago por trabajar para la comunidad»
          </h2>
          <p className="text-center text-gray-600 text-lg mb-8 max-w-3xl mx-auto">
            No queremos crear simplemente otro empleo disfrazado. La comunidad debería permitir
            valorar muchas clases de contribuciones humanas.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {[
              'Programar', 'Reparar', 'Enseñar', 'Investigar', 'Diseñar',
              'Organizar', 'Mediar', 'Cuidar', 'Acompañar', 'Escuchar',
              'Crear', 'Resolver conflictos', 'Documentar conocimiento',
              'Ayudar a otra persona', 'Construir herramientas',
            ].map((item) => (
              <div key={item} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center text-sm font-medium text-gray-700">
                {item}
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <p className="text-gray-800">
              La automatización podría cambiar radicalmente el precio relativo de estas cosas.
              Quizás en algún momento programar sea abundante porque las IA lo hacen casi gratis,
              mientras que una hora de atención humana genuina resulte escasa.
            </p>
            <p className="text-gray-800 mt-3">
              No debemos decidir eso desde arriba. Queremos que <strong>las interacciones entre
              personas ayuden a descubrir qué continúa teniendo valor humano</strong>.
            </p>
          </div>
        </div>
      </Section>

      {/* ===== CÓMO SE ACCEDE A RECURSOS ===== */}
      <Section background="gray">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            ¿Por qué querrías CU?
          </h2>
          <p className="text-center text-gray-600 text-lg mb-10 max-w-3xl mx-auto">
            Las CU no solo sirven para intercambiar colaboración. La hipótesis es que también
            puedan funcionar como <strong>mecanismo de acceso al rendimiento producido por el
            patrimonio colectivo</strong>.
          </p>

          <p className="text-center text-gray-600 mb-8">Pero esto hay que explicarlo con cuidado:</p>

          <div className="grid gap-4 md:grid-cols-3 mb-10">
            {[
              { label: 'No es: “1 CU = X dólares”', style: 'red' },
              { label: 'No es: “las CU son convertibles”', style: 'red' },
              { label: 'No es: “ganás dinero trabajando”', style: 'red' },
            ].map((item) => (
              <div key={item.label} className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-center font-medium">
                ✕ {item.label}
              </div>
            ))}
          </div>

          <p className="text-center text-gray-800 text-lg max-w-3xl mx-auto mb-8">
            En cambio: a medida que una persona participa y acumula CU, podría alcanzar
            determinados <strong>umbrales de participación</strong> que le permitan acceder a
            una porción de los recursos disponibles generados por el patrimonio colectivo.
          </p>

          <div className="text-center mb-8">
            <Diagram
              steps={[
                { label: 'COLABORACIÓN' },
                { label: '↓', type: 'arrow' },
                { label: 'CU' },
                { label: '↓', type: 'arrow' },
                { label: 'ACUMULACIÓN / PARTICIPACIÓN' },
                { label: '↓', type: 'arrow' },
                { label: 'UMBRAL DE ACCESO', type: 'highlight' },
                { label: '↓', type: 'arrow' },
                { label: 'RECURSOS DISPONIBLES DEL PATRIMONIO', type: 'highlight' },
              ]}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Ejemplo puramente ilustrativo <span className="text-sm font-normal text-gray-500">(los números NO son definitivos)</span>
            </h3>
            <p className="text-gray-700 mb-4">
              Supongamos que una comunidad determina experimentalmente:
            </p>
            <div className="bg-blue-50 rounded-lg p-4 text-center mb-4">
              <p className="text-2xl font-bold text-blue-800">100 CU = 1 unidad de acceso a recursos</p>
            </div>
            <p className="text-gray-700 mb-3">
              Una persona participa en diferentes intercambios y llega a 100 CU. Eso podría habilitar
              una unidad de acceso a los recursos que el patrimonio de esa comunidad pueda efectivamente distribuir.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900">
              <p className="font-medium mb-1">Importante:</p>
              <p>
                No significa que 100 CU «valgan» una cantidad fija de dinero. Significa que la comunidad
                decidió utilizar ese nivel de participación como condición para liberar una determinada
                unidad de recursos. La disponibilidad real depende siempre del patrimonio y de los
                rendimientos reales existentes.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ===== LOS DOS CIRCUITOS ===== */}
      <Section background="white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Dos circuitos que se encuentran
          </h2>
          <p className="text-center text-gray-600 text-lg mb-12 max-w-3xl mx-auto">
            El circuito humano organiza la colaboración. El circuito productivo genera la capacidad
            material. Ninguno funciona solo.
          </p>

          <TwoColumnLayout
            left={{
              title: 'CIRCUITO HUMANO',
              icon: '👥',
              color: 'blue',
              children: (
                <Diagram
                  steps={[
                    { label: 'PERSONAS' },
                    { label: '↓', type: 'arrow' },
                    { label: 'NECESIDADES + CAPACIDADES' },
                    { label: '↓', type: 'arrow' },
                    { label: 'INTERCAMBIOS' },
                    { label: '↓', type: 'arrow' },
                    { label: 'CU', type: 'highlight' },
                    { label: '↓', type: 'arrow' },
                    { label: 'PARTICIPACIÓN' },
                  ]}
                />
              ),
            }}
            right={{
              title: 'CIRCUITO PRODUCTIVO',
              icon: '🏭',
              color: 'purple',
              children: (
                <Diagram
                  steps={[
                    { label: 'APORTES / CAPITAL' },
                    { label: '↓', type: 'arrow' },
                    { label: 'PATRIMONIO COLECTIVO' },
                    { label: '↓', type: 'arrow' },
                    { label: 'INVERSIÓN' },
                    { label: '↓', type: 'arrow' },
                    { label: 'PRODUCTIVIDAD' },
                    { label: '↓', type: 'arrow' },
                    { label: 'RENDIMIENTOS' },
                    { label: '↓', type: 'arrow' },
                    { label: 'RECURSOS DISPONIBLES', type: 'highlight' },
                  ]}
                />
              ),
            }}
          />

          <div className="mt-12 bg-gray-900 rounded-2xl p-8 text-white">
            <p className="text-center text-gray-400 mb-6">Y ambos se encuentran aquí:</p>
            <div className="text-center">
              <Diagram
                steps={[
                  { label: 'PARTICIPACIÓN EN CU', type: 'highlight' },
                  { label: '+' },
                  { label: 'RECURSOS REALES DISPONIBLES', type: 'highlight' },
                  { label: '+' },
                  { label: 'REGLAS DE LA COMUNIDAD', type: 'highlight' },
                  { label: '↓', type: 'arrow' },
                  { label: 'ACCESO A RECURSOS', type: 'highlight' },
                ]}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ===== UNIDAD DE RECURSOS ===== */}
      <Section background="gray">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            ¿Qué es una «Unidad de Recursos»?
          </h2>
          <p className="text-center text-gray-600 text-lg mb-8 max-w-3xl mx-auto">
            Podemos usar provisionalmente el término <strong>UR</strong> o simplemente
            «Unidad de Recursos», pero sin abusar de nuevas siglas.
          </p>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
            <p className="text-gray-800 text-lg">
              Una Unidad de Recursos es una abstracción para representar una determinada cantidad
              de capacidad material que el patrimonio puede distribuir.
            </p>
            <p className="text-gray-600 mt-4">
              Todavía NO sabemos cuál debería ser su definición final. Podría representar dinero
              distribuible, acceso a bienes o servicios, o evolucionar hacia otros mecanismos.
              Es una pregunta abierta.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-5 text-center">
              <p className="font-bold text-blue-900 mb-1">CU</p>
              <p className="text-blue-800">Participación e intercambio humano</p>
            </div>
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-5 text-center">
              <p className="font-bold text-green-900 mb-1">RECURSOS</p>
              <p className="text-green-800">Capacidad económica real generada por el patrimonio</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ===== DE DÓNDE SALEN LAS CU ===== */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            ¿De dónde salen las CU?
          </h2>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">↗ Transferencia</h3>
              <p className="text-gray-700">
                Las CU ya existen y pasan de una persona a otra. Ejemplo: Ana → 30 CU → Martín.
              </p>
              <p className="mt-3 text-sm bg-white border border-gray-200 rounded-lg p-2 text-center font-medium">
                No cambia la cantidad total de CU.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">✦ Emisión</h3>
              <p className="text-gray-700">
                La comunidad crea nuevas CU.
              </p>
              <p className="mt-3 text-sm bg-white border border-gray-200 rounded-lg p-2 text-center font-medium text-amber-700">
                Todavía debemos investigar bajo qué condiciones debería ocurrir.
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">✕ Destrucción</h3>
              <p className="text-gray-700">
                CU salen de circulación bajo determinadas reglas.
              </p>
              <p className="mt-3 text-sm bg-white border border-gray-200 rounded-lg p-2 text-center font-medium text-amber-700">
                Todavía debemos investigar cuándo o por qué.
              </p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 text-white">
            <p className="text-center text-lg font-medium mb-2">
              Esto abre una pregunta fundamental:
            </p>
            <p className="text-center text-xl text-blue-300 font-semibold">
              ¿Cómo evitamos que una economía de CU genere inflación, concentración o
              comportamientos perversos?
            </p>
            <p className="text-center text-gray-400 mt-4">
              Eso debe formar parte del trabajo de economistas y especialistas financieros.
            </p>
          </div>
        </div>
      </Section>

      {/* ===== QUÉ COSAS PUEDEN TENER VALOR ===== */}
      <Section background="gray">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            ¿Qué cosas pueden tener valor?
          </h2>
          <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-10">
            No lo decidimos nosotros desde arriba. Las interacciones entre personas —la oferta y la
            demanda real de capacidades— deberían descubrir qué continúa teniendo valor humano.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { a: 'Programar', b: '→ ¿abundante?' },
              { a: 'Reparar', b: '→ ¿sigue escaso?' },
              { a: 'Enseñar', b: '→ ¿cambia de precio?' },
              { a: 'Acompañar', b: '→ ¿humano escaso?' },
              { a: 'Escuchar', b: '→ ¿valor genuino?' },
              { a: 'Crear', b: '→ ¿qué desplaza la IA?' },
              { a: 'Resolver conflictos', b: '→ ¿medio escaso?' },
              { a: 'Construir herramientas', b: '→ ¿colaborativo?' },
            ].map((item) => (
              <div key={item.a} className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 transition-colors">
                <p className="font-bold text-gray-900">{item.a}</p>
                <p className="text-sm text-gray-500 mt-1">{item.b}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ===== QUIÉN DECIDE LAS REGLAS ===== */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            ¿Quién decide las reglas?
          </h2>
          <p className="text-center text-2xl font-bold text-gray-900 mb-8">La comunidad.</p>

          <p className="text-center text-gray-600 text-lg mb-10 max-w-3xl mx-auto">
            Pero antes de hablar de mecanismos democráticos, hay que aclarar{' '}
            <strong>qué cosas</strong> tendría que decidir la comunidad:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
            {[
              'Cuánto y cuándo emitir CU',
              'Cuándo destruir CU',
              'Qué condiciones habilitan acceso a recursos',
              'Qué proporción de rendimientos se reinvierte',
              'Qué proporción se pone a disposición de miembros',
              'Qué proyectos financiar',
              'Cómo funcionan los gremios',
              'Qué reglas de convivencia existen',
              'Cómo modificar el protocolo',
              'Cómo resolver disputas',
            ].map((item) => (
              <div key={item} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center text-sm font-medium text-gray-700">
                {item}
              </div>
            ))}
          </div>

          <h3 className="text-2xl font-semibold text-gray-900 text-center mb-4">
            Un ejemplo concreto
          </h3>
          <p className="text-center text-gray-600 mb-4">
            Supongamos que debemos decidir cuál debería ser el umbral para acceder a una unidad de recursos.
          </p>
          <div className="grid grid-cols-5 gap-2 mb-6 max-w-2xl mx-auto">
            {['90 CU', '100 CU', '120 CU', '150 CU', '200 CU'].map((v) => (
              <div key={v} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center font-bold text-blue-800">
                {v}
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600 mb-6">
            La comunidad puede utilizar distintos mecanismos para obtener una decisión:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10 max-w-3xl mx-auto">
            {[
              'Mediana', 'Promedio recortado', 'Votación',
              'Consenso', 'Mecanismos ponderados', 'Democracia líquida',
              'Mercado', 'Otros experimentos',
            ].map((item) => (
              <div key={item} className="bg-white border border-gray-200 rounded-lg p-3 text-center text-sm font-medium text-gray-700">
                {item}
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <p className="text-lg text-gray-800">
              No afirmamos que un promedio simple sea la solución. La idea importante es:{' '}
              <strong>el fundador no debería poder decidir arbitrariamente cuánto vale participar
              de la comunidad</strong>. Las reglas económicas fundamentales deben poder ser gobernadas
              por quienes forman parte de ella.
            </p>
          </div>
        </div>
      </Section>

      {/* ===== GREMIOS ===== */}
      <Section background="gray">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Las comunidades necesitan organización
          </h2>
          <p className="text-center text-gray-600 text-lg mb-10 max-w-3xl mx-auto">
            Los gremios son agrupaciones de personas alrededor de capacidades, disciplinas o problemas.
            No son únicamente categorías profesionales: un gremio puede surgir alrededor de cualquier
            actividad que la comunidad considere relevante.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-10">
            {[
              '⚖️ Gremio Jurídico',
              '💼 Gremio Financiero',
              '💻 Gremio de Tecnología',
              '👥 Gremio de Sociología',
              '🎓 Gremio de Educación',
              '🏭 Gremio de Fabricación',
            ].map((item) => (
              <div key={item} className="bg-white border border-gray-200 rounded-lg p-4 text-center font-medium text-gray-800 hover:border-blue-300 hover:shadow-sm transition-all">
                {item}
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-10">
            <p className="font-semibold text-gray-900 mb-4">Sus funciones pueden incluir:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                'Intercambiar conocimiento',
                'Recibir solicitudes',
                'Discutir problemas',
                'Desarrollar estándares',
                'Crear propuestas',
                'Realizar proyectos',
                'Asesorar a otros gremios',
                'Investigar preguntas abiertas',
              ].map((item) => (
                <div key={item} className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="text-green-500">✓</span>{item}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-8 text-white text-center">
            <p className="text-gray-400 mb-4">Y los gremios colaboran entre sí:</p>
            <p className="text-xl font-bold mb-2">
              DERECHO <span className="text-gray-400">+</span> FINANZAS{' '}
              <span className="text-gray-400">+</span> ECONOMÍA
            </p>
            <p className="text-blue-300 mt-4 text-lg">
              ↓ «Diseñar una estructura viable para el patrimonio colectivo»
            </p>
          </div>
        </div>
      </Section>

      {/* ===== MUCHAS COMUNIDADES ===== */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            No tiene que existir una sola comunidad
          </h2>
          <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-10">
            No queremos que una única organización defina las reglas económicas para todo el mundo.
            Podrían existir muchas comunidades experimentales.
          </p>

          <TwoColumnLayout
            left={{
              title: 'COMUNIDAD A',
              icon: '🏛️',
              color: 'blue',
              children: (
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• sus propias CU</li>
                  <li>• sus reglas</li>
                  <li>• patrimonio propio</li>
                  <li>• su cultura y gremios</li>
                  <li>• su umbral de acceso</li>
                </ul>
              ),
            }}
            right={{
              title: 'COMUNIDAD B',
              icon: '🏛️',
              color: 'purple',
              children: (
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• otras CU</li>
                  <li>• otras reglas</li>
                  <li>• otro patrimonio</li>
                  <li>• otro mecanismo democrático</li>
                  <li>• su propio camino</li>
                </ul>
              ),
            }}
          />

          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
            <p className="text-gray-800 mb-3">
              Las comunidades podrían posteriormente intercambiar servicios, recursos y unidades
              entre ellas. Esto podría generar relaciones de intercambio similares conceptualmente a:
            </p>
            <p className="text-center text-xl font-bold text-gray-900 mb-3">
              MONEDA A ↔ MONEDA B
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900">
              <p>
                Pero NO afirmamos que CU sean monedas financieras ni que exista convertibilidad real.
                Es solamente una hipótesis futura de interoperabilidad.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ===== CAPITAL ===== */}
      <Section background="gray">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            ¿Por qué alguien aportaría capital?
          </h2>
          <p className="text-center text-gray-600 text-lg mb-10 max-w-3xl mx-auto">
            Decimos que necesitamos patrimonio colectivo, pero ¿cómo entra el capital de forma
            legítima y sostenible? No inventamos todavía una promesa financiera porque la estructura
            jurídica y económica no está definida.
          </p>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <p className="font-semibold text-gray-900 mb-4">
              Para que exista patrimonio colectivo necesitamos estudiar formas legítimas y sostenibles de captar capital:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                'Inversionistas', 'Donantes', 'Instituciones',
                'Vehículos financieros', 'Cooperativas', 'Sin fines de lucro',
                'Derecho societario', 'Impuestos', 'Fondos',
                'Estructuras híbridas',
              ].map((item) => (
                <div key={item} className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2 text-center">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-8 text-white mb-8">
            <p className="text-center text-blue-300 font-semibold text-lg mb-3">Pregunta para inversores:</p>
            <p className="text-center text-xl">
              ¿Podemos construir un vehículo que permita que capital privado contribuya a crear un
              patrimonio productivo de largo plazo y al mismo tiempo preserve la misión del sistema?
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register?category=inversion"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
            >
              QUIERO DISCUTIR ESTA PREGUNTA
            </Link>
            <Link
              href="#construir"
              className="border-2 border-gray-700 text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors text-center"
            >
              VER LOS PERFILES QUE BUSCAMOS
            </Link>
          </div>
        </div>
      </Section>

      {/* ===== LO QUE EXISTE HOY Y LO QUE TODAVÍA NO ===== */}
      <Section background="white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-red-700">
            Esto todavía no existe
          </h2>

          <TwoColumnLayout
            left={{
              title: 'HOY: estamos construyendo',
              icon: '🔨',
              color: 'green',
              children: (
                <ul className="space-y-2 text-gray-700">
                  <li>✓ Una primera comunidad</li>
                  <li>✓ Registro de colaboradores</li>
                  <li>✓ Gremios iniciales</li>
                  <li>✓ Proyectos de investigación</li>
                  <li>✓ Arquitectura conceptual</li>
                </ul>
              ),
            }}
            right={{
              title: 'MAÑANA, SI FUNCIONA',
              icon: '🔮',
              color: 'blue',
              children: (
                <p className="text-gray-700 text-sm">
                  Podríamos experimentar con:
                </p>
              ),
            }}
          />

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              'CU', 'Mercado interno', 'Gobernanza',
              'Patrimonio real', 'Mecanismos de acceso a recursos', 'Interoperabilidad',
            ].map((item) => (
              <div key={item} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center font-medium text-blue-800">
                {item}
              </div>
            ))}
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg mt-8">
            <p className="text-gray-800">
              No estamos manejando dinero ni entregando CU en este momento. No tenemos todas las
              respuestas. Precisamente por eso estamos buscando a las personas capaces de
              ayudarnos a descubrirlas.
            </p>
          </div>
        </div>
      </Section>

      {/* ===== QUÉ ESTAMOS CONSTRUYENDO AHORA ===== */}
      <Section background="gray">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">
            ¿Qué estamos construyendo ahora?
          </h2>
          <p className="text-center text-gray-600 text-lg max-w-3xl mx-auto mb-10">
            Primera comunidad + investigación. Si el concepto funciona, después experimentaremos
            con CU, gobernanza y patrimonio real.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: '👥', title: 'Comunidad', text: 'Reunir personas dispuestas a construir y experimentar esta hipótesis.' },
              { icon: '📚', title: 'Investigación', text: 'Economistas, abogados, sociólogos y tecnólogos estudiando las preguntas abiertas.' },
              { icon: '🔬', title: 'Experimentos', text: 'Probar mecanismos pequeños antes de cualquiera de mayor escala.' },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ===== BUSCAMOS CONSTRUCTORES ===== */}
      <Section background="white" id="construir">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Buscamos constructores
          </h2>
          <p className="text-center text-gray-600 text-lg mb-12 max-w-3xl mx-auto">
            No estamos buscando empleados. Estamos buscando personas capaces de aportar
            conocimiento, trabajo, crítica, capital o infraestructura. Cada perfil explica qué
            preguntas necesitamos resolver y en qué proyectos podrías participar.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {builders.map((b) => (
              <ProfessionalCard
                key={b.category}
                category={b.category}
                icon={b.icon}
                description={b.description}
                whyNeeded={b.whyNeeded}
                questions={b.questions}
                projects={b.projects}
                href={b.href}
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
        </div>
      </Section>

      {/* ===== OBJETIVO DE COMPRENSIÓN ===== */}
      <Section background="gray">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            ¿Entenderías esta idea para explicársela a otra persona?
          </h2>
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <p className="text-gray-300 text-sm mb-4">Así podría resumirse:</p>
            <div className="bg-gray-50 border-l-4 border-blue-500 rounded-r-lg p-6 text-gray-700 leading-relaxed">
              Están pensando qué pasa si la automatización reduce mucho la necesidad de empleo.
              En vez de intentar frenar la tecnología, quieren crear comunidades que acumulen
              patrimonio productivo. Dentro de esas comunidades las personas podrían intercambiar
              colaboración mediante unidades llamadas CU. Esas unidades servirían para organizar
              intercambios y registrar participación. Si el patrimonio produce recursos reales, la
              propia comunidad podría establecer mecanismos mediante los cuales cierto nivel de
              participación habilite acceso a parte de esos recursos. Todavía no saben exactamente
              cómo hacerlo y están reuniendo economistas, abogados, sociólogos, tecnólogos e
              inversores para diseñarlo y probarlo.
            </div>
            <p className="text-center text-gray-500 text-sm mt-4">
              Si esta página no te permite llegar fácilmente a esa explicación, todavía está demasiado abstracta.
            </p>
          </div>
        </div>
      </Section>

      {/* ===== INVITACIÓN FINAL ===== */}
      <Section background="dark">
        <div className="max-w-4xl mx-auto">
          <KeyPhrase
            text="El ideal sin poder no sirve. El poder sin ideal tampoco."
            variant="center"
          />
          <p className="text-center text-gray-300 text-lg mb-10 max-w-3xl mx-auto">
            <strong>El ideal</strong> es una comunidad donde el progreso tecnológico amplíe la
            autonomía humana. <strong>El poder</strong> es el capital, la infraestructura y las
            instituciones para hacerlo posible. Necesitamos construir ambos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors text-center"
            >
              QUIERO CONTRIBUIR
            </Link>
            <Link
              href="/login"
              className="bg-transparent border-2 border-gray-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors text-center"
            >
              YA SOY PARTE
            </Link>
            <Link
              href="/projects"
              className="bg-transparent border-2 border-gray-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors text-center"
            >
              VER PROYECTOS
            </Link>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
<p className="font-medium text-gray-300">
            Comunidad Post Singularidad - Explorando la transición económica frente a la automatización
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
