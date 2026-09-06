import type { Metadata } from 'next';
import Navbar from '@/src/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Comunidad Post Singularidad',
  description: 'Explorando la transición económica frente a la automatización y la IA. Construyendo colectivamente capital productivo para autonomía económica.',
  keywords: ['capital humano', 'automatización', 'IA', 'economía', 'comunidad', 'cooperación', 'capital productivo'],
  authors: [{ name: 'Comunidad Post Singularidad' }],
  openGraph: {
    title: 'Comunidad Post Singularidad',
    description: '¿Qué pasa cuando el trabajo deja de ser necesario? Estamos explorando una respuesta: construir colectivamente el capital que permita participar de la productividad.',
    type: 'website',
    locale: 'es_ES',
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
      </body>
    </html>
  );
}
