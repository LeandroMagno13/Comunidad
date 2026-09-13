import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';

const POLL_SCOPES = ['guild', 'community'] as const;

function isGuildModerator(membership?: { role?: string | null } | null) {
  return membership?.role === 'admin' || membership?.role === 'moderator';
}

function serializePoll(poll: any, myUserId: string) {
  const totalVotes = poll.votes?.length ?? 0;
  const myVote = poll.votes?.find((v: any) => v.userId === myUserId);
  return {
    id: poll.id,
    title: poll.title,
    description: poll.description,
    scope: poll.scope,
    guildId: poll.guildId,
    postId: poll.postId,
    isClosed: poll.isClosed,
    createdAt: poll.createdAt,
    createdBy: { id: poll.createdBy.id, name: poll.createdBy.name },
    post: poll.post ? { id: poll.post.id, title: poll.post.title, type: poll.post.type, status: poll.post.status } : null,
    options: (poll.options ?? []).map((o: any) => ({
      id: o.id,
      text: o.text,
      votes: o.votes?.length ?? 0,
    })),
    totalVotes,
    myOptionId: myVote?.optionId ?? null,
    canVote: !poll.isClosed && !myVote,
    canManage: poll.createdById === myUserId,
    // Trazabilidad íntegra: cada voto con usuario, opción y timestamp.
    registro: (poll.votes ?? [])
      .map((v: any) => ({
        id: v.id,
        userId: v.userId,
        userName: v.user?.name ?? 'Usuario',
        optionId: v.optionId,
        optionText: v.option?.text ?? '',
        createdAt: v.createdAt,
      }))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  switch (req.method) {
    case 'GET':
      return listPolls(req, res, user);
    case 'POST':
      return pollAction(req, res, user);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end('Method Not Allowed');
  }
}

async function listPolls(req: NextApiRequest, res: NextApiResponse, user: any) {
  const scope = typeof req.query.scope === 'string' && (POLL_SCOPES as readonly string[]).includes(req.query.scope) ? req.query.scope : undefined;
  const guildId = typeof req.query.guildId === 'string' ? req.query.guildId : undefined;

  const include = {
    createdBy: { select: { id: true, name: true } },
    post: { select: { id: true, title: true, type: true, status: true } },
    options: { include: { _count: { select: { votes: true } } } },
    votes: { include: { user: { select: { name: true } }, option: { select: { text: true } } } },
  };

  let polls;
  if (scope === 'guild') {
    if (!guildId) return res.status(400).json({ error: 'Falta el gremio' });
    const membership = await db.guildMembership.findUnique({
      where: { userId_guildId: { userId: user.id, guildId } },
    });
    if (!membership || membership.status !== 'active') {
      return res.status(403).json({ error: 'Debes ser miembro activo para ver encuestas de este gremio' });
    }
    polls = await db.poll.findMany({
      where: { scope: 'guild', guildId },
      include,
      orderBy: { createdAt: 'desc' },
    });
  } else if (scope === 'community') {
    polls = await db.poll.findMany({ where: { scope: 'community' }, include, orderBy: { createdAt: 'desc' } });
  } else {
    const mine = await db.guildMembership.findMany({ where: { userId: user.id, status: 'active' }, select: { guildId: true } });
    const guildIds = mine.map((m) => m.guildId);
    polls = await db.poll.findMany({
      where: { OR: [{ scope: 'community' }, { scope: 'guild', guildId: { in: guildIds } }] },
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  return res.status(200).json(polls.map((p: any) => serializePoll(p, user.id)));
}

async function pollAction(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { action } = req.body || {};

  if (action === 'create') {
    const { title, description, scope, guildId, postId, options } = req.body || {};

    const finalScope = scope === 'community' ? 'community' : 'guild';
    const finalTitle = typeof title === 'string' ? title.trim() : '';
    const finalDescription = typeof description === 'string' && description.trim() ? description.trim().slice(0, 2000) : null;

    if (!finalTitle) return res.status(400).json({ error: 'La encuesta necesita un título' });
    if (finalTitle.length > 200) return res.status(400).json({ error: 'El título es demasiado largo' });

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'La encuesta necesita al menos 2 opciones' });
    }
    const texts = options
      .map((o: any) => (typeof o === 'string' ? o.trim() : typeof o?.text === 'string' ? o.text.trim() : ''))
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i);
    if (texts.length < 2) return res.status(400).json({ error: 'Necesitás al menos 2 opciones distintas' });
    if (texts.length > 8) return res.status(400).json({ error: 'Máximo 8 opciones por encuesta' });
    if (texts.some((t) => t.length > 120)) return res.status(400).json({ error: 'Cada opción no puede superar 120 caracteres' });

    let guildMember = null;
    if (finalScope === 'guild') {
      if (!guildId) return res.status(400).json({ error: 'Las encuestas de gremio necesitan el gremio' });
      guildMember = await db.guildMembership.findUnique({
        where: { userId_guildId: { userId: user.id, guildId: String(guildId) } },
      });
      if (!guildMember || guildMember.status !== 'active') {
        return res.status(403).json({ error: 'Debes ser miembro activo del gremio para crear encuestas' });
      }
    }

    let linkedPost = null;
    if (postId) {
      linkedPost = await db.post.findUnique({ where: { id: String(postId) } });
      if (!linkedPost || linkedPost.status !== 'visible') {
        return res.status(400).json({ error: 'La publicación referida no existe o no está visible' });
      }
    }

    const poll = await db.poll.create({
      data: {
        title: finalTitle,
        description: finalDescription,
        scope: finalScope,
        guildId: finalScope === 'guild' ? String(guildId) : null,
        postId: linkedPost ? linkedPost.id : null,
        createdById: user.id,
        options: { create: texts.map((t) => ({ text: t })) },
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        post: { select: { id: true, title: true, type: true, status: true } },
        options: { include: { _count: { select: { votes: true } } } },
        votes: { include: { user: { select: { name: true } }, option: { select: { text: true } } } },
      },
    });

    return res.status(201).json(serializePoll(poll, user.id));
  }

  if (action === 'vote') {
    const { pollId, optionId } = req.body || {};
    if (!pollId || !optionId) return res.status(400).json({ error: 'Faltan datos del voto' });

    const poll = await db.poll.findUnique({
      where: { id: String(pollId) },
      include: { options: { select: { id: true } } },
    });
    if (!poll) return res.status(404).json({ error: 'Encuesta inexistente' });
    if (poll.isClosed) return res.status(400).json({ error: 'La encuesta está cerrada' });
    if (!poll.options.some((o: any) => o.id === String(optionId))) {
      return res.status(400).json({ error: 'La opción no pertenece a esta encuesta' });
    }
    if (poll.scope === 'guild' && poll.guildId) {
      const membership = await db.guildMembership.findUnique({
        where: { userId_guildId: { userId: user.id, guildId: poll.guildId } },
      });
      if (!membership || membership.status !== 'active') {
        return res.status(403).json({ error: 'Debes ser miembro activo del gremio para votar' });
      }
    }

    try {
      await db.pollVote.create({
        data: { pollId: poll.id, optionId: String(optionId), userId: user.id },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        return res.status(400).json({ error: 'Ya votaste en esta encuesta' });
      }
      throw e;
    }

    const updated = await db.poll.findUnique({
      where: { id: poll.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        post: { select: { id: true, title: true, type: true, status: true } },
        options: { include: { _count: { select: { votes: true } } } },
        votes: { include: { user: { select: { name: true } }, option: { select: { text: true } } } },
      },
    });
    return res.status(200).json(serializePoll(updated, user.id));
  }

  if (action === 'close') {
    const { pollId } = req.body || {};
    if (!pollId) return res.status(400).json({ error: 'Falta la encuesta' });
    const poll = await db.poll.findUnique({ where: { id: String(pollId) } });
    if (!poll) return res.status(404).json({ error: 'Encuesta inexistente' });

    let canClose = poll.createdById === user.id || user.role === 'SUPER_ADMIN';
    if (poll.scope === 'guild' && poll.guildId && !canClose) {
      const membership = await db.guildMembership.findUnique({
        where: { userId_guildId: { userId: user.id, guildId: poll.guildId } },
      });
      const guild = await db.guild.findUnique({ where: { id: poll.guildId } });
      canClose = isGuildModerator(membership) || guild?.creatorId === user.id;
    }
    if (!canClose) return res.status(403).json({ error: 'Solo quien creó la encuesta o el admin del gremio puede cerrarla' });

    await db.poll.update({ where: { id: poll.id }, data: { isClosed: true } });
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Acción desconocida' });
}