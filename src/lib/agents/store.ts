// =============================================================================
// ADAPTADOR PRISMA DE LA MEMBRANA DE AGENTES (RONDA F)
//
// Implementa la interfaz `AgentStore` del motor puro (src/lib/agents/engine.ts)
// sobre la BD Postgres de PostSingular. La app usa ESTA capa para persistir
// agentes, tokens y trazabilidad; los tests standalone (Test M) usan el motor
// puro con un store en memoria. Así el motor se prueba sin BD y la app se
// ejecuta contra la BD real sin duplicar lógica.
//
// ADITIVO: no modifica ningún modelo de Rondas C/D/E. Solo crea/consulta las
// tablas de la membrana (Agent, AgentToken, AgentActionLog) añadidas al schema.
// =============================================================================

import { db } from '@/src/lib/db';
import type {
  AgentActionLog,
  AgentIdentity,
  AgentKind,
  AgentStore,
  AgentTokenRecord,
  MembranePermission,
} from './engine';

// -----------------------------------------------------------------------------
// Hash del token: se reutiliza el hash del motor (HMAC-SHA256 con secreto del
// entorno). Nunca se guarda el token en claro; solo hash + prefijo.
// -----------------------------------------------------------------------------

export const prismaAgentStore: AgentStore = {
  getAgentById: async (agentId: string) => {
    const agent = await db.agent.findUnique({
      where: { id: agentId },
      include: { owner: { select: { id: true, name: true, role: true } } },
    });
    if (!agent) return null;
    return toIdentity(agent);
  },

  getAgentTokenByHash: async (tokenHash: string) => {
    const token = await db.agentToken.findUnique({
      where: { hash: tokenHash },
      include: { agent: true },
    });
    if (!token) return null;
    return {
      id: token.id,
      agentId: token.agentId,
      tokenHash: token.hash,
      prefix: token.prefix,
      createdAt: token.createdAt.toISOString(),
      lastUsedAt: token.lastUsedAt?.toISOString() ?? null,
      revokedAt: token.revokedAt?.toISOString() ?? null,
      expiresAt: token.expiresAt?.toISOString() ?? null,
    };
  },

  logAction: async (entry) => {
    const log = await db.agentActionLog.create({
      data: {
        userId: entry.userId,
        agentId: entry.agentId,
        action: entry.action,
        endpoint: entry.endpoint,
        method: entry.method,
        statusCode: entry.statusCode,
        ip: entry.ip,
        extra: entry.extra,
      },
    });
    return {
      id: log.id,
      userId: log.userId,
      agentId: log.agentId,
      action: log.action,
      endpoint: log.endpoint,
      method: log.method,
      statusCode: log.statusCode,
      ip: log.ip,
      extra: log.extra,
      createdAt: log.createdAt.toISOString(),
    };
  },

  recordTokenUse: async (tokenId: string) => {
    await db.agentToken.update({
      where: { id: tokenId },
      data: { lastUsedAt: new Date() },
    });
  },
};

function toIdentity(agent: any): AgentIdentity | null {
  return {
    agentId: agent.id,
    name: agent.name,
    kind: agent.kind,
    ownerUserId: agent.ownerId,
    permissions: agent.permissions ?? [],
    status: agent.status ?? 'active',
    createdAt: agent.createdAt.toISOString(),
    lastUsedAt: agent.lastUsedAt?.toISOString() ?? null,
  };
}

// -----------------------------------------------------------------------------
// Helpers de autorización para la app: crean/verifican agentes y tokens.
// -----------------------------------------------------------------------------

export type { AgentIdentity, AgentKind, AgentStore, AgentActionLog, AgentTokenRecord, MembranePermission };
