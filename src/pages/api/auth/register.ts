import bcrypt from 'bcryptjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { signToken, TOKEN_COOKIE } from '@/src/lib/auth';

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
    const { email, password, name, profession, country, bio, expertise, interests } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, contraseña y nombre son obligatorios' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: 'Este email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));

    // Bootstrap seguro de Super Admin: solo cuando el email coincide con
    // ADMIN_BOOTSTRAP_EMAIL y todavía no existe ningún SUPER_ADMIN.
    const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
    const adminCount = await db.user.count({ where: { role: 'SUPER_ADMIN' } });
    const isBootstrap = bootstrapEmail ? normalizedEmail === bootstrapEmail : false;
    const role = isBootstrap && adminCount === 0 ? 'SUPER_ADMIN' : 'USER';

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: String(name).trim(),
        role,
        profile: {
          create: {
            profession,
            country,
            bio,
            expertise: expertise || [],
            interests: interests || [],
          },
        },
      },
      include: { profile: true },
    });

    const token = await signToken({ userId: user.id, email: user.email, role: user.role });

    res.setHeader('Set-Cookie', `${TOKEN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile,
      },
      token,
    });
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(409).json({ error: 'Este email ya está registrado' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}