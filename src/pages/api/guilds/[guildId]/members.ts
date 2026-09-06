import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { guildId } = req.query;
  if (typeof guildId !== 'string') {
    return res.status(400).json({ error: 'Gremio inválido' });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return listMembers(req, res, guildId, user);
    case 'POST':
      return membershipAction(req, res, guildId, user);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end('Method Not Allowed');
  }
}

async function listMembers(_req: NextApiRequest, res: NextApiResponse, guildId: string, user: any) {
  const guild = await db.guild.findUnique({ where: { id: guildId } });
  if (!guild) return res.status(404).json({ error: 'Gremio no encontrado' });

  const myMembership = await db.guildMembership.findUnique({
    where: { userId_guildId: { userId: user.id, guildId } },
  });

  const isModerator =
    myMembership?.role === 'admin' ||
    myMembership?.role === 'moderator' ||
    user.role === 'SUPER_ADMIN' ||
    guild.creatorId === user.id;

  const members = await db.guildMembership.findMany({
    where: {
      guildId,
      ...(isModerator ? {} : { status: 'active' }),
    },
    include: { user: { include: { profile: true } } },
    orderBy: { joinedAt: 'asc' },
  });

  return res.status(200).json({ members, pendingRequestsVisible: isModerator });
}

async function membershipAction(req: NextApiRequest, res: NextApiResponse, guildId: string, user: any) {
  const { action, userId } = req.body;

  const guild = await db.guild.findUnique({ where: { id: guildId } });
  if (!guild) return res.status(404).json({ error: 'Gremio no encontrado' });

  const isCreatorOrAdmin =
    guild.creatorId === user.id ||
    user.role === 'SUPER_ADMIN' ||
    (await db.guildMembership.findUnique({
      where: { userId_guildId: { userId: user.id, guildId } },
    }))?.role === 'admin';

  switch (action) {
    case 'join': {
      if (guild.status !== 'active') {
        return res.status(400).json({ error: 'Este gremio no acepta miembros' });
      }
      const existing = await db.guildMembership.findUnique({
        where: { userId_guildId: { userId: user.id, guildId } },
      });
      if (existing) {
        return res.status(400).json({ error: 'Ya tienes una solicitud o eres miembro' });
      }
      const wantApproval = guild.purpose === 'closed' || !guild.purpose;
      const membership = await db.guildMembership.create({
        data: {
          userId: user.id,
          guildId,
          status: wantApproval ? 'pending' : 'active',
        },
      });

      // Notify guild owner for approval
      if (guild.creatorId && wantApproval && guild.creatorId !== user.id) {
        await db.notification.create({
          data: {
            userId: guild.creatorId,
            type: 'guild_request',
            title: 'Nueva solicitud de ingreso',
            content: `${user.name} quiere unirse a ${guild.name}`,
            link: `/guilds/${guildId}`,
          },
        });
      }
      return res.status(201).json(membership);
    }

    case 'leave': {
      const membership = await db.guildMembership.findUnique({
        where: { userId_guildId: { userId: user.id, guildId } },
      });
      if (!membership) {
        return res.status(400).json({ error: 'No eres miembro de este gremio' });
      }
      if (guild.creatorId === user.id || membership.role === 'admin') {
        if (membership.role === 'admin' && guild.creatorId === user.id) {
          return res.status(400).json({ error: 'El creador no puede abandonar el gremio' });
        }
      }
      await db.guildMembership.delete({ where: { id: membership.id } });
      return res.status(200).json({ success: true });
    }

    case 'approve':
    case 'reject': {
      if (!isCreatorOrAdmin) {
        return res.status(403).json({ error: 'No tienes permisos para gestionar miembros' });
      }
      if (!userId) {
        return res.status(400).json({ error: 'Falta el usuario' });
      }
      const membership = await db.guildMembership.findUnique({
        where: { userId_guildId: { userId: userId as string, guildId } },
      });
      if (!membership || membership.status !== 'pending') {
        return res.status(400).json({ error: 'Solicitud no encontrada' });
      }

      if (action === 'approve') {
        await db.guildMembership.update({
          where: { id: membership.id },
          data: { status: 'active', joinedAt: new Date() },
        });
        await db.notification.create({
          data: {
            userId: userId as string,
            type: 'guild_approved',
            title: 'Solicitud aprobada',
            content: `Tu solicitud para unirte a ${guild.name} fue aprobada`,
            link: `/guilds/${guildId}`,
          },
        });
      } else {
        await db.guildMembership.delete({ where: { id: membership.id } });
      }
      return res.status(200).json({ success: true });
    }

    default:
      return res.status(400).json({ error: 'Acción inválida' });
  }
}