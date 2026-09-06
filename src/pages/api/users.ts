import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest, publicUser } from '@/src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return listUsers(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function listUsers(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { search, category, guild } = req.query;

    const users = await db.user.findMany({
      include: {
        profile: true,
        skills: true,
        categories: true,
        guildMemberships: {
          include: { guild: true },
        },
      },
      where: {
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { profile: { profession: { contains: search as string, mode: 'insensitive' } } },
          ],
        }),
        ...(category && { categories: { some: { id: category as string } } }),
        ...(guild && { guildMemberships: { some: { guild: { name: { contains: guild as string, mode: 'insensitive' } } } } }),
      },
      take: 200,
    });

    return res.status(200).json(users.map((u: any) => ({ ...publicUser(u), profile: u.profile })));
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}