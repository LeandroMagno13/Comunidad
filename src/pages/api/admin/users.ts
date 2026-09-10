import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest, isAdmin } from '@/src/lib/auth';

const VALID_ROLES = ['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];
const VALID_STATUSES = ['active', 'banned', 'deactivated'];

// Qué roles puede asignar cada rol del staff
const CAN_ASSIGN: Record<string, string[]> = {
  SUPER_ADMIN: ['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'],
  ADMIN: ['USER', 'MODERATOR'],
};

const ROLE_LEVEL: Record<string, number> = { USER: 0, MODERATOR: 1, ADMIN: 2, SUPER_ADMIN: 3 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (!isAdmin(user)) {
    return res.status(403).json({ error: 'Solo Super Admin o Admin pueden gestionar usuarios' });
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
  if (!status && !role) {
    return res.status(400).json({ error: 'Nada que actualizar' });
  }

  const target = await db.user.findUnique({ where: { id } });
  if (!target) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const isSelf = requester.id === target.id;

  // Protección de la propia cuenta
  if (isSelf && status && status !== 'active') {
    return res.status(400).json({ error: 'No puedes desactivar ni bloquear tu propia cuenta' });
  }
  if (isSelf && role && role !== requester.role) {
    return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
  }

  // Nadie puede bloquear a un Super Admin
  if (target.role === 'SUPER_ADMIN' && status && status !== 'active') {
    return res.status(400).json({ error: 'No puedes bloquear a un Super Admin' });
  }

  // Validación de valores
  if (role && !VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  const requesterLevel = ROLE_LEVEL[requester.role] ?? 0;
  const targetLevel = ROLE_LEVEL[target.role] ?? 0;

  // Un Admin no puede tocar a otros Admin ni a Super Admins
  if (requester.role !== 'SUPER_ADMIN' && targetLevel >= requesterLevel) {
    return res.status(403).json({ error: 'No puedes modificar a un usuario con rol igual o superior al tuyo' });
  }

  // Qué rol se puede asignar según el rol del que pide
  if (requester.role === 'ADMIN' && role && !(CAN_ASSIGN.ADMIN || []).includes(role)) {
    return res.status(403).json({ error: 'Solo el Super Admin puede asignar ese rol' });
  }
  if (requester.role === 'SUPER_ADMIN' && role && !(CAN_ASSIGN.SUPER_ADMIN || []).includes(role)) {
    return res.status(400).json({ error: 'Rol inválido' });
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