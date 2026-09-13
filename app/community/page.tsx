import Cartelera from '@/src/components/Cartelera';

export const metadata = {
  title: 'Comunidad | Comunidad Post Singularidad',
  description: 'Muro de la comunidad: información, solicitudes comunitarias y encuestas.',
};

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Comunidad</h1>
      <p className="mt-1 text-sm text-gray-600">
        Muro de la comunidad. Publicá tu participación: información para compartir, solicitudes
        comunitarias para contribuir o encuestas. Cuida el contenido: está sujeto a moderación.
      </p>
      <div className="mt-6">
        <Cartelera scope="community" />
      </div>
    </div>
  );
}