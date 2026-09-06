import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getCategories(req, res);
    case 'POST':
      return createCategory(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function getCategories(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const categories = await db.category.findMany({
      include: {
        users: { include: { profile: true } },
      },
    });
    return res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function createCategory(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { name, description, icon, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const category = await db.category.create({
      data: {
        name: String(name).trim().slice(0, 80),
        description: description ? String(description).trim() : null,
        icon: icon ? String(icon).trim() : null,
        color: color ? String(color).trim() : null,
      },
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}