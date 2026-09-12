import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest, isModerator } from '@/src/lib/auth';
import { createCapacityRequest, satisfyCapacityRequest } from '@/src/lib/capacity';
import { db } from '@/src/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  if (req.method === 'GET') {
    const as = req.query.as === 'provider' ? 'provider' : 'asker';
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const where =
      as === 'provider'
        ? { providerId: user.id, ...(status ? { status } : {}) }
        : { askerId: user.id, ...(status ? { status } : {}) };
    const requests = await db.capacityRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { capacity: { select: { slug: true, name: true } }, provider: { select: { name: true } } },
    });
    return res.status(200).json({ solicitudes: requests });
  }

  if (req.method === 'POST') {
    const { action, capacitySlug, intensity, cuCommitted, requestId } = req.body || {};

    if (action === 'satisfy') {
      if (!requestId) return res.status(400).json({ error: 'Falta requestId' });
      const target = await db.capacityRequest.findUnique({ where: { id: String(requestId) } });
      if (!target) return res.status(404).json({ error: 'Solicitud inexistente' });
      const declared = await db.userCapacity.findUnique({
        where: { userId_capacityId: { userId: user.id, capacityId: target.capacityId } },
      });
      if (!declared && !isModerator(user)) {
        return res.status(403).json({ error: 'Debés declarar esa capacidad antes de satisfacer solicitudes' });
      }
      try {
        const updated = await satisfyCapacityRequest(target.id, user.id);
        return res.status(200).json({ ok: true, solicitud: updated });
      } catch (e: any) {
        return res.status(400).json({ error: e?.message || 'No se pudo satisfacer la solicitud' });
      }
    }

    if (!capacitySlug) return res.status(400).json({ error: 'Falta capacitySlug' });
    try {
      const created = await createCapacityRequest(user.id, String(capacitySlug), Number(intensity) || 1, Number(cuCommitted) || 0);
      return res.status(201).json({ ok: true, solicitud: created });
    } catch (e: any) {
      return res.status(400).json({ error: e?.message || 'No se pudo crear la solicitud' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end('Method Not Allowed');
}