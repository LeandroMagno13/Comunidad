// Auditoría de acciones sensibles.
// Registra en AgentActionLog cuando hay usuario y agente asociados,
// y siempre deja traza en consola del servidor (sin secretos).
// No expone tokens, passwords ni hashes.

import { db } from '@/src/lib/db';

interface AuditInput {
  userId?: string | null;
  agentId?: string | null;
  action: string;
  endpoint: string;
  method: string;
  statusCode: number;
  ip?: string | null;
  extra?: string | null;
}

function sanitizeExtra(extra: string | null | undefined): string | null {
  if (!extra) return null;
  // Elimina posibles secretos si alguien pasa un payload sin sanear.
  return extra
    .replace(/"password"\s*:\s*"[^"]*"/gi, '"password":"[redacted]"')
    .replace(/"token"\s*:\s*"[^"]*"/gi, '"token":"[redacted]"')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [redacted]')
    .slice(0, 2000);
}

export async function audit(input: AuditInput): Promise<void> {
  const safeExtra = sanitizeExtra(input.extra ?? null);

  // Traza en consola (sin secretos)
  console.log(
    JSON.stringify({
      evt: 'audit',
      action: input.action,
      endpoint: input.endpoint,
      method: input.method,
      statusCode: input.statusCode,
      userId: input.userId ?? null,
      agentId: input.agentId ?? null,
      at: new Date().toISOString(),
    })
  );

  // Persistencia solo si hay usuario y agente (modelo AgentActionLog lo exige).
  if (!input.userId || !input.agentId) return;
  try {
    await db.agentActionLog.create({
      data: {
        userId: input.userId,
        agentId: input.agentId,
        action: input.action,
        endpoint: input.endpoint,
        method: input.method,
        statusCode: input.statusCode,
        ip: input.ip ?? null,
        extra: safeExtra,
      },
    });
  } catch (error) {
    // La auditoría nunca debe romper el flujo principal.
    console.error('audit: no se pudo persistir el log', error);
  }
}
