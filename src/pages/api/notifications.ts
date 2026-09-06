import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return listNotifications(req, res, user.id);
    case 'PATCH':
      return markRead(req, res, user.id);
    default:
      res.setHeader('Allow', ['GET', 'PATCH']);
      return res.status(405).end('Method Not Allowed');
  }
}

async function listNotifications(_req: NextApiRequest, res: NextApiResponse, userId: string) {
  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const unread = await db.notification.count({
    where: { userId, readAt: null },
  });
  return res.status(200).json({ notifications, unread });
}

async function markRead(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { id, all } = req.body;

  if (all) {
    await db.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  } else if (id) {
    await db.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  } else {
    return res.status(400).json({ error: 'Falta id o all' });
  }

  return res.status(200).json({ success: true });
}