import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  // Registro PÚBLICO interno de logro: tareas comunitarias confirmadas
  // (ParticipationEvent, non-monetary) y solicitudes de capacidad satisfechas
  // como proveedor (CapacityRequest status='satisfied'). Solo del propio user.
  const [tasks, capacities] = await Promise.all([
    db.participationEvent.findMany({
      where: { participantId: user.id, kind: 'fulfillment' },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        detail: true,
        postId: true,
        createdAt: true,
      },
    }),
    db.capacityRequest.findMany({
      where: { providerId: user.id, status: 'satisfied' },
      orderBy: { satisfiedAt: 'desc' },
      take: 200,
      select: {
        id: true,
        intensity: true,
        urgencyLevel: true,
        satisfiedAt: true,
        capacity: { select: { slug: true, name: true } },
        asker: { select: { id: true, name: true } },
      },
    }),
  ]);

  return res.status(200).json({
    tasks,
    capacities,
    totals: { tasks: tasks.length, capacities: capacities.length },
  });
}