import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest, isAdmin } from '@/src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Publicación inválida' });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return getPost(req, res, id);
    case 'POST':
      return addComment(req, res, id, user);
    case 'PATCH':
      return moderatePost(req, res, id, user);
    case 'DELETE':
      return deletePost(req, res, id, user);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
      return res.status(405).end('Method Not Allowed');
  }
}

async function getPost(_req: NextApiRequest, res: NextApiResponse, id: string) {
  const post = await db.post.findUnique({
    where: { id },
    include: {
      author: { include: { profile: true } },
      guild: true,
      _count: { select: { comments: true } },
      comments: {
        where: { status: 'visible' },
        include: {
          author: true,
          replies: {
            where: { status: 'visible' },
            include: { author: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!post) return res.status(404).json({ error: 'Publicación no encontrada' });
  return res.status(200).json(post);
}

async function addComment(req: NextApiRequest, res: NextApiResponse, id: string, user: any) {
  const { content, parentId } = req.body;

  if (!content || !String(content).trim()) {
    return res.status(400).json({ error: 'El comentario no puede estar vacío' });
  }
  if (String(content).length > 4000) {
    return res.status(400).json({ error: 'El comentario es demasiado largo' });
  }

  const post = await db.post.findUnique({ where: { id } });
  if (!post) return res.status(404).json({ error: 'Publicación no encontrada' });

  const comment = await db.comment.create({
    data: {
      postId: id,
      authorId: user.id,
      parentId: parentId || null,
      content: String(content).trim(),
    },
    include: { author: true },
  });

  // Notify post author on reply
  const notifiedUser =
    parentId
      ? (await db.comment.findUnique({ where: { id: parentId } }))?.authorId
      : post.authorId;

  if (notifiedUser && notifiedUser !== user.id) {
    await db.notification.create({
      data: {
        userId: notifiedUser,
        type: parentId ? 'comment_reply' : 'post_reply',
        title: parentId ? 'Te respondieron un comentario' : 'Nueva respuesta a tu publicación',
        content: `${user.name} comentó: ${String(content).trim().slice(0, 140)}`,
        link: `/community/${post.id}`,
      },
    });
  }

  return res.status(201).json(comment);
}

async function moderatePost(req: NextApiRequest, res: NextApiResponse, id: string, user: any) {
  const { status } = req.body;
  const valid = ['visible', 'hidden', 'blocked', 'deleted'];
  const post = await db.post.findUnique({ where: { id } });
  if (!post) return res.status(404).json({ error: 'Publicación no encontrada' });

  if (post.authorId !== user.id && !isAdmin(user)) {
    return res.status(403).json({ error: 'No tienes permisos' });
  }
  if (!valid.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  const updated = await db.post.update({ where: { id }, data: { status } });
  return res.status(200).json(updated);
}

async function deletePost(_req: NextApiRequest, res: NextApiResponse, id: string, user: any) {
  const post = await db.post.findUnique({ where: { id } });
  if (!post) return res.status(404).json({ error: 'Publicación no encontrada' });

  if (post.authorId !== user.id && !isAdmin(user)) {
    return res.status(403).json({ error: 'No tienes permisos' });
  }

  await db.post.delete({ where: { id } });
  return res.status(200).json({ success: true });
}