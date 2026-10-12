/**
 * Contador de visitas del sitio, persistente en Neon (modelo SiteCounter).
 * - Solo totales agregados: nunca IPs, user-agents ni datos personales.
 * - GET /api/v1/public/visits-count devuelve el total (100% READ_PUBLIC).
 * - GET /api/v1/public/visits-count?track=1 registra una visita y devuelve el total.
 *   El Navbar lo llama una sola vez por sesion de pestana (sessionStorage).
 * - Incremento atomico via upsert (seguro ante requests concurrentes).
 */

import { db } from '@/src/lib/db';

const VISITS_KEY = 'site-visits';

export async function getVisitsTotal(): Promise<number> {
  const row = await db.siteCounter.findUnique({ where: { key: VISITS_KEY } });
  return row?.value ?? 0;
}

export async function trackVisit(): Promise<number> {
  const row = await db.siteCounter.upsert({
    where: { key: VISITS_KEY },
    create: { key: VISITS_KEY, value: 1 },
    update: { value: { increment: 1 } },
  });
  return row.value;
}
