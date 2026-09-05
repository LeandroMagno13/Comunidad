import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case 'POST':
      return register(req, res);
    default:
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function register(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { email, password, name, profession, country } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        profile: {
          create: {
            profession,
            country,
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

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: user.profile,
      },
      token,
    });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}