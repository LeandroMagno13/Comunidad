// =============================================================================
// RONDA G - SEC 2 (fuente): AGENTE INTERNO SUPER_ADMIN 24/7
//
// OBJETIVO (Lee.txt G sec 2): una identidad interna de la aplicacion, separada
// arquitectonicamente de los agentes externos, que corre 24/7 para consultar
// bandejas internas: notificaciones, mensajes, posts, solicitudes y polls;
// preparada para el ciclo horario y la posterior integracion con Telegram.
//
// REGLA DE ORO (Lee.txt G sec 2, explicita): el agente interno NO es una
// "puerta trasera" de SUPER_ADMIN. Es identidad de agente explicita,
// auditable y revocable, aunque tecnologicamente posea privilegios
// administrativos. Por eso este modulo:
//   - No hardcodea el token: lo lee SOLO de process.env (ENV/secret).
//   - Nunca lo expone al frontend, API publica, logs ni documentacion.
//   - Pasa SIEMPRE por la membrana (decideMembrane), igual que cualquier
//     otro agente: INTERNAL no escala por la API publica a SUPER_ADMIN.
//   - MEMBRANE_PERMISSIONS NO contiene SUPER_ADMIN_IS_PUBLICO:
//     SUPER_ADMIN_PERMISSION es la constante elevada, y NO es autorizable
//     como permiso de la membrana publica (isMembranePermission la rechaza).
//   - Cada consulta de una bandeja se registra en el action log (trace).
//
// Esto es identidad explicita y trazable, no un atajo.
// =============================================================================
import {
  AgentIdentity,
  AgentKind,
  AgentStore,
  AgentTokenRecord,
  MEMBRANE_PERMISSIONS,
  MembraneIntent,
  MembraneRateLimiter,
  SUPER_ADMIN_PERMISSION,
  decideMembrane,
  hasPermissions,
  isMembranePermission,
  membraneKindFor,
  newAgentTokenPrefix,
  newAgentTokenValue,
  verifyAgentToken,
  hashAgentToken,
} from './engine';
import * as fs from 'fs';
import * as path from 'path';

export interface InternalSuperAdminConfig {
  agentId: string;
  kind: AgentKind;
  permissions: string[];
  cycleHours: number; // 24/7 = ciclo cada 1 hora (24/7)
  trayKinds: TrayKind[];
}

export interface InternalTrayOutcome {
  tray: TrayKind;
  consultado: boolean;
  reason: string;
  statusCode: number;
  trace: { userId: string; agentId: string; kind: AgentKind; ts: string };
}

export interface InternalCycleOutcome {
  authorizado: boolean;
  trays: InternalTrayOutcome[];
  decisionsLog: { agentId: string; action: string; ts: string }[];
}

export interface InternalCycleConfig {
  token: string; // SOLO desde ENV: AGENT_SUPER_ADMIN_INTERNAL_TOKEN
  tokenSecret: string; // SOLO desde ENV: AGENT_TOKEN_SECRET
  agentId: string; // SOLO desde ENV: AGENT_SUPER_ADMIN_INTERNAL_AGENT_ID
  trays: TrayKind[]; // bandejas que consulta en cada ciclo
  cycleHours: number; // cada cuantas horas (24/7)
}

// Bandejas internas que Lee.txt encomienda consultar al agente interno.
export type TrayKind =
  | 'notificaciones'
  | 'mensajes'
  | 'posts'
  | 'solicitudes'
  | 'polls';

export const INTERNAL_TRAY_KINDS: TrayKind[] = [
  'notificaciones',
  'mensajes',
  'posts',
  'solicitudes',
  'polls',
];

export const SUPER_ADMIN_DENIED_PUBLIC_PERMISSION = SUPER_ADMIN_PERMISSION;

// construir la identidad del agente interno a partir de ENV (nunca hardcodeada)
export function internalSuperAdminIdentityFromEnv(env: NodeJS.ProcessEnv): AgentIdentity {
  const agentId = env.AGENT_SUPER_ADMIN_INTERNAL_AGENT_ID || 'agt_super_admin_internal';
  const kind: AgentKind = 'INTERNAL';
  return {
    agentId,
    name: 'Agente Interno Super Admin',
    kind,
    ownerUserId: 'system', // identidad del sistema, no de un humano
    permissions: [...MEMBRANE_PERMISSIONS],
    status: 'active',
    createdAt: new Date((env.AGENT_SUPER_ADMIN_INTERNAL_CREATED_AT || '2026-01-01T00:00:00.000Z')).toISOString(),
    lastUsedAt: null,
  };
}