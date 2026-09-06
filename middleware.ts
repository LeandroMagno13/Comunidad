import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const TOKEN_COOKIE = 'cps_token';

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

  // Rutas que requieren sesión
  const protectedPaths = ['/messages', '/profile', '/community'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  // /admin solo para SUPER_ADMIN (el siguiente check también protege por ruta)
  const isAdminArea = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  if (isAdminArea) {
    if (!session) {
      const url = new URL('/login', request.url);
      return NextResponse.redirect(url);
    }
    if (session.role !== 'SUPER_ADMIN') {
      const url = new URL('/', request.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isProtected && !session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/messages/:path*',
    '/profile/:path*',
    '/community/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};