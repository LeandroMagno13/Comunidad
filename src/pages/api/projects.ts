import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return getProjects(req, res);
    case 'POST':
      return createProject(req, res, user);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function getProjects(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const projects = await db.project.findMany({
      include: {
        contributors: { include: { profile: true } },
        guilds: true,
        tasks: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function createProject(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { title, description, objectives, status, guildIds } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Título y descripción son obligatorios' });
    }

    const guildIdsArr: string[] = Array.isArray(guildIds) ? guildIds : [];

    // Solo permite vincular gremios de los que eres miembro activo
    let validGuildIds: string[] = [];
    if (guildIdsArr.length > 0) {
      const memberships = await db.guildMembership.findMany({
        where: {
          userId: user.id,
          guildId: { in: guildIdsArr },
          status: 'active',
        },
      });
      const allowed = new Set(memberships.map((m: any) => m.guildId));
      validGuildIds = guildIdsArr.filter((id) => allowed.has(id));
      if (validGuildIds.length === 0 && guildIdsArr.length > 0) {
        return res.status(403).json({ error: 'Debes ser miembro activo del gremio para vincularlo' });
      }
    }

    const project = await db.project.create({
      data: {
        title: String(title).trim().slice(0, 200),
        description: String(description).trim(),
        objectives: objectives ? String(objectives).trim() : null,
        status: status || 'investigation',
        contributors: { connect: [{ id: user.id }] },
        guilds: validGuildIds.length ? { connect: validGuildIds.map((id: string) => ({ id })) } : undefined,
      },
      include: { contributors: true, guilds: true },
    });

    return res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}