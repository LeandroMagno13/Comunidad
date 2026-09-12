import { db } from '@/src/lib/db';
import { ensureCuConfig, transferCu } from '@/src/lib/cu';
import {
  levelWeight,
  presionFrom,
  cargaHumanaFrom,
  accessLevelFrom,
  expiresAtFrom,
} from '@/src/lib/cap-formulas';

// ============================================================================
// SEÑALIZACIÓN Y ASIGNACIÓN DE CAPACIDAD HUMANA (RONDA C)
//
// Las CU nunca fueron dinero ni patrimonio. En esta capa las CU expresan
// participación, demanda y prioridad dentro de una capacidad real limitada por
// la oferta humana y la tecnología disponible.
//
// La señal de presión es DEMANDA; el PID NO gobierna la oferta de CU.
//   señal(c) = demandaInsatisfecha(c) / ofertaEfectiva(c)
// (fórmula documentada en REPORTE-CU-CAPACIDAD.md §12, con sus limitaciones)
// ============================================================================

export const CAPACITY_CATALOG = [
  { slug: 'programacion', name: 'Programación', category: 'tecnología', automatizacion: 0.4 },
  { slug: 'reparacion', name: 'Reparación', category: 'servicios', automatizacion: 0.15 },
  { slug: 'asesoria-juridica', name: 'Asesoría jurídica', category: 'servicios', automatizacion: 0.5 },
  { slug: 'diseno', name: 'Diseño', category: 'creación', automatizacion: 0.5 },
  { slug: 'mediacion', name: 'Mediación', category: 'comunidad', automatizacion: 0.1 },
  { slug: 'investigacion', name: 'Investigación', category: 'conocimiento', automatizacion: 0.3 },
  { slug: 'traduccion', name: 'Traducción', category: 'conocimiento', automatizacion: 0.8 },
  { slug: 'fabricacion', name: 'Fabricación', category: 'producción', automatizacion: 0.2 },
  { slug: 'soporte-tecnico', name: 'Soporte técnico', category: 'tecnología', automatizacion: 0.6 },
  { slug: 'salud-y-cuidado', name: 'Salud y cuidado', category: 'comunidad', automatizacion: 0.05 },
] as const;

export { LEVEL_FACTOR } from '@/src/lib/cap-formulas';
export const WINDOW_DAYS = 30;

function round2(v: number) {
  return Math.round(v * 100) / 100;
}

export async function ensureCapacityDefaults() {
  const count = await db.capacity.count();
  if (count >= CAPACITY_CATALOG.length) return;
  await db.$transaction(
    CAPACITY_CATALOG.map((c) =>
      db.capacity.upsert({
        where: { slug: c.slug },
        update: { name: c.name, category: c.category, automatizacion: c.automatizacion },
        create: { slug: c.slug, name: c.name, category: c.category, automatizacion: c.automatizacion },
      })
    )
  );
}

export interface CapacitySignal {
  capacityId: string;
  slug: string;
  name: string;
  category: string | null;
  automatizacion: number;
  demandaTotal: number;
  demandaSatisfecha: number;
  demandaInsatisfecha: number;
  pctSatisfecha: number;
  ofertaDeclarada: number; // cantidad de participantes que declaran la capacidad
  ofertaEfectiva: number; // Σ disponibilidad × calidad × factor de nivel
  presion: number; // demanda insatisfecha / oferta efectiva (0 si satisfecha)
  cargaHumana: number; // demanda humana que cayó sobre la oferta efectiva (indicador operativo)
}

export async function computeSignals(): Promise<CapacitySignal[]> {
  await ensureCapacityDefaults();
  // Expiración explícita de solicitudes viejas ANTES de medir: la demanda vigente
  // no debe incluir acumulación histórica accidentale (§6 de Lee.txt).
  await expireStaleRequests(WINDOW_DAYS);
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const [capacities, requests, offers, users] = await Promise.all([
    db.capacity.findMany({ where: { active: true }, orderBy: { slug: 'asc' } }),
    db.capacityRequest.findMany({
      // Demanda VIGENTE = solicitudes activas (registered) o satisfechas.
      // Expiradas y canceladas NO cuentan (§Lee.txt, Test D).
      where: { status: { in: ['registered', 'satisfied'] }, createdAt: { gte: since } },
      select: { capacityId: true, intensity: true, status: true },
    }),
    db.userCapacity.findMany({
      include: { user: { select: { cuAccessLevel: true } }, capacity: { select: { slug: true } } },
    }),
    db.user.findMany({ select: { cuAccessLevel: true } }),
  ]);

  const offersByCapacity = new Map<string, { declared: number; effective: number }>();
  for (const o of offers) {
    const current = offersByCapacity.get(o.capacityId) ?? { declared: 0, effective: 0 };
    current.declared += 1;
    current.effective += o.disponibilidad * o.calidad * levelWeight(o.user.cuAccessLevel);
    offersByCapacity.set(o.capacityId, current);
  }

  const levels = { basico: users.filter((u) => u.cuAccessLevel === 'basico').length, medio: users.filter((u) => u.cuAccessLevel === 'medio').length, avanzado: users.filter((u) => u.cuAccessLevel === 'avanzado').length };

  const byCap = new Map<string, { total: number; sat: number }>();
  for (const r of requests) {
    const entry = byCap.get(r.capacityId) ?? { total: 0, sat: 0 };
    entry.total += r.intensity;
    if (r.status === 'satisfied') entry.sat += r.intensity;
    byCap.set(r.capacityId, entry);
  }

  const result: CapacitySignal[] = capacities.map((c) => {
    const d = byCap.get(c.id) ?? { total: 0, sat: 0 };
    const insatisfecha = Math.max(0, d.total - d.sat);
    const offer = offersByCapacity.get(c.id) ?? { declared: 0, effective: 0 };
    const eff = round2(offer.effective);
    // Presión: demanda insatisfecha / oferta efectiva (escasez).
    // Carga humana: capacidad humana UTILIZADA (demanda satisfecha) / disponible.
    // Señales independientes (§Lee.txt): presión puede ser 0 con carga alta.
    const presion = presionFrom(insatisfecha, eff);
    const cargaHumana = cargaHumanaFrom(d.sat, eff);
    return {
      capacityId: c.id,
      slug: c.slug,
      name: c.name,
      category: c.category,
      automatizacion: c.automatizacion,
      demandaTotal: d.total,
      demandaSatisfecha: d.sat,
      demandaInsatisfecha: insatisfecha,
      pctSatisfecha: d.total > 0 ? round2((d.sat / d.total) * 100) : 100,
      ofertaDeclarada: offer.declared,
      ofertaEfectiva: eff,
      presion,
      cargaHumana,
    };
  });

  result.sort((a, b) => b.presion - a.presion);
  return result;
}

// ---------------------------------------------------------------------------
// Niveles de acceso: por actividad (participación y contribución verificada),
// NUNCA por saldo de CU (sin "más CU = mejor persona", §3 de Lee.txt).
// La política de acceso es independiente de la economía CU.
// ---------------------------------------------------------------------------

// Lee el contexto de actividad de un usuario y devuelve su nivel de acceso.
// No consulta saldos de CU; no asume jerarquía moral.
export async function getAccessLevel(userId: string): Promise<'avanzado' | 'medio' | 'basico'> {
  const [asProvider, asAsker] = await Promise.all([
    db.capacityRequest.count({ where: { providerId: userId, status: 'satisfied' } }),
    db.capacityRequest.count({ where: { askerId: userId, status: 'satisfied' } }),
  ]);
  return accessLevelFrom({ asProvider, asAsker });
}

export async function refreshAccessLevel(userId: string) {
  const level = await getAccessLevel(userId);
  await db.user.update({ where: { id: userId }, data: { cuAccessLevel: level } });
  return level;
}

// ---------------------------------------------------------------------------
// Solicitudes (DEMANDA REAL).
// La apuesta de CU es prioridad dentro del nivel. La CU se transfiere al
// proveedor SÓLO si la solicitud se satisface; si expira, no se cobra.
// (Divergencia del simulador: en simulación la apuesta queda en hold; en el
// producto se cobra al satisfacer, para no retener saldos — documentado.)
// ---------------------------------------------------------------------------
export async function createCapacityRequest(askerId: string, capacitySlug: string, intensity: number, cuCommitted: number) {
  const capacity = await db.capacity.findUnique({ where: { slug: capacitySlug } });
  if (!capacity || !capacity.active) throw new Error('Capacidad inexistente o inactiva');
  const intensidad = Math.max(1, Math.round(intensity));
  const apuesta = Math.max(0, Math.round(cuCommitted));
  const me = await db.user.findUnique({ where: { id: askerId }, select: { cuAccessLevel: true } });
  if (me?.cuAccessLevel === 'basico' && apuesta > 0) {
    // básico: piso garantizado; puede apostar poco sin quedar fuera (§11 Lee.txt)
    if (apuesta > 5) throw new Error('En nivel básico el tope de apuesta es 5 CU');
  }
  const account = await db.cuAccount.findUnique({ where: { userId: askerId } });
  if (account && account.balance < apuesta) throw new Error('No podés apostar más CU de las que tenés');
  return db.capacityRequest.create({
    data: {
      askerId,
      capacityId: capacity.id,
      intensity: intensidad,
      cuCommitted: apuesta,
      expiresAt: expiresAtFrom(new Date(), WINDOW_DAYS),
    },
  });
}

export async function satisfyCapacityRequest(requestId: string, providerId: string) {
  const request = await db.capacityRequest.findUnique({ where: { id: requestId }, include: { capacity: true } });
  if (!request) throw new Error('Solicitud inexistente');
  if (request.status !== 'registered') throw new Error(`La solicitud ya no está registrada (${request.status})`);
  if (request.askerId === providerId) throw new Error('No podés auto-satisfacer tu solicitud');

  // La transferencia se hace ANTES de marcar satisfecha: si el solicitante no
  // alcanza la apuesta, la solicitud queda registrada sin cambio (consistente).
  if (request.cuCommitted > 0) {
    await transferCu(request.askerId, providerId, request.cuCommitted, `Capacidad satisfecha: ${request.capacity.name}`, { refType: 'capacity', refId: requestId });
  }
  await db.capacityRequest.update({ where: { id: requestId }, data: { providerId, status: 'satisfied', satisfiedAt: new Date() } });
  await refreshAccessLevel(request.askerId);
  await refreshAccessLevel(providerId);
  await db.notification.create({
    data: { userId: request.askerId, type: 'cu', title: 'Solicitud satisfecha', content: `Tu solicitud de ${request.capacity.name} fue satisfecha.` },
  });
  return db.capacityRequest.findUnique({ where: { id: requestId } });
}

export async function expireStaleRequests(maxDays = WINDOW_DAYS) {
  const now = new Date();
  const limit = new Date(now.getTime() - maxDays * 24 * 60 * 60 * 1000);
  // Expirar solicitudes registradas con más de maxDays sin resolverse (§6 Lee.txt).
  // Registrar fecha y motivo de cierre para auditoría (§12: Test D).
  const res = await db.capacityRequest.updateMany({
    where: { status: 'registered', createdAt: { lt: limit } },
    data: { status: 'expired', closedAt: now, closedReason: 'auto-expiración' },
  });
  return res.count;
}

// ---------------------------------------------------------------------------
// PATRIMONIO REAL SIMULADO → CAPACIDAD DISTRIBUIBLE → RECURSOS DISPONIBLES
// ---------------------------------------------------------------------------
export async function getPatrimonySummary() {
  const config = await ensureCuConfig();
  const cycles = 10; // "periodos" de referencia dentro del horizonte de 30 días
  const distributablePerPeriod = round2((config.patrimonyUsd * config.distributableRate) / Math.max(1, cycles));
  return {
    patrimonioUsd: config.patrimonyUsd,
    distributableRate: config.distributableRate,
    distributablePerPeriod,
    grantCap: config.grantCap,
    pidGoverning: config.pidGoverning,
  };
}