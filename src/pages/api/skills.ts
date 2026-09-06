import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getSkills(req, res);
    case 'POST':
      return createSkill(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function getSkills(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const skills = await db.skill.findMany({
      include: {
        users: { include: { profile: true } },
      },
    });
    return res.status(200).json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function createSkill(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { name, description, category, level } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const skill = await db.skill.create({
      data: {
        name: String(name).trim().slice(0, 80),
        description: description ? String(description).trim() : null,
        category: category ? String(category).trim() : null,
        level: level ? String(level).trim() : null,
      },
    });

    return res.status(201).json(skill);
  } catch (error) {
    console.error('Error creating skill:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}