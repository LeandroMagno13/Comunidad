// =============================================================================
// CANALES RSS 2.0 Y ATOM 1.0 DE POSTSINGULAR (solo lectura, ZERO-LEAK).
//
// Genera los feeds de actividad reciente (publicaciones + encuestas visibles)
// usando la MISMA consulta que la API publica y la web: el feed ve la misma
// realidad que un visitante, ni mas. Nunca expone email, password, hash,
// token, avatar ni datos privados.
//
// Alimenta /feed.xml (RSS 2.0) y /feed.atom (Atom 1.0).
// =============================================================================

import { db } from '@/src/lib/db';
import { htmlToText } from '@/src/lib/sanitize';

export const FEED_BASE_URL = 'https://www.postsingular.org';
export const FEED_DEFAULT_LIMIT = 20;
export const FEED_MAX_LIMIT = 200;

export interface FeedEntry {
  /** Identificador permanente y unico (se usa como id Atom / guid RSS). */
  id: string;
  kind: 'post' | 'poll';
  title: string;
  link: string;
  author: string | null;
  published: string;
  updated: string;
  summary: string;
  html: string;
  categories: string[];
}

// -----------------------------------------------------------------------------
// Helpers (XML bien formado, sin dependencias externas).
// -----------------------------------------------------------------------------

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

function excerpt(text: string, max = 200): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}

function rfc822(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

function summaryOf(html: string): string {
  return excerpt(htmlToText(html || ''));
}

// -----------------------------------------------------------------------------
// Consulta: actividad publica reciente (posts visibles + encuestas, mezcladas
// por fecha). Misma realidad que /api/v1/public/activity y la cartelera.
// -----------------------------------------------------------------------------

function postTypeCategory(type: string | null): string | null {
  if (!type || type === 'update') return null;
  const label: Record<string, string> = {
    info: 'Información',
    request: 'Solicitud',
    poll: 'Encuesta',
  };
  return label[type] ?? type;
}

export function feedLimit(raw: string | null): number {
  const n = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n < 1) return FEED_DEFAULT_LIMIT;
  return Math.min(n, FEED_MAX_LIMIT);
}

export async function getFeedEntries(limit: number): Promise<FeedEntry[]> {
  const half = Math.max(1, Math.ceil(limit / 2));
  const [posts, polls] = await Promise.all([
    db.post.findMany({
      where: { status: 'visible' },
      orderBy: { createdAt: 'desc' },
      take: half,
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true } },
        guild: { select: { id: true, name: true } },
      },
    }),
    db.poll.findMany({
      where: {
        status: 'visible',
        OR: [{ postId: null }, { post: { is: { status: 'visible' } } }],
      },
      orderBy: { createdAt: 'desc' },
      take: half,
      select: {
        id: true,
        title: true,
        description: true,
        scope: true,
        guildId: true,
        postId: true,
        createdAt: true,
        options: { select: { id: true, text: true, _count: { select: { votes: true } } } },
        _count: { select: { votes: true } },
      },
    }),
  ]);

  const postEntries: FeedEntry[] = posts.map((p) => {
    const html = p.content || '';
    const categories = [
      'Publicaciones',
      postTypeCategory(p.type),
      p.guild ? p.guild.name : null,
    ].filter(Boolean) as string[];
    return {
      id: `${FEED_BASE_URL}/community/${p.id}`,
      kind: 'post',
      title: (p.title && p.title.trim()) || 'Publicación',
      link: `${FEED_BASE_URL}/community/${p.id}`,
      author: p.author.name,
      published: p.createdAt.toISOString(),
      updated: p.updatedAt.toISOString(),
      summary: excerpt(htmlToText(html) || 'Publicación pública sin texto adicional.'),
      html: html || '<p>Publicación pública sin texto adicional.</p>',
      categories,
    };
  });

  const pollEntries: FeedEntry[] = polls.map((poll) => {
    let link = `${FEED_BASE_URL}/community`;
    if (poll.postId) link = `${FEED_BASE_URL}/community/${poll.postId}`;
    else if (poll.guildId) link = `${FEED_BASE_URL}/guilds/${poll.guildId}`;
    const optionsHtml = poll.options
      .map(
        (o) =>
          `<li>${escapeXml(o.text)} &mdash; ${o._count.votes} voto${o._count.votes === 1 ? '' : 's'}</li>`,
      )
      .join('');
    const html =
      `<p>${escapeXml(poll.description || 'Encuesta pública de la comunidad.')}</p>` +
      `<ul>${optionsHtml}</ul>`;
    return {
      id: `${FEED_BASE_URL}/feed#poll-${poll.id}`,
      kind: 'poll',
      title: `Encuesta: ${poll.title}`,
      link,
      author: null,
      published: poll.createdAt.toISOString(),
      updated: poll.createdAt.toISOString(),
      summary: summaryOf(html),
      html,
      categories: [
        'Encuestas',
        poll.scope === 'guild' ? 'Encuestas de gremios' : 'Encuestas de la comunidad',
      ],
    };
  });

  return [...postEntries, ...pollEntries]
    .sort((a, b) => (a.published < b.published ? 1 : -1))
    .slice(0, limit);
}

// -----------------------------------------------------------------------------
// Serializadores XML.
// -----------------------------------------------------------------------------

export function atomXml(entries: FeedEntry[]): string {
  const now = new Date().toISOString();
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="utf-8"?>');
  lines.push('<feed xmlns="http://www.w3.org/2005/Atom">');
  lines.push('  <title>Comunidad Post Singularidad — Actividad reciente</title>');
  lines.push('  <subtitle>Publicaciones y encuestas públicas de la comunidad, en una sola corriente.</subtitle>');
  lines.push(`  <id>${FEED_BASE_URL}/feed.atom</id>`);
  lines.push(`  <link href="${FEED_BASE_URL}/feed.atom" rel="self" type="application/atom+xml"/>`);
  lines.push(`  <link href="${FEED_BASE_URL}/" rel="alternate" type="text/html"/>`);
  lines.push(`  <updated>${entries[0]?.updated ?? now}</updated>`);
  lines.push('  <author><name>Comunidad Post Singularidad</name></author>');
  lines.push('  <generator>Comunidad Post Singularidad</generator>');
  for (const e of entries) {
    lines.push('  <entry>');
    lines.push(`    <title>${escapeXml(e.title)}</title>`);
    lines.push(`    <id>${e.id}</id>`);
    lines.push(`    <link href="${e.link}" rel="alternate" type="text/html"/>`);
    lines.push(`    <published>${e.published}</published>`);
    lines.push(`    <updated>${e.updated}</updated>`);
    if (e.author) lines.push(`    <author><name>${escapeXml(e.author)}</name></author>`);
    lines.push(`    <summary type="text">${escapeXml(e.summary)}</summary>`);
    lines.push(`    <content type="html">${escapeXml(e.html)}</content>`);
    for (const c of e.categories) lines.push(`    <category term="${escapeXml(c)}"/>`);
    lines.push('  </entry>');
  }
  lines.push('</feed>');
  return lines.join('\n');
}

export function rssXml(entries: FeedEntry[]): string {
  const now = new Date().toUTCString();
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="utf-8"?>');
  lines.push('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">');
  lines.push('  <channel>');
  lines.push('    <title>Comunidad Post Singularidad — Actividad reciente</title>');
  lines.push(`    <link>${FEED_BASE_URL}/</link>`);
  lines.push('    <description>Publicaciones y encuestas públicas de la comunidad, en una sola corriente.</description>');
  lines.push('    <language>es-ar</language>');
  lines.push(`    <atom:link href="${FEED_BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>`);
  lines.push(`    <lastBuildDate>${now}</lastBuildDate>`);
  if (entries[0]) lines.push(`    <pubDate>${rfc822(entries[0].published)}</pubDate>`);
  for (const e of entries) {
    lines.push('    <item>');
    lines.push(`      <title>${escapeXml(e.title)}</title>`);
    lines.push(`      <link>${e.link}</link>`);
    lines.push(`      <guid isPermaLink="false">${e.id}</guid>`);
    lines.push(`      <pubDate>${rfc822(e.published)}</pubDate>`);
    if (e.author) lines.push(`      <dc:creator>${escapeXml(e.author)}</dc:creator>`);
    lines.push(`      <description>${cdata(e.html)}</description>`);
    for (const c of e.categories) lines.push(`      <category>${escapeXml(c)}</category>`);
    lines.push('    </item>');
  }
  lines.push('  </channel>');
  lines.push('</rss>');
  return lines.join('\n');
}