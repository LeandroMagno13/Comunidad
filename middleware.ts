import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { rateLimit, RATE_LIMITS, getClientKey, getRateLimitType } from '@/src/lib/rate-limit';
import { csrfCheckEdge, isCsrfEnforced } from '@/src/lib/csrf-edge';

const TOKEN_COOKIE = 'cps_token';
const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'];

function getJwtSecretKey(): Uint8Array {
  const secretValue = process.env.JWT_SECRET;
  if (secretValue) {
    if (secretValue.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }
    return new TextEncoder().encode(secretValue);
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET is not configured. Session handling is disabled in production.'
    );
  }
  return new TextEncoder().encode('comunidad-post-singularidad-dev-secret');
}

async function getSession(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  const key = getJwtSecretKey();
  try {
    const { payload } = await jwtVerify(token, key);
    const data = payload as { userId?: string; role?: string };
    if (!data.userId) return null;
    return { userId: data.userId, role: data.role || 'USER' };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const session = await getSession(request);
  const { pathname } = request.nextUrl;

  // Rate limiting + CSRF para API
  let csrfObserved: string | null = null;
  if (pathname.startsWith('/api/')) {
    const type = getRateLimitType(pathname);
    const { limit, windowMs } = RATE_LIMITS[type];
    const key = getClientKey(request);
    const result = rateLimit(key, limit, windowMs);

    if (!result.allowed) {
      const response = NextResponse.json(
        {
          error: 'Too Many Requests',
          retryAfterMs: result.retryAfterMs,
        },
        { status: 429 }
      );
      response.headers.set('Retry-After', Math.ceil(result.retryAfterMs / 1000).toString());
      return addSecurityHeaders(response);
    }

    // CSRF: solo mutaciones con auth por cookie. Bearer queda exento
    // (ver csrf-edge.ts). Sin CSRF_ENFORCE=true solo se OBSERVA: se marca
    // la respuesta con x-csrf-would-block sin bloquear nada.
    const csrf = csrfCheckEdge(request);
    if (csrf === 'missing' || csrf === 'mismatch') {
      if (isCsrfEnforced()) {
        console.warn(
          JSON.stringify({
            evt: 'csrf.blocked',
            endpoint: pathname,
            method: request.method,
            reason: csrf,
            at: new Date().toISOString(),
          })
        );
        return addSecurityHeaders(
          NextResponse.json({ error: 'CSRF token inválido o ausente' }, { status: 403 })
        );
      }
      csrfObserved = csrf;
    }
  }

  function withMarks(response: NextResponse) {
    if (csrfObserved) {
      response.headers.set('x-csrf-would-block', '1');
      response.headers.set('x-csrf-observed', csrfObserved);
    }
    return addSecurityHeaders(response);
  }

  // Rutas que requieren sesión
  const protectedPaths = ['/messages', '/profile', '/community', '/notifications'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  // /admin solo para SUPER_ADMIN (el siguiente check también protege por ruta)
  const isAdminArea = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  if (isAdminArea) {
    if (!session) {
      const url = new URL('/login', request.url);
      return withMarks(NextResponse.redirect(url));
    }
    if (!STAFF_ROLES.includes(session.role || '')) {
      const url = new URL('/', request.url);
      return withMarks(NextResponse.redirect(url));
    }
    return withMarks(NextResponse.next());
  }

  if (isProtected && !session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return withMarks(NextResponse.redirect(url));
  }

  return withMarks(NextResponse.next());
}

export const config = {
  matcher: [
    '/messages/:path*',
    '/profile/:path*',
    '/community/:path*',
    '/admin/:path*',
    '/api/:path*',
  ],
};

// Headers de seguridad para todas las respuestas
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-DNS-Prefetch-Control': 'off',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

function addSecurityHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}