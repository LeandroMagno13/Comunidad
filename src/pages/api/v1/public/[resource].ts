// =============================================================================
// API P�BLICA READ-ONLY DE POSTSINGULAR (RONDA F, membrana de integraci�n).
//
// Estos handlers responden a `/api/v1/public/*`. Son 100% aditivos y de SOLO
// LECTURA: nunca escriben, nunca exponen secretos/emails/datos privados. La
// info que devuelven es exactamente la que ya era p�blica en la web (comunidad,
// publicaciones visibles, gremios, pedidos, encuestas y actividad reciente),
// pero servida como JSON para que agentes externos la consuman sin autenticarse.
//
// Para RONDA F se reutilizan los mismos datos/consultas que ya proveen las
// vistas web actuales (muro, cartelera, gremios, pedidos y encuestas): NO se
// duplica l�gica ni se inventan respuestas distintas. Un agente que lea esta
// API ve la misma realidad de la comunidad que cualquier visitante, ni m�s.
//
// Convenci�n: `GET /api/v1/public/[recurso]?limit=&desde=` devuelve
// { ok, data, meta } con `data` limitado (default 50, m�x 200) y `meta` con
// timestamp y totales p�blicos. Cualquier par�metro que pida datos privados
// (ej: `mine=true`) se ignora por seguridad.
// =============================================================================

import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { publicUser } from '@/src/lib/auth';

export const PUBLIC_VERSION = 'v1';
export const PUBLIC_DEFAULT_LIMIT = 50;
export const PUBLIC_MAX_LIMIT = 200;

// Recursos p�blicos disponibles (solo lectura, sin autenticaci�n).
export const PUBLIC_RESOURCES = [
  'community', // resumen de m�tricas p�blicas de la comunidad
  'posts',      // publicaciones visibles
  'guilds',     // gremios con miembros activos
  'requests',   // pedidos comunales visibles
  'polls',      // encuestas visibles
  'activity',   // actividad reciente (posts + encuestas combinadas)
] as const;

export type PublicResource = (typeof PUBLIC_RESOURCES)[number];

export function isPublicResource(r: string): r is PublicResource {
  return (PUBLIC_RESOURCES as readonly string[]).includes(r);
}

export function publicLimit(req: NextApiRequest): number {
  const raw = req.query?.limit;
  const n = typeof raw === 'string' ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n < 1) return PUBLIC_DEFAULT_LIMIT;
  return Math.min(n, PUBLIC_MAX_LIMIT);
}

function ok(res: NextApiResponse, data: unknown, meta: Record<string, unknown>) {
  return res.status(200).json({ ok: true, data, meta });
}

// -----------------------------------------------------------------------------
// community: m�tricas p�blicas agregadas (sin datos personales).
// -----------------------------------------------------------------------------
async function community(db_: typeof db) {
  const [usersCount, postsCount, guildsCount] = await Promise.all([
    db_.user.count({ where: { status: 'active' } }),
    db_.post.count({ where: { status: 'visible' } }),
    db_.guild.count(),
  ]);
  return {
    name: 'PostSingular',
    members: usersCount,
    visiblePosts: postsCount,
    guilds: guildsCount,
    currency: 'CU (Capacidad de Urgencia) — moneda interna de la comunidad',
    publicInfo: 'Datos agregados y públicos; cada miembro conserva su privacidad.',
  };
}

// -----------------------------------------------------------------------------
// posts: publicaciones visibles (autor público, sin email/avatar privado).
// -----------------------------------------------------------------------------
async function posts(db_: typeof db, limit: number) {
  const rows = await db_.post.findMany({
    where: { status: 'visible' },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      status: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    type: p.type,
    title: p.title,
    content: p.content,
    author: { id: p.author.id, name: p.author.name },
    createdAt: p.createdAt.toISOString(),
  }));
}

// -----------------------------------------------------------------------------
// guilds: gremios con su membresía activa (sin datos personales).
// -----------------------------------------------------------------------------
async function guilds(db_: typeof db, limit: number) {
  const rows = await db_.guild.findMany({
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: {
      id: true,
      name: true,
      description: true,
      purpose: true,
      createdAt: true,
      members: {
        where: { status: 'active' },
        select: { userId: true },
      },
    },
  });
  return rows.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    purpose: g.purpose,
    membersActive: g.members.length,
    createdAt: g.createdAt.toISOString(),
  }));
}

// -----------------------------------------------------------------------------
// requests: pedidos comunales visibles (reactivados/abiertos).
// -----------------------------------------------------------------------------
async function requests(db_: typeof db, limit: number) {
  const rows = await db_.post.findMany({
    where: { type: 'request', status: 'visible' },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      content: true,
      status: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.content,
    status: r.status,
    author: { id: r.author.id, name: r.author.name },
    createdAt: r.createdAt.toISOString(),
  }));
}

// -----------------------------------------------------------------------------
// polls: encuestas visibles (opciones públicas, sin votos personales detallados).
// -----------------------------------------------------------------------------
async function polls(db_: typeof db, limit: number) {
  const rows = await db_.poll.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      description: true,
      isClosed: true,
      createdAt: true,
      options: { select: { id: true, text: true, _count: { select: { votes: true } } } },
      _count: { select: { votes: true } },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.isClosed ? 'closed' : 'active',
    options: p.options.map((o) => ({ id: o.id, text: o.text, votes: o._count.votes })),
    totalVotes: p._count.votes,
    createdAt: p.createdAt.toISOString(),
  }));
}

// -----------------------------------------------------------------------------
// activity: actividad reciente de la comunidad (posts + encuestas combinadas).
// -----------------------------------------------------------------------------
async function activity(db_: typeof db, limit: number) {
  const half = Math.max(1, Math.ceil(limit / 2));
  const [recentPosts, recentPolls] = await Promise.all([
    db_.post.findMany({
      where: { status: 'visible' },
      orderBy: { createdAt: 'desc' },
      take: half,
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
        author: { select: { id: true, name: true } },
      },
    }),
    db_.poll.findMany({
      orderBy: { createdAt: 'desc' },
      take: half,
      select: { id: true, title: true, createdAt: true },
    }),
  ]);
  const merged = [
    ...recentPosts.map((p) => ({
      kind: 'post' as const,
      id: p.id,
      title: p.title,
      by: p.author.name,
      type: p.type,
      at: p.createdAt.toISOString(),
    })),
    ...recentPolls.map((p) => ({
      kind: 'poll' as const,
      id: p.id,
      title: p.title,
      by: null,
      type: null,
      at: p.createdAt.toISOString(),
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));
  return merged.slice(0, limit);
}

// -----------------------------------------------------------------------------
// Handler: GET /api/v1/public/[recurso]  (read-only, sin auth)
// -----------------------------------------------------------------------------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ ok: false, error: `Método ${method} no permitido (solo lectura)` });
  }

  const resource = String(req.query.resource ?? '').replace(/[^a-z]/g, '');
  if (!isPublicResource(resource)) {
    return res.status(404).json({
      ok: false,
      error: `Recurso público desconocido. Disponibles: ${PUBLIC_RESOURCES.join(', ')}`,
    });
  }

  const limit = publicLimit(req as any);
  try {
    let data: unknown;
    switch (resource) {
      case 'community': data = await community(db); break;
      case 'posts': data = await posts(db, limit); break;
      case 'guilds': data = await guilds(db, limit); break;
      case 'requests': data = await requests(db, limit); break;
      case 'polls': data = await polls(db, limit); break;
      case 'activity': data = await activity(db, limit); break;
    }
    return ok(res, data, {
      resource,
      version: PUBLIC_VERSION,
      limit,
      generatedAt: new Date().toISOString(),
      publicOnly: true,
    });
  } catch (error) {
    console.error(`Error en /api/v1/public/${resource}:`, error);
    return res.status(500).json({ ok: false, error: 'Error interno al leer datos públicos' });
  }
}
