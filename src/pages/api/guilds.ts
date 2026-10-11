import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';
import { createGuildSchema, validateBody } from '@/src/lib/validations';
import { parsePagination, paginatedResponse } from '@/src/lib/pagination';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getGuilds(req, res);
    case 'POST':
      return createGuild(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function getGuilds(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { page, limit, skip } = parsePagination(req.query);

    const [guilds, total] = await Promise.all([
      db.guild.findMany({
        where: { deletedAt: null },
        include: {
          members: {
            where: { status: 'active' },
            include: {
              user: { include: { profile: true } },
            },
          },
          creator: true,
          projects: true,
          discussions: true,
          _count: { select: { members: true, posts: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.guild.count({ where: { deletedAt: null } }),
    ]);

    const userMemberships = await db.guildMembership.findMany({
      where: { userId: user.id },
      select: { guildId: true, status: true, role: true },
    });

    const membershipMap = Object.fromEntries(
      userMemberships.map((m: any) => [m.guildId, { status: m.status, role: m.role }])
    );

    return res.status(200).json(
      paginatedResponse(
        guilds.map((g: any) => ({
          ...g,
          myMembership: membershipMap[g.id] || null,
        })),
        page,
        limit,
        total
      )
    );
  } catch (error) {
    console.error('Error fetching guilds:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function createGuild(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Validación de entrada (sin dependencias externas)
    const validation = validateBody(createGuildSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { name, description, purpose } = validation.data;

    const guild = await db.guild.create({
      data: {
        name: String(name).trim().slice(0, 80),
        description: String(description).trim(),
        purpose: purpose ? String(purpose).trim() : null,
        creatorId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'admin',
            status: 'active',
          },
        },
      },
    });

    return res.status(201).json(guild);
  } catch (error) {
    console.error('Error creating guild:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}