import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';
import { sanitizeHtml, htmlToText } from '@/src/lib/sanitize';
import { createPostSchema, validateBody } from '@/src/lib/validations';
import { parsePagination, paginatedResponse } from '@/src/lib/pagination';

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
  const { page, limit, skip } = parsePagination(req.query);

  const where = {
    status: 'visible',
    deletedAt: null,
    ...(guildId ? { guildId: guildId as string } : {}),
  };

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      include: {
        author: { include: { profile: true, cuAccount: true } },
        guild: true,
        fulfilledBy: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
        comments: {
          where: { status: 'visible', deletedAt: null },
          include: {
            author: true,
            replies: {
              where: { status: 'visible', deletedAt: null },
              include: { author: true },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 10, // Limitar comentarios por post en la lista
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.post.count({ where }),
  ]);

  return res.status(200).json(paginatedResponse(posts, page, limit, total));
}

async function createPost(req: NextApiRequest, res: NextApiResponse, user: any) {
  // Validación de entrada (sin dependencias externas)
  const validation = validateBody(createPostSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { title, content, guildId, type } = validation.data;
  const postType = type === 'request' ? 'request' : 'update';

  // Formato enriquecido: se recibe HTML del editor (whitelist) pero nunca se
  // confía en él. Se sanitiza al guardar y el texto es el que cuenta para
  // validar contenido y límites (lo que ve la persona, no las etiquetas).
  const safeHtml = sanitizeHtml(content);
  const textContent = htmlToText(safeHtml);

  if (!textContent) {
    return res.status(400).json({ error: 'La publicación no puede estar vacía' });
  }

  if (textContent.length > 10000) {
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
      title: title ? title.trim().slice(0, 200) : null,
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