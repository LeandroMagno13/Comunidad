'use client';

// Cliente HTTP centralizado para el frontend.
//
// - Misma firma que `fetch`, así la migración es mecánica.
// - En mutaciones (POST/PUT/PATCH/DELETE) adjunta el header `x-csrf-token`
//   con el token emitido por `GET /api/auth/csrf` (double-submit cookie).
// - El servidor TODAVÍA no bloquea sin token (modo observación): este
//   cambio es no rompible por diseño. Si no hay token disponible, igual
//   envía la petición sin header en vez de fallar.
//
// Migración gradual: empezar por Navbar (piloto), luego el resto de páginas.

import { CSRF_HEADER } from '@/src/lib/csrf-client';

let cachedToken: string | null = null;
let inflight: Promise<string | null> | null = null;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const found = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return found ? found.slice(name.length + 1) : null;
}

async function fetchCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/csrf', { method: 'GET' });
    if (!res.ok) return readCookie('cps_csrf');
    const data = (await res.json()) as { csrfToken?: string };
    if (typeof data.csrfToken === 'string' && data.csrfToken) {
      cachedToken = data.csrfToken;
      return cachedToken;
    }
  } catch {
    // Sin red o sin servidor: se sigue sin token (modo no rompible)
  }
  return readCookie('cps_csrf');
}

export async function getCsrfToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  const fromCookie = readCookie('cps_csrf');
  if (fromCookie) {
    cachedToken = fromCookie;
    return cachedToken;
  }
  if (!inflight) {
    inflight = fetchCsrfToken().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

function isMutation(method: string): boolean {
  const m = method.toUpperCase();
  return m !== 'GET' && m !== 'HEAD' && m !== 'OPTIONS';
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  if (!isMutation(method)) {
    return fetch(input, init);
  }
  const headers = new Headers(init.headers);
  if (!headers.has(CSRF_HEADER)) {
    const token = await getCsrfToken();
    if (token) {
      headers.set(CSRF_HEADER, token);
    }
  }
  return fetch(input, { ...init, headers });
}

export function clearCsrfCache(): void {
  cachedToken = null;
}
