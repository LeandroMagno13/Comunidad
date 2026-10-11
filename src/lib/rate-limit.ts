// Rate limiting simple en memoria para middleware
// Para producción con múltiples instancias, usar Redis

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Limpiar entradas vencidas cada 5 minutos
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  store.forEach((entry, key) => {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  });
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // Nueva ventana
    store.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
      retryAfterMs: 0,
    };
  }

  entry.count++;
  const allowed = entry.count <= limit;
  const retryAfterMs = entry.resetAt - now;

  return {
    allowed,
    remaining: allowed ? limit - entry.count : 0,
    resetAt: entry.resetAt,
    retryAfterMs: allowed ? 0 : Math.max(0, retryAfterMs),
  };
}

// Rate limits por tipo de endpoint
export const RATE_LIMITS = {
  // Endpoints de autenticación: más restrictivos
  auth: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 intentos por 15 min

  // API general: moderado
  api: { limit: 60, windowMs: 60 * 1000 }, // 60 requests por minuto

  // Escrituras (POST/PUT/DELETE): más restrictivos
  write: { limit: 20, windowMs: 5 * 60 * 1000 }, // 20 escrituras por 5 min
};

export function getClientKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  const path = new URL(req.url).pathname;
  return `${ip}:${path}`;
}

export function getRateLimitType(path: string): keyof typeof RATE_LIMITS {
  if (path.includes('/auth/')) return 'auth';
  return 'api';
}
