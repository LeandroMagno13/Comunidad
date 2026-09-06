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
      return listReports(req, res, user);
    case 'POST':
      return createReport(req, res, user);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end('Method Not Allowed');
  }
}

async function listReports(_req: NextApiRequest, res: NextApiResponse, user: any) {
  if (user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'No tienes permisos para ver reportes' });
  }

  const reports = await db.report.findMany({
    where: { status: 'pending' },
    include: {
      reporter: true,
      post: { include: { author: true } },
      comment: { include: { author: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return res.status(200).json(reports);
}

async function createReport(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { postId, commentId, reason } = req.body;

  if (!reason || !String(reason).trim()) {
    return res.status(400).json({ error: 'Debes indicar un motivo' });
  }
  if (!postId && !commentId) {
    return res.status(400).json({ error: 'Debes reportar una publicación o un comentario' });
  }

  const report = await db.report.create({
    data: {
      reportedById: user.id,
      postId: postId || null,
      commentId: commentId || null,
      reason: String(reason).trim().slice(0, 1000),
    },
    include: {
      post: { include: { author: true } },
      comment: { include: { author: true } },
    },
  });

  return res.status(201).json(report);
}