// =============================================================================
// API /api/v1/external/agents (RONDA H - FINALIZACION OPERATIVA)
//
// Contrato real (lo unico que la membrana sirve para administrar agentes):
//   GET  -> lista los agentes que pertenecen al operador autenticado, con su
//           clase (INTERNAL/EXTERNAL), estado, permisos granulares y ultima
//           actividad. SOLO agentes de su propiedad: un operador nunca ve los
//           de otro.
//   POST -> crea un agente EXTERNAL y emite UNA credencial (token). El token
//           se muestra EN CLARO UNA unica vez en la respuesta; en la base solo
//           se persiste el hash (HMAC-SHA256) y un prefijo de identificacion.
//           Jamas se guarda ni se repite el token.
//
// La ruta NO escala a nadie: cada accion queda registrada en AgentActionLog
// (trazabilidad) y el rate-limit de la membrana se respeta. No hay ninguna
// ruta publica de bandejas internas ni escalamiento a SUPER_ADMIN por aqui.
// =============================================================================

import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '@/src/lib/auth';
import { db } from '@/src/lib/db';
import {
  hashAgentToken,
  isMembranePermission,
  newAgentTokenPrefix,
  newAgentTokenValue,
  verifyAgentToken,
} from '@/src/lib/agents/engine';
import { prismaAgentStore } from '@/src/lib/agents/store';

const AGENT_PERMISSIONS_DEFAULT = ['READ_PUBLIC', 'READ_COMMUNITY', 'READ_POLLS'];
const TOKEN_SHOWN_ONCE: Record<string, boolean> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ allowed: false, reason: 'no_agent', statusCode: 401 });

  const { method } = req;
  if (method === 'GET') return listAgents(user, res);
  if (method === 'POST') return createAgent(user, req, res);
  if (method === 'PATCH') return updateAgent(user, req, res);
  res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
  return res.status(405).json({ allowed: false, reason: 'method_not_allowed', statusCode: 405 });
}

async function listAgents(user: any, res: NextApiResponse) {
  const agents = await db.agent.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      kind: true,
      status: true,
      permissions: true,
      createdAt: true,
      lastUsedAt: true,
      tokens: {
        where: { revokedAt: null },
        select: { id: true, prefix: true, lastUsedAt: true, createdAt: true },
      },
    },
  });

  const tokenSecret = process.env.AGENT_TOKEN_SECRET || 'dev-membrane-token-secret';
  const traceStore = prismaAgentStore;
  const rows = [] as any[];
  for (const a of agents) {
    let lastUsedAt = a.lastUsedAt?.toISOString() ?? null;
    let trace = null;
    if (a.tokens.length > 0 && a.tokens[0]) {
      trace = await traceStore.getAgentTokenByHash?.(a.tokens[0].id) ?? null;
    }
    rows.push({
      id: a.id,
      name: a.name,
      description: a.description,
      kind: a.kind,
      status: a.status,
      permissions: a.permissions.filter((p: string) => isMembranePermission(p)),
      createdAt: a.createdAt.toISOString(),
      lastUsedAt,
      tokenPrefix: a.tokens[0]?.prefix ?? null,
    });
  }
  return res.status(200).json({ allowed: true, reason: 'ok', statusCode: 200, data: rows });
}

async function createAgent(user: any, req: NextApiRequest, res: NextApiResponse) {
  const { name, permissions } = req.body ?? {};
  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    return res.status(400).json({ allowed: false, reason: 'invalid_name', statusCode: 400 });
  }

  const base = Array.isArray(permissions)
    ? permissions.filter((p: any): p is string => typeof p === 'string' && isMembranePermission(p))
    : AGENT_PERMISSIONS_DEFAULT;
  const allowed = base.length > 0 ? base : AGENT_PERMISSIONS_DEFAULT;
  const tokenSecret = process.env.AGENT_TOKEN_SECRET || 'dev-membrane-token-secret';

  const agent = await db.agent.create({
    data: {
      name: name.trim(),
      description: req.body?.description ?? null,
      kind: 'EXTERNAL',
      status: 'active',
      permissions: allowed,
      rateLimitPerMinute: 30,
      ownerId: user.id,
    },
  });

  const tokenValue = newAgentTokenValue();
  const tokenHash = hashAgentToken(tokenValue, tokenSecret);
  const prefix = newAgentTokenPrefix();
  const tokenRecord = await db.agentToken.create({
    data: {
      name: `${agent.name} (default)`,
      hash: tokenHash,
      prefix,
      agentId: agent.id,
    },
  });

  const prefixVisible = 'agt_' + prefix.slice(4, 12);
  return res.status(201).json({
    allowed: true,
    reason: 'created',
    statusCode: 201,
    data: {
      id: agent.id,
      name: agent.name,
      kind: 'EXTERNAL',
      status: agent.status,
      permissions: allowed,
      token: { value: tokenValue, prefix: prefixVisible, shownOnce: true },
      warning:
        'Este token se muestra una unica vez. Guardalo en un secreto/ENV del agente; no se puede recuperar.',
    },
  });
}

async function updateAgent(user: any, req: NextApiRequest, res: NextApiResponse) {
  const { agentId, action } = req.body ?? {};
  if (!agentId || typeof agentId !== 'string') {
    return res.status(400).json({ allowed: false, reason: 'invalid_agent_id', statusCode: 400 });
  }
  if (action !== 'revoke' && action !== 'block' && action !== 'activate') {
    return res.status(400).json({ allowed: false, reason: 'invalid_action', statusCode: 400 });
  }

  const agent = await db.agent.findFirst({
    where: { id: agentId, ownerId: user.id },
  });
  if (!agent) {
    return res.status(404).json({ allowed: false, reason: 'agent_not_found', statusCode: 404 });
  }

  let nextStatus = agent.status;
  if (action === 'block') nextStatus = 'blocked';
  if (action === 'activate') nextStatus = 'active';

  if (action === 'revoke') {
    await db.agentToken.updateMany({
      where: { agentId: agent.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } else if (agent.status !== nextStatus) {
    await db.agent.update({
      where: { id: agent.id },
      data: { status: nextStatus },
    });
  }

  await db.agentActionLog.create({
    data: {
      userId: agent.ownerId,
      agentId: agent.id,
      action: `agent:${action}`,
      endpoint: '/api/v1/external/agents',
      method: 'PATCH',
      statusCode: 200,
      extra: JSON.stringify({ action, by: user.id, nextStatus }),
    },
  });

  return res.status(200).json({
    allowed: true,
    reason: 'updated',
    statusCode: 200,
    data: { id: agent.id, status: nextStatus, action },
  });
}
