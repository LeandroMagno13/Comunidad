import type { Metadata } from 'next';
import Navbar from '@/src/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://comunidad-i86g.vercel.app'),
  title:
    'Comunidad Post Singularidad | Propiedad productiva participativa frente a la IA',
  description:
    'Laboratorio experimental sobre participación, capacidades humanas y automatización. Investigamos quién será propietario de la productividad que producen las máquinas y cómo una comunidad puede participar de ella siendo propietaria de una parte del capital productivo.',
  keywords: [
    'Inteligencia artificial',
    'automatización',
    'capital productivo',
    'propiedad productiva participativa',
    'propiedad compartida',
    'participación comunitaria',
    'post-singularidad',
    'futuro del trabajo',
  ],
  authors: [{ name: 'Comunidad Post Singularidad' }],
  openGraph: {
    title: 'Comunidad Post Singularidad | Capital productivo frente a la Automatización',
    description:
      'No esperes a que la IA produzca cada vez más riqueza para preguntarte quién será propietario de esa productividad. Investigamos si una comunidad puede participar de ella siendo propietaria de una parte del capital productivo.',
    url: 'https://comunidad-i86g.vercel.app/',
    siteName: 'Comunidad Post Singularidad',
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Comunidad Post Singularidad | Propiedad productiva participativa',
    description:
      'La pregunta no es solamente cómo distribuir la riqueza cuando las máquinas produzcan más. La pregunta es quién será propietario de esa productividad. Sumate al laboratorio institucional.',
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
                'Comunidad e instituto de investigación que estudia quién será propietario de la productividad que producen las máquinas y si una comunidad puede participar de ella siendo propietaria de una parte del capital productivo.',
              knowsAbout: [
                'Artificial Intelligence',
                'Productive Capital Ownership',
                'Shared Ownership',
                'Community Participation',
                'Future of Work',
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
