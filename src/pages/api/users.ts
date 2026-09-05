import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getUsers(req, res);
    case 'POST':
      return createUser(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function getUsers(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { search, category, guild } = req.query;

    const users = await prisma.user.findMany({
      include: {
        profile: true,
        skills: true,
        categories: true,
        guildMemberships: {
          include: {
            guild: true,
          },
        },
      },
      where: {
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { profile: { profession: { contains: search as string, mode: 'insensitive' } } },
          ],
        }),
      },
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function createUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { email, password, name, profile } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        profile: {
          create: {
            profession: profile?.profession,
            country: profile?.country,
            bio: profile?.bio,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'test-secret');
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(secret);

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: user.profile,
      },
      token,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}