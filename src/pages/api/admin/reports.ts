import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Solo el Super Admin puede moderar reportes' });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return listReports(req, res);
    case 'PATCH':
      return resolveReport(req, res);
    default:
      res.setHeader('Allow', ['GET', 'PATCH']);
      return res.status(405).end('Method Not Allowed');
  }
}

async function listReports(_req: NextApiRequest, res: NextApiResponse) {
  const reports = await db.report.findMany({
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

async function resolveReport(req: NextApiRequest, res: NextApiResponse) {
  const { id, status, action } = req.body;

  if (!id || !['reviewed', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  if (action === 'hidePost') {
    await db.post.update({
      where: { id: req.body.postId },
      data: { status: 'hidden' },
    });
  }
  if (action === 'hideComment') {
    await db.comment.update({
      where: { id: req.body.commentId },
      data: { status: 'hidden' },
    });
  }

  const report = await db.report.update({
    where: { id },
    data: { status },
  });

  return res.status(200).json(report);
}