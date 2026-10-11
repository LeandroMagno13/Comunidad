// Caché simple en memoria con TTL para consultas frecuentes.
// Para producción con múltiples instancias, migrar a Redis.
// Nunca cachear datos privados por usuario sin incluir el userId en la clave.

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheDelete(key: string): void {
  cache.delete(key);
}

export function cacheClear(): void {
  cache.clear();
}

// Helper: intenta caché, si no existe ejecuta fetcher y guarda.
export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await fetcher();
  cacheSet(key, value, ttlMs);
  return value;
}

export const CACHE_TTL = {
  metrics: 60 * 1000, // 1 minuto para métricas públicas
  guilds: 30 * 1000, // 30 segundos para lista de gremios
  community: 60 * 1000, // 1 minuto para perfil de comunidad
};
