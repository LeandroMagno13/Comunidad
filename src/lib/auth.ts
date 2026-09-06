import { jwtVerify, SignJWT } from 'jose';
import { NextApiRequest } from 'next';
import { cookies } from 'next/headers';
import { db } from '@/src/lib/db';

export const TOKEN_COOKIE = 'cps_token';

const DEV_JWT_SECRET = 'comunidad-post-singularidad-dev-secret';

// En producción JWT_SECRET es obligatorio: sin él, no se generan ni validan
// sesiones. El fallback es exclusivo de desarrollo. El secreto nunca se loguea.
function getJwtSecret(): string {
  const secretValue = process.env.JWT_SECRET;
  if (secretValue) {
    if (secretValue.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }
    return secretValue;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET is not configured. Session handling is disabled in production.'
    );
  }
  return DEV_JWT_SECRET;
}

function secretEncoder() {
  return new TextEncoder().encode(getJwtSecret());
}

export async function signToken(payload: {
  userId: string;
  email: string;
  role: string;
}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretEncoder());
}

export async function verifyToken(token: string) {
  const key = secretEncoder();
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextApiRequest) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  const cookie = req.headers.cookie;
  if (cookie) {
    const match = cookie.split(';').find((c) => c.trim().startsWith(`${TOKEN_COOKIE}=`));
    if (match) {
      return match.split('=').slice(1).join('=').trim();
    }
  }
  return null;
}

async function tokenFromCookies() {
  try {
    const store = await cookies();
    return store.get(TOKEN_COOKIE)?.value || null;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const token = await tokenFromCookies();
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !payload.userId) return null;
  return getSessionUserById(payload.userId);
}

export async function getSessionUserById(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      guildMemberships: {
        where: { status: 'active' },
        include: { guild: true },
      },
      notifications: {
        where: { readAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      _count: {
        select: { notifications: { where: { readAt: null } } },
      },
    },
  });
  if (!user || user.status === 'banned' || user.status === 'deactivated') return null;
  return user;
}

export async function getUserFromRequest(req: NextApiRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !payload.userId) return null;
  const user = await db.user.findUnique({ where: { id: payload.userId }, include: { profile: true } });
  if (!user || user.status === 'banned' || user.status === 'deactivated') return null;
  return user;
}

export function publicUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

export function isAdmin(user: any) {
  return user?.role === 'SUPER_ADMIN';
}