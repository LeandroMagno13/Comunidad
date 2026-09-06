import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Solo el Super Admin puede gestionar gremios' });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return listGuilds(req, res);
    case 'PATCH':
      return moderateGuild(req, res);
    default:
      res.setHeader('Allow', ['GET', 'PATCH']);
      return res.status(405).end('Method Not Allowed');
  }
}

async function listGuilds(_req: NextApiRequest, res: NextApiResponse) {
  const guilds = await db.guild.findMany({
    include: {
      creator: true,
      _count: { select: { members: true, posts: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.status(200).json(guilds);
}

async function moderateGuild(req: NextApiRequest, res: NextApiResponse) {
  const { id, status } = req.body;

  if (!id || !['active', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const guild = await db.guild.update({
    where: { id },
    data: { status },
  });

  return res.status(200).json(guild);
}