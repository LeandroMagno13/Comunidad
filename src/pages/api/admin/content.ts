import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest, isModerator } from '@/src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (!isModerator(user)) {
    return res.status(403).json({ error: 'Solo Super Admin, Admin o Moderador pueden moderar contenido' });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return listContent(req, res);
    case 'PATCH':
      return moderateContent(req, res);
    default:
      res.setHeader('Allow', ['GET', 'PATCH']);
      return res.status(405).end('Method Not Allowed');
  }
}

async function listContent(req: NextApiRequest, res: NextApiResponse) {
  const { type } = req.query;
  const onlyType = typeof type === 'string' ? type : undefined;

  const [posts, comments] = await Promise.all([
    onlyType && onlyType !== 'posts'
      ? Promise.resolve([])
      : db.post.findMany({
          include: {
            author: true,
            _count: { select: { comments: true, reports: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
    onlyType && onlyType !== 'comments'
      ? Promise.resolve([])
      : db.comment.findMany({
          include: {
            author: true,
            post: { select: { id: true, title: true } },
            _count: { select: { reports: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
  ]);

  return res.status(200).json({ posts, comments });
}

async function moderateContent(req: NextApiRequest, res: NextApiResponse) {
  const { type, id, status } = req.body;

  if (!type || !id || !status) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  if (type === 'post') {
    if (!['visible', 'hidden', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido para publicación' });
    }
    const post = await db.post.updateMany({
      where: { id: id as string },
      data: { status },
    });
    if (post.count === 0) return res.status(404).json({ error: 'Publicación no encontrada' });
  } else if (type === 'comment') {
    if (!['visible', 'hidden'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido para comentario' });
    }
    const comment = await db.comment.updateMany({
      where: { id: id as string },
      data: { status },
    });
    if (comment.count === 0) return res.status(404).json({ error: 'Comentario no encontrado' });
  } else {
    return res.status(400).json({ error: 'Tipo inválido' });
  }

  return res.status(200).json({ success: true });
}