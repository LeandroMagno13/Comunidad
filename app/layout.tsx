import type { Metadata } from 'next';
import Navbar from '@/src/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.postsingular.org'),
  alternates: {
    canonical: '/',
    types: {
      'application/atom+xml': '/feed.atom',
      'application/rss+xml': '/feed.xml',
    },
  },
  title: 'Comunidad Post Singularidad | Propiedad productiva participativa frente a la IA',
  description:
    '¿Te preocupa el futuro del trabajo frente a la IA? Somos una comunidad que investiga cómo construir, entre todos, una forma de participar de lo que las máquinas producen. No es una criptomoneda ni un fondo de inversión: es un laboratorio experimental de propiedad compartida.',
  keywords: [
    'futuro del trabajo',
    'inteligencia artificial y empleo',
    'automatización y trabajo',
    'incertidumbre laboral',
    'capital productivo',
    'propiedad compartida',
    'comunidad',
    'post-singularidad',
    'participación comunitaria',
    'economía colaborativa',
    'trabajo y IA',
    'propiedad productiva participativa',
  ],
  authors: [{ name: 'Comunidad Post Singularidad' }],
  openGraph: {
    title: 'Comunidad Post Singularidad | Construyamos una alternativa frente a la IA',
    description:
      '¿Y si tu trabajo deja de ser la única opción? Somos personas que nos organizamos para construir, entre todos, una forma de participar de lo que las máquinas producen. Sumate al laboratorio.',
    url: 'https://www.postsingular.org/',
    siteName: 'Comunidad Post Singularidad',
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Comunidad Post Singularidad | Propiedad productiva participativa',
    description:
      'No esperes a que la IA produzca cada vez más riqueza para preguntarte quién será propietario de esa productividad. Sumate al laboratorio comunitario.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué es Comunidad Post Singularidad?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Es un laboratorio experimental donde personas se organizan colectivamente para construir un patrimonio común de inversión y estudiar cómo la comunidad puede participar de sus rendimientos. No es una empresa, no es un gobierno y no es una criptomoneda.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Es una criptomoneda o criptoactivo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Las CU (Community Units) no son dinero, no tienen valor monetario y no se negocian. Son señales experimentales de participación dentro de la comunidad.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Es un fondo de inversión?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No todavía. Es un laboratorio de investigación. Hoy no se reciben fondos ni se prometen rendimientos. La estructura jurídica está siendo diseñada por especialistas.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Prometen rentabilidad?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. No ofrecen inversión, no prometen dividendos, retorno garantizado ni convertibilidad. Es un experimento comunitario sin fines de lucro.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Puedo participar sin conocimientos técnicos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. La comunidad es para personas de todos los perfiles. No se requiere conocimiento técnico ni financiero. Lo importante es la curiosidad y las ganas de construir.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo participo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '1. Registrás tu perfil en postsingular.org/register 2. Declarás tus capacidades y disponibilidad 3. Te sumás a un gremio (derecho, finanzas, tecnología, sociología, etc.) 4. Participás en la comunidad.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué son las CU?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Unidad experimental de participación interna. No son dinero, no determinan cuánto patrimonio tiene la comunidad, y no se conectan automáticamente con rendimientos.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Es gratuito registrarse?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. La participación es voluntaria y gratuita en esta etapa.',
      },
    },
  ],
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Comunidad Post Singularidad',
  url: 'https://www.postsingular.org/',
  description:
    'Comunidad e instituto de investigación que estudia quién será propietario de la productividad que producen las máquinas y si una comunidad puede participar de ella siendo propietaria de una parte del capital productivo.',
  knowsAbout: [
    'Artificial Intelligence',
    'Future of Work',
    'Productive Capital Ownership',
    'Shared Ownership',
    'Community Participation',
    'Automation',
  ],
  sameAs: [],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        <Navbar />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqJsonLd),
          }}
        />
      </body>
    </html>
  );
}
