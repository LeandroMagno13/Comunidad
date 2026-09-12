// ============================================================================
// MANUAL DE USO — VERSIÓN DEL SISTEMA
//
// Cada actualización del manual debe: 1) subir MANUAL_VERSION, 2) agregar una
// entrada a MANUAL_CHANGELOG, 3) avisar a los usuarios con el botón del panel
// de administración (crea una notificación para todos). La UI del manual y el
// panel admin leen estas constantes; nunca duplicar la versión en el texto.
// ============================================================================

export const MANUAL_VERSION = '1.0.0';

export const MANUAL_UPDATED_AT = '2026-09-12';

export interface ManualChange {
  version: string;
  date: string;
  title: string;
  notes: string[];
}

export const MANUAL_CHANGELOG: ManualChange[] = [
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