import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';
import { sanitizeHtml, htmlToText } from '@/src/lib/sanitize';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return listPosts(req, res);
    case 'POST':
      return createPost(req, res, user);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end('Method Not Allowed');
  }
}

async function listPosts(req: NextApiRequest, res: NextApiResponse) {
  const { guildId } = req.query;

  const posts = await db.post.findMany({
    where: {
      status: 'visible',
      ...(guildId ? { guildId: guildId as string } : {}),
    },
    include: {
      author: { include: { profile: true, cuAccount: true } },
      guild: true,
      fulfilledBy: { select: { id: true, name: true } },
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
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return res.status(200).json(posts);
}

async function createPost(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { title, content, guildId, type } = req.body;
  const postType = type === 'request' ? 'request' : 'update';

  // Formato enriquecido: se recibe HTML del editor (whitelist) pero nunca se
  // confía en él. Se sanitiza al guardar y el texto es el que cuenta para
  // validar contenido y límites (lo que ve la persona, no las etiquetas).
  const safeHtml = sanitizeHtml(typeof content === 'string' ? content : '');
  const textContent = htmlToText(safeHtml);

  if (!textContent) {
    return res.status(400).json({ error: 'La publicación no puede estar vacía' });
  }

  if (textContent.length > 10000) {
    return res.status(400).json({ error: 'La publicación es demasiado larga' });
  }

  if (safeHtml.length > 20000) {
    return res.status(400).json({ error: 'La publicación es demasiado larga' });
  }

  // LEGACY: cuOffer se ignora. La CU NO es medio de pago (§Lee.txt). Las
  // solicitudes comunitarias registran participación (ParticipationEvent),
  // no transacciones monetarias. El campo cuOffer se setea null siempre.
  if (guildId) {
    const membership = await db.guildMembership.findUnique({
      where: { userId_guildId: { userId: user.id, guildId } },
    });
    if (!membership || membership.status !== 'active') {
      return res.status(403).json({ error: 'Debes ser miembro del gremio para publicar' });
    }
  }

  const post = await db.post.create({
    data: {
      authorId: user.id,
      title: title ? String(title).trim().slice(0, 200) : null,
      content: safeHtml,
      guildId: guildId || null,
      type: postType,
      cuOffer: null,
      requestStatus: postType === 'request' ? 'open' : null,
    },
    include: {
      author: { include: { profile: true, cuAccount: true } },
      _count: { select: { comments: true } },
    },
  });

  return res.status(201).json(post);
}