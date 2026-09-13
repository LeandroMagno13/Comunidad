// ============================================================================
// MANUAL DE USO — VERSIÓN DEL SISTEMA
//
// Cada actualización del manual debe: 1) subir MANUAL_VERSION, 2) agregar una
// entrada a MANUAL_CHANGELOG, 3) avisar a los usuarios con el botón del panel
// de administración (crea una notificación para todos). La UI del manual y el
// panel admin leen estas constantes; nunca duplicar la versión en el texto.
// ============================================================================

export const MANUAL_VERSION = '1.2.0';

export const MANUAL_UPDATED_AT = '2026-09-13';

export interface ManualChange {
  version: string;
  date: string;
  title: string;
  notes: string[];
}

export const MANUAL_CHANGELOG: ManualChange[] = [
  {
    version: '1.2.0',
    date: '2026-09-13',
    title: 'Herramientas de gestión de gremios: representantes y encuestas',
    notes: [
      'Cada gremio puede elegir uno o varios representantes entre sus miembros activos; los representantes llevan identificatorio (distintivo «Representante»).',
      'Se pueden crear encuestas internas de cada gremio y encuestas generales de la comunidad, con opciones y un enlace opcional a la publicación referida.',
      'Los resultados quedan registrados y consultables con trazabilidad: cada voto conserva usuario, opción y fecha.',
      'Los representantes solo pueden ser designados por el creador o admin del gremio; las encuestas internas solo las crean y votan miembros activos del gremio.',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-09-12',
    title: 'RONDA D: presupuesto de urgencia y piso de dignidad',
    notes: [
      'La «apuesta de prioridad» con CU se reemplaza por un presupuesto de urgencia periódico, no acumulable y con costo cuadrático (1→1, 2→4, 3→9).',
      'Al satisfacer una solicitud de capacidad ya no se transfieren CU: el proveedor sube su nivel por contribución verificada.',
      'El indicador principal deja de ser la concentración relativa (Gini) y pasa a ser el piso de dignidad: cuántos quedan debajo del piso y cuánto les falta (headcount + brecha), con un umbral operativo provisional.',
      'Se actualizan el bloque de bienvenida, los niveles de acceso y el panel de administración del manual.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-09-12',
    title: 'Primera edición del manual de uso',
    notes: [
      'Se explica qué es esta versión (RONDA C) y que se trata de un laboratorio.',
      'Se documentan los pasos para participar: registro, CU de bienvenida, solicitudes, oferta de capacidades y gremios.',
      'Se explican los niveles de acceso (básico / medio / avanzado) y qué acciones los modifican.',
      'Se aclara de dónde salen las CU y cómo circulan (sin pasar por dinero).',
      'Se documentan los controles del panel de administración («Economía CU») y qué hace cada uno.',
    ],
  },
];