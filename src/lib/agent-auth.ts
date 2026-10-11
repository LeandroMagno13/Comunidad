// Autenticación de agentes EXTERNAL en endpoints privados de LECTURA.
// (Vinculación bot ↔ usuario: el bot consulta notificaciones y mensajes del
// dueño usando el token de agente que el propio dueño le concedió.)
//
// Reglas (contrato AGENTS.md, membrana RONDA F):
// - Solo Bearer con token de agente válido (hash HMAC, no revocado ni
//   expirado, agente activo). La sesión JWT sigue funcionando como siempre.
// - Solo LECTURA (GET): el bot personal nunca escribe (no PATCH/POST/DELETE).
// - Permiso granular exigido por endpoint (READ_NOTIFICATIONS, READ_MESSAGES).
// - Cada acceso queda trazado (AgentActionLog) + lastUsedAt actualizado.
// - El token NUNCA se loguea ni se devuelve en respuestas.

import { NextApiRequest } from 'next';
import {
  hasPermissions,
  verifyAgentToken,
  type AgentIdentity,
  type MembranePermission,
} from '@/src/lib/agents/engine';
import { prismaAgentStore } from '@/src/lib/agents/store';

function getTokenSecret(): string {
  // Mismo secreto que la emisión (agents.ts): en producción va por ENV.
  return process.env.AGENT_TOKEN_SECRET || 'dev-membrane-token-secret';
}

function getBearerToken(req: NextApiRequest): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7).trim();
    return token || null;
  }
  return null;
}

export interface AgentAuth {
  identity: AgentIdentity;
  ownerUserId: string;
  tokenId: string;
}

export async function getAgentAuthFromRequest(
  req: NextApiRequest
): Promise<AgentAuth | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  try {
    const verified = await verifyAgentToken(token, prismaAgentStore, {
      tokenSecret: getTokenSecret(),
    });
    if (!verified) return null;
    return {
      identity: verified.identity,
      ownerUserId: verified.identity.ownerUserId,
      tokenId: verified.token.id,
    };
  } catch {
    return null;
  }
}

export function agentHasPermission(
  auth: AgentAuth,
  required: MembranePermission
): boolean {
  return hasPermissions(auth.identity, [required]);
}

// Traza el acceso del agente (sin secretos en `extra`).
export async function traceAgentAccess(input: {
  auth: AgentAuth;
  action: string;
  endpoint: string;
  method: string;
  statusCode: number;
  ip?: string | null;
}): Promise<void> {
  try {
    await prismaAgentStore.logAction({
      userId: input.auth.ownerUserId,
      agentId: input.auth.identity.agentId,
      action: input.action,
      endpoint: input.endpoint,
      method: input.method,
      statusCode: input.statusCode,
      ip: input.ip ?? null,
      extra: null,
    });
    await prismaAgentStore.recordTokenUse(input.auth.tokenId);
  } catch (error) {
    // La traza nunca rompe el flujo principal.
    console.error('agent-auth: no se pudo trazar el acceso', error);
  }
}

function clientIp(req: NextApiRequest): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) {
    return forwarded.split(',')[0]?.trim() ?? null;
  }
  return null;
}

// Helper para endpoints GET privados: sesión JWT primero, si no hay,
// agente con el permiso requerido. Devuelve el userId efectivo o null.
// Solo lectura: el llamante debe rechazar otros métodos antes.
export async function getReaderUserId(
  req: NextApiRequest,
  opts: { permission: MembranePermission; action: string; endpoint: string }
): Promise<{ userId: string; via: 'session' | 'agent' } | null> {
  // 1) Sesión JWT (comportamiento existente, sin cambios).
  const { getUserFromRequest } = await import('@/src/lib/auth');
  const sessionUser = await getUserFromRequest(req);
  if (sessionUser) {
    return { userId: sessionUser.id, via: 'session' };
  }

  // 2) Token de agente con permiso granular.
  const auth = await getAgentAuthFromRequest(req);
  if (!auth || !agentHasPermission(auth, opts.permission)) {
    return null;
  }
  await traceAgentAccess({
    auth,
    action: opts.action,
    endpoint: opts.endpoint,
    method: req.method ?? 'GET',
    statusCode: 200,
    ip: clientIp(req),
  });
  return { userId: auth.ownerUserId, via: 'agent' };
}
