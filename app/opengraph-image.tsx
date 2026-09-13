import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Comunidad Post Singularidad | Propiedad productiva participativa';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0f172a',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
          border: '1px solid #1e293b',
        }}
      >
        {/* Fondo con plano sutil */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#0b1220',
            opacity: 0.35,
          }}
        />

        {/* Encabezado / Badge */}
        <div style={{ display: 'flex', alignItems: 'center', zIndex: 10 }}>
          <div
            style={{
              backgroundColor: 'rgba(37, 99, 235, 0.2)',
              border: '1px solid #2563eb',
              color: '#60a5fa',
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '18px',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}
          >
            LABORATORIO DE INVESTIGACIÓN INSTITUCIONAL
          </div>
        </div>

        {/* Cuerpo Principal */}
        <div style={{ display: 'flex', flexDirection: 'column', zIndex: 10 }}>
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 800,
              color: '#ffffff',
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            Comunidad Post Singularidad
          </h1>
          <p
            style={{
              fontSize: '32px',
              fontWeight: 600,
              color: '#60a5fa',
              marginTop: '20px',
              marginBottom: 0,
            }}
          >
            ¿Quién será propietario de la productividad que producen las máquinas?
          </p>
          <p
            style={{
              fontSize: '22px',
              color: '#94a3b8',
              marginTop: '16px',
              maxWidth: '900px',
              lineHeight: 1.4,
            }}
          >
            Investigamos si una comunidad puede participar de esa productividad siendo propietaria
            de una parte del capital productivo que la genera.
          </p>
        </div>

        {/* Pie de imagen */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #1e293b',
            paddingTop: '24px',
            zIndex: 10,
          }}
        >
          <span style={{ color: '#cbd5e1', fontSize: '18px', fontWeight: 500 }}>
            Propiedad productiva participativa
          </span>
          <span style={{ color: '#64748b', fontSize: '18px' }}>
            comunidadpostsingularidad.org
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}