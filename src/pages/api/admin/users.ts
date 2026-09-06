import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Solo el Super Admin puede gestionar usuarios' });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return listUsers(req, res);
    case 'PATCH':
      return updateUser(req, res, user);
    default:
      res.setHeader('Allow', ['GET', 'PATCH']);
      return res.status(405).end('Method Not Allowed');
  }
}

async function listUsers(req: NextApiRequest, res: NextApiResponse) {
  const { search, profession, country, guildId, status, role, page } = req.query;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  if (profession) where.profile = { is: { profession: { contains: profession as string, mode: 'insensitive' } } };
  if (country) where.profile = { is: { country: { contains: country as string, mode: 'insensitive' } } };
  if (status) where.status = status as string;
  if (role) where.role = role as string;
  if (guildId) where.guildMemberships = { some: { guildId: guildId as string } };

  const take = 50;
  const skip = (parseInt(page as string) || 0) * take;

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      include: { profile: true, guildMemberships: { include: { guild: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    db.user.count({ where }),
  ]);

  return res.status(200).json({
    users: users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      profile: u.profile,
      guilds: u.guildMemberships.map((m: any) => m.guild.name),
    })),
    total,
  });
}

async function updateUser(req: NextApiRequest, res: NextApiResponse, requester: any) {
  const { id, status, role } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Falta el usuario' });
  }

  const target = await db.user.findUnique({ where: { id } });
  if (!target) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  if (target.role === 'SUPER_ADMIN' && status && status !== 'active') {
    return res.status(400).json({ error: 'No puedes bloquear a otro Super Admin' });
  }
  if (requester.id === target.id && role && role !== 'SUPER_ADMIN' && requester.role === 'SUPER_ADMIN') {
    return res.status(400).json({ error: 'No puedes degradarte a ti mismo' });
  }

  const validRoles = ['USER', 'SUPER_ADMIN'];
  const validStatuses = ['active', 'banned', 'deactivated'];

  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  const updated = await db.user.update({
    where: { id },
    data: {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
    },
  });

  return res.status(200).json({
    id: updated.id,
    role: updated.role,
    status: updated.status,
  });
}