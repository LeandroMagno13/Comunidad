import Link from 'next/link';

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
  {
    category: '🔬 Ciencia',
    description: 'Aportar método, evidencia y pensamiento crítico.',
    whyNeeded:
      'Incorporar rigor científico a las decisiones comunitarias: hipótesis, experimentación, medición de resultados.',
    href: '/register?category=ciencia',
  },
  {
    category: '🎨 Diseño',
    description: 'Diseñar experiencias, interfaces y comunicación visual.',
    whyNeeded:
      'Crear una experiencia de usuario clara, accesible y coherente con los valores de la comunidad.',
    href: '/register?category=diseno',
  },
  {
    category: '📝 Comunicación',
    description: 'Comunicar ideas complejas de forma clara y honesta.',
    whyNeeded:
      'Traducir conceptos técnicos, económicos y filosóficos a lenguaje accesible para toda la comunidad.',
    href: '/register?category=comunicacion',
  },
  {
    category: '🏗️ Ingeniería',
    description: 'Construir sistemas, infraestructura y soluciones técnicas.',
    whyNeeded:
      'Desarrollar las herramientas técnicas que permitan operar la comunidad y escalar sus sistemas.',
    href: '/register?category=ingenieria',
  },
  {
    category: '📚 Educación',
    description: 'Diseñar procesos de aprendizaje y transmisión de conocimiento.',
    whyNeeded:
      'Crear mecanismos para que el conocimiento fluya entre miembros y generaciones de la comunidad.',
    href: '/register?category=educacion',
  },
  {
    category: '🌱 Sostenibilidad',
    description: 'Pensar el impacto ambiental y la viabilidad a largo plazo.',
    whyNeeded:
      'Asegurar que las decisiones comunitarias consideren la sostenibilidad ambiental y económica.',
    href: '/register?category=sostenibilidad',
  },
];

export default function GuildCategories() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {guilds.map((guild) => (
        <Link
          key={guild.category}
          href={guild.href}
          className="group p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {guild.category}
          </h3>
          <p className="mt-2 text-sm text-gray-600">{guild.description}</p>
          <p className="mt-3 text-xs text-gray-500">{guild.whyNeeded}</p>
        </Link>
      ))}
    </div>
  );
}
