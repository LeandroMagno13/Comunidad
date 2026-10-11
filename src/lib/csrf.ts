// Protección CSRF con patrón double-submit cookie.
// Seguro y sin dependencias: el cliente lee la cookie y la envía como header
// en mutaciones (POST/PUT/PATCH/DELETE). El servidor compara ambos valores
// con comparación de tiempo constante.

import { NextApiRequest, NextApiResponse } from 'next';
import { randomBytes, timingSafeEqual } from 'crypto';
import { CSRF_COOKIE, CSRF_HEADER } from '@/src/lib/csrf-client';

export { CSRF_COOKIE, CSRF_HEADER };
const CSRF_MAX_AGE = 7 * 24 * 60 * 60; // 7 días

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  try {
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function issueCsrfToken(res: NextApiResponse): string {
  const token = randomBytes(32).toString('hex');
  res.setHeader(
    'Set-Cookie',
    `${CSRF_COOKIE}=${token}; Path=/; SameSite=Lax; Max-Age=${CSRF_MAX_AGE}`
  );
  return token;
}

export function getCsrfFromRequest(req: NextApiRequest): {
  cookie: string | null;
  header: string | null;
} {
  const cookieHeader = req.headers.cookie ?? '';
  const cookie =
    cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${CSRF_COOKIE}=`))
      ?.slice(CSRF_COOKIE.length + 1) ?? null;
  const rawHeader = req.headers[CSRF_HEADER];
  const header = Array.isArray(rawHeader) ? rawHeader[0] ?? null : rawHeader ?? null;
  return { cookie, header };
}

// Mutaciones (POST/PUT/PATCH/DELETE) requieren que cookie y header coincidan.
// GET/HEAD/OPTIONS nunca requieren CSRF.
export function verifyCsrf(req: NextApiRequest): boolean {
  const method = (req.method ?? 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;
  const { cookie, header } = getCsrfFromRequest(req);
  if (!cookie || !header) return false;
  return safeEqual(cookie, header);
}
