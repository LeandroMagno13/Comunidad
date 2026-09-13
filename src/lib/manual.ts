// ============================================================================
// MANUAL DE USO — VERSIÓN DEL SISTEMA
//
// Cada actualización del manual debe: 1) subir MANUAL_VERSION, 2) agregar una
// entrada a MANUAL_CHANGELOG, 3) avisar a los usuarios con el botón del panel
// de administración (crea una notificación para todos). La UI del manual y el
// panel admin leen estas constantes; nunca duplicar la versión en el texto.
// ============================================================================

export const MANUAL_VERSION = '1.4.0';

export const MANUAL_UPDATED_AT = '2026-09-13';

export interface ManualChange {
  version: string;
  date: string;
  title: string;
  notes: string[];
}

export const MANUAL_CHANGELOG: ManualChange[] = [
  {
    version: '1.4.0',
    date: '2026-09-13',
    title: 'Framing: propiedad productiva participativa',
    notes: [
      'El sistema se presenta como una investigación sobre quién será propietario de la productividad que producen las máquinas y cómo una comunidad puede participar de ella siendo propietaria de una parte del capital productivo.',
      'La pregunta de partida deja de ser cómo redistribuir la riqueza: pasa a ser quién será propietario de la productividad. PostSingular estudia propiedad del capital productivo, no una alternativa de renta básica ni un mecanismo de reparto.',
      'Se aclara que la propiedad compartida investigada no reemplaza la propiedad individual y que participar no significa pertenecer exclusivamente.',
      'Las CU siguen siendo señales de participación (no dinero, no patrimonio), y la participación en rendimientos (distribución) queda explícitamente como una cuestión posterior. No hubo cambios funcionales: solo comunicación y terminología.',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-09-13',
    title: 'Publicaciones con formato enriquecido (aspecto de foro)',
    notes: [
      'Las publicaciones del muro y de los gremios admiten formato enriquecido con controles simples: titulares (H1–H3), negrita, cursiva, subrayado, tachado, listas, citas, bloques de código, separadores y enlaces.',
      'Nada se escribe a mano en código: el editor solo guarda un subconjunto acotado y todo lo que entra se sanea (whitelist) al guardar y al mostrar.',
      'El detalle de publicación adopta el aspecto de un foro: autor con avatar, cabecera del hilo y cuerpo tipográfico; los listados muestran un anticipo del contenido.',
    ],
  },
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