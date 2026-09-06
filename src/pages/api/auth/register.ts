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
    const { email, password, name, profession, country, bio, expertise, interests, adminCode } = req.body;

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

    // Bootstrap seguro de Super Admin:
    // - El email debe coincidir exactamente (normalizado: minúsculas sin espacios) con ADMIN_BOOTSTRAP_EMAIL.
    // - Solo aplica si todavía NO existe ningún SUPER_ADMIN.
    // - Si ADMIN_BOOTSTRAP_CODE está definido, además se exige ese código en el registro:
    //   evita que una cuenta se convierta en admin accidentalmente o que alguien
    //   reclame el email del operador antes de que se registre.
    const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
    const bootstrapCode = process.env.ADMIN_BOOTSTRAP_CODE?.trim();
    const adminCount = await db.user.count({ where: { role: 'SUPER_ADMIN' } });
    const emailMatches = bootstrapEmail ? normalizedEmail === bootstrapEmail : false;
    const codeMatches = bootstrapCode ? adminCode?.trim() === bootstrapCode : true;
    const isBootstrap = emailMatches && codeMatches && adminCount === 0;
    const role = isBootstrap ? 'SUPER_ADMIN' : 'USER';

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