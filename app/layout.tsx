import type { Metadata } from 'next';
import Navbar from '@/src/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://comunidad-i86g.vercel.app'),
  title: 'Comunidad Post Singularidad | Propiedad Colectiva frente a la IA',
  description:
    'Laboratorio experimental sobre participación, capacidades humanas, automatización y propiedad colectiva del capital. Una alternativa a la Renta Básica Universal frente al desplazamiento laboral por la Inteligencia Artificial.',
  keywords: [
    'Inteligencia artificial',
    'desempleo tecnológico',
    'reemplazo laboral IA',
    'alternativas renta básica universal',
    'Universal Basic Assets',
    'UBI',
    'propiedad colectiva',
    'post-singularidad',
    'capital productivo',
    'futuro del trabajo',
  ],
  authors: [{ name: 'Comunidad Post Singularidad' }],
  openGraph: {
    title: 'Comunidad Post Singularidad | Capital frente a la Automatización',
    description:
      'No esperes a que la IA desplace el trabajo. Construyamos juntos un patrimonio común de inversión y experimentemos con la distribución post-escasez.',
    url: 'https://comunidad-i86g.vercel.app/',
    siteName: 'Comunidad Post Singularidad',
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Comunidad Post Singularidad | Propiedad Colectiva',
    description:
      'Frente al avance de la inteligencia artificial, construir capital productivo es la mejor defensa. Sumate al laboratorio institucional.',
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
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Comunidad Post Singularidad',
              url: 'https://comunidad-i86g.vercel.app/',
              description:
                'Comunidad e instituto de investigación orientado a resolver el desempleo tecnológico causado por la inteligencia artificial mediante la construcción de propiedad colectiva y activos básicos (Universal Basic Assets).',
              knowsAbout: [
                'Technological Unemployment',
                'Artificial Intelligence',
                'Universal Basic Income',
                'Collective Ownership',
                'Post-Scarcity Economy',
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
