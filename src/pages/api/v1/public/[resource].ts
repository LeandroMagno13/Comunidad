// =============================================================================
// API PUBLICA READ-ONLY DE POSTSINGULAR (RONDA F, membrana de integracion).
// [RONDA H(b)] RONDA H(b) anade el recurso `users` (solo datos ya publicos:
// id publico, nombre publico, timestamps, y gremios publicos del usuario) y
// la consulta incremental `?since=<ISO>` con paginacion por cursor para que un
// agente externo detecte novedades (usuarios/posts/guilds nuevos) sin
// descargar todo el sitio cada hora. Cero escalamiento, cero bandejas
// internas, cero datos privados, cero promesas futuras.
//
// Estos handlers responden a `/api/v1/public/*`. Son 100% aditivos y de SOLO
// LECTURA: nunca escriben, nunca exponen secretos/emails/datos privados. La
// info que devuelven es exactamente la que ya era publica en la web (comunidad,
// publicaciones visibles, gremios, pedidos, encuestas, usuarios publicos y
// actividad reciente), pero servida como JSON para que agentes externos la
// consuman sin autenticarse.
//
// Convencion: `GET /api/v1/public/[recurso]?limit=&desde=` devuelve
// { ok, data, meta } con `data` limitado (default 50, max 200) y `meta` con
// timestamp y totales publicos. Cualquier parametro que pida datos privados
// (ej: `mine=true`) se ignora por seguridad.
// =============================================================================

import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { publicUser } from '@/src/lib/auth';

export const PUBLIC_VERSION = 'v1';
export const PUBLIC_DEFAULT_LIMIT = 50;
export const PUBLIC_MAX_LIMIT = 200;

// -----------------------------------------------------------------------------
// Recursos publicos disponibles (solo lectura, sin autenticacion).
// [RONDA H(b)] se agrega `users`. Orden de aparicion es el contrato real.
// -----------------------------------------------------------------------------
export const PUBLIC_RESOURCES = [
  'health',    // disponibilidad básica del servicio público
  'community', // resumen de metricas publicas de la comunidad
  'posts',     // publicaciones visibles
  'guilds',    // gremios con miembros activos
  'requests',  // pedidos comunales visibles
  'polls',     // encuestas visibles
  'activity',  // actividad reciente (posts + encuestas combinadas)
  'users',     // [RONDA H(b)] usuarios publicos (id, nombre, timestamps, gremios)
] as const;

export type PublicResource = (typeof PUBLIC_RESOURCES)[number];

export function isPublicResource(r: string): r is PublicResource {
  return (PUBLIC_RESOURCES as readonly string[]).includes(r);
}

// [RONDA H(b)] Cursor incremental opcional: `?since=<ISO timestamp>`.
// Devuelve undefined si no viene o no es un ISO valido (comportamiento previo).
export function sinceFilter(req: NextApiRequest): Date | undefined {
  const raw = req.query?.since;
  if (typeof raw !== 'string' || !raw) return undefined;
  const d = new Date(raw);
  return !Number.isNaN(d.getTime()) ? d : undefined;
}

export function publicLimit(req: NextApiRequest): number {
  const raw = req.query?.limit;
  const n = typeof raw === 'string' ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n < 1) return PUBLIC_DEFAULT_LIMIT;
  return Math.min(n, PUBLIC_MAX_LIMIT);
}

// -----------------------------------------------------------------------------
// health: comprobación mínima, pública y sin acceso a datos de la comunidad.
// -----------------------------------------------------------------------------
function health() {
  return { status: 'ok', service: 'postsingular-public-api', version: PUBLIC_VERSION };
}

// -----------------------------------------------------------------------------
// community: metricas publicas agregadas (sin datos personales).
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
    currency: 'CU (Capacidad de Urgencia) - moneda interna de la comunidad',
    publicInfo: 'Datos agregados y publicos; cada miembro conserva su privacidad.',
  };
}

// -----------------------------------------------------------------------------
// users [RONDA H(b)]: usuarios PUBLICOS (nunca emails, hashes, tokens ni
// datos privados). Solo: id publico, nombre publico, timestamps y gremios
// publicos del usuario. Incremental por `?since=<ISO  >`
// spu mes luego la consulta real.
// -----------------------------------------------------------------------------
async function publicUsers(db_: typeof db, limit: number, since?: Date) {
  const rows = await db_.user.findMany({
    where: {
      status: 'active',
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      guildMemberships: {
        where: { status: 'active' },
        select: { guild: { select: { id: true, name: true } } },
      },
    },
  });
  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    guilds: u.guildMemberships.map((m) => ({
      id: m.guild.id,
      name: m.guild.name,
    })),
  }));
}

// -----------------------------------------------------------------------------
// posts: publicaciones visibles (autor publico, sin email/avatar privado).
// [RONDA H(b)] oficial: paginacion incremental por cursor `?since=<ISO  >`
// basada en la consulta real; el agente pregunta lo que aparecio despues de
// su ultima consulta sin inventar datos.
// -----------------------------------------------------------------------------
async function posts(db_: typeof db, limit: number, since?: Date) {
  const rows = await db_.post.findMany({
    where: {
      status: 'visible',
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      type: true,
      title: true,
      content: true,
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
    status: p.status,
    author: { id: p.author.id, name: p.author.name },
    createdAt: p.createdAt.toISOString(),
  }));
}

// -----------------------------------------------------------------------------
// guilds: gremios con su membresia activa (sin datos personales).
// [RONDA H(b)] oficial: incremental por `?since=<ISO>` sobre la consulta real.
// -----------------------------------------------------------------------------
async function guilds(db_: typeof db, limit: number, since?: Date) {
  const rows = await db_.guild.findMany({
    where: {
      status: 'visible',
      ...(since ? { createdAt: { gte: since } } : {}),
    },
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
// polls: encuestas visibles (opciones publicas, sin votos personales
// detallados).
// -----------------------------------------------------------------------------
async function polls(db_: typeof db, limit: number) {
  const rows = await db_.poll.findMany({
    where: {
      status: 'visible',
      OR: [{ postId: null }, { post: { is: { status: 'visible' } } }],
    },
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
    status: p.isClosed ? 'poll_closed' : 'poll_active',
    options: p.options.map((o) => ({
      id: o.id,
      text: o.text,
      votes: o._count.votes,
    })),
    totalVotes: p._count.votes,
    createdAt: p.createdAt.toISOString(),
  }));
}

// -----------------------------------------------------------------------------
// activity: actividad reciente de la comunidad (posts + encuestas combinadas).
// -----------------------------------------------------------------------------
async function activity(db_: typeof db, limit: number) {
  const half = Math.max(1, Math.ceil(limit / 2));
  const [recentPosts, recentPolls, publicCounts] = await Promise.all([
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
      where: {
        status: 'visible',
        OR: [{ postId: null }, { post: { is: { status: 'visible' } } }],
      },
      orderBy: { createdAt: 'desc' },
      take: half,
      select: { id: true, title: true, createdAt: true },
    }),
    Promise.all([
      db_.post.count({ where: { status: 'visible' } }),
      db_.poll.count({
        where: {
          status: 'visible',
          OR: [{ postId: null }, { post: { is: { status: 'visible' } } }],
        },
      }),
      db_.user.count({ where: { status: 'active' } }),
    ]),
  ]);
  const [postsTotal, pollsTotal, usersTotal] = publicCounts;
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
  return {
    entries: merged.slice(0, limit),
    totals: { posts: postsTotal, polls: pollsTotal, users: usersTotal },
  };
}

// -----------------------------------------------------------------------------
// GET /api/v1/public/[recurso]  (read-only, sin autenticacion).
// -----------------------------------------------------------------------------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      ok: false,
      error: 'Metodo no permitido (solo lectura)',
    });
  }
  const resource = String(req.query.resource ?? '').replace(/[^a-z]/g, '');
  if (!isPublicResource(resource)) {
    return res.status(404).json({
      ok: false,
      error: `Recurso publico desconocido. Disponibles: ${PUBLIC_RESOURCES.join(', ')}`,
    });
  }
  const limit = publicLimit(req);
  const since = sinceFilter(req); // [RONDA H(b)] cursor incremental
  try {
    let data: unknown;
    switch (resource) {
      case 'health': data = health(); break;
      case 'community': data = await community(db); break;
      case 'posts': data = await posts(db, limit, since); break;
      case 'guilds': data = await guilds(db, limit, since); break;
      case 'requests': data = await requests(db, limit); break;
      case 'polls': data = await polls(db, limit); break;
      case 'activity': data = await activity(db, limit); break;
      case 'users': data = await publicUsers(db, limit, since); break; // [RONDA H(b)]
    }
    return res.status(200).json({
      ok: true,
      data,
      meta: {
        resource,
        version: PUBLIC_VERSION,
        limit,
        since: since ? since.toISOString() : undefined,
        generatedAt: new Date().toISOString(),
        publicOnly: true,
      },
    });
  } catch (error) {
    console.error('Error en public resource:', error);
    return res.status(500).json({ ok: false, error: 'Error interno al leer datos publicos' });
  }
}
