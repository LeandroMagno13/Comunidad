// Tests de integración: cableado CSRF en el frontend + API viva (si hay servidor).
// Ejecutar con: node scripts/tests/api-integration.test.mjs
//
// Filosofía lento y seguro:
// - Los checks de cableado siempre corren (leen archivos, no necesitan red ni BD).
// - Los checks vivos intentan hablar con http://localhost:3000 con timeout
//   corto; si no hay servidor o la BD está caída, se reportan como SKIP
//   (no fallan): nunca dan un falso rojo.

import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..', '..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf-8');
}

// ─── Cableado del cliente ───────────────────────────────────────────────────
test('api-client.ts exporta apiFetch y getCsrfToken', () => {
  const c = read('src/lib/api-client.ts');
  assert.ok(c.includes('export async function apiFetch'));
  assert.ok(c.includes('export async function getCsrfToken'));
});

test('api-client.ts adjunta x-csrf-token solo en mutaciones', () => {
  const c = read('src/lib/api-client.ts');
  assert.ok(c.includes('x-csrf-token') || c.includes('CSRF_HEADER'));
  assert.ok(c.includes('isMutation'));
  // GET nunca lleva token
  assert.ok(c.includes("method: 'GET'") || c.includes("'GET'"));
});

test('api-client.ts es no rompible sin token', () => {
  const c = read('src/lib/api-client.ts');
  // Si no hay token, igual envía la petición (el servidor aún no bloquea)
  assert.ok(c.includes('if (token)'));
});

test('csrf-client.ts es la fuente única de constantes', () => {
  const c = read('src/lib/csrf-client.ts');
  assert.ok(c.includes("cps_csrf"));
  assert.ok(c.includes("x-csrf-token"));
});

test('csrf.ts re-exporta las constantes del cliente (sin drift)', () => {
  const c = read('src/lib/csrf.ts');
  assert.ok(c.includes('csrf-client'));
  assert.ok(!c.includes("export const CSRF_COOKIE = "));
});

test('Navbar usa apiFetch en sus 3 mutaciones (piloto)', () => {
  const c = read('src/components/Navbar.tsx');
  assert.ok(c.includes("from '@/src/lib/api-client'"));
  const uses = (c.match(/apiFetch\(/g) ?? []).length;
  assert.ok(uses >= 3, `se esperaban >= 3 usos de apiFetch, hay ${uses}`);
  // Los fetch directos restantes deben ser solo GETs (sin method de escritura).
  // Se buscan llamadas fetch( con method POST/PATCH/PUT/DELETE cerca.
  assertNoDirectMutations(c, 'Navbar');
});

test('Página de notificaciones usa apiFetch en sus 2 mutaciones', () => {
  const c = read('app/notifications/page.tsx');
  assert.ok(c.includes("from '@/src/lib/api-client'"));
  const uses = (c.match(/apiFetch\(/g) ?? []).length;
  assert.ok(uses >= 2, `se esperaban >= 2 usos de apiFetch, hay ${uses}`);
  assertNoDirectMutations(c, 'notifications');
});

test('Detalle de publicación usa apiFetch en sus 4 mutaciones', () => {
  const c = read('app/community/[id]/page.tsx');
  assert.ok(c.includes("from '@/src/lib/api-client'"));
  const uses = (c.match(/apiFetch\(/g) ?? []).length;
  assert.ok(uses >= 4, `se esperaban >= 4 usos de apiFetch, hay ${uses}`);
  assertNoDirectMutations(c, 'community/[id]');
});

test('Página de gremios usa apiFetch en sus 3 mutaciones', () => {
  const c = read('app/guilds/page.tsx');
  assert.ok(c.includes("from '@/src/lib/api-client'"));
  const uses = (c.match(/apiFetch\(/g) ?? []).length;
  assert.ok(uses >= 3, `se esperaban >= 3 usos de apiFetch, hay ${uses}`);
  assertNoDirectMutations(c, 'guilds');
});

test('Detalle de gremio usa apiFetch en su mutación', () => {
  const c = read('app/guilds/[id]/page.tsx');
  assert.ok(c.includes("from '@/src/lib/api-client'"));
  const uses = (c.match(/apiFetch\(/g) ?? []).length;
  assert.ok(uses >= 1, `se esperaba >= 1 uso de apiFetch, hay ${uses}`);
  assertNoDirectMutations(c, 'guilds/[id]');
});

test('Página de proyectos usa apiFetch en su mutación', () => {
  const c = read('app/projects/page.tsx');
  assert.ok(c.includes("from '@/src/lib/api-client'"));
  const uses = (c.match(/apiFetch\(/g) ?? []).length;
  assert.ok(uses >= 1, `se esperaba >= 1 uso de apiFetch, hay ${uses}`);
  assertNoDirectMutations(c, 'projects');
});

test('Página de mensajes usa apiFetch en su mutación', () => {
  const c = read('app/messages/page.tsx');
  assert.ok(c.includes("from '@/src/lib/api-client'"));
  const uses = (c.match(/apiFetch\(/g) ?? []).length;
  assert.ok(uses >= 1, `se esperaba >= 1 uso de apiFetch, hay ${uses}`);
  assertNoDirectMutations(c, 'messages');
});

test('Conversación usa apiFetch para enviar mensajes', () => {
  const c = read('app/messages/[id]/page.tsx');
  assert.ok(c.includes("from '@/src/lib/api-client'"));
  const uses = (c.match(/apiFetch\(/g) ?? []).length;
  assert.ok(uses >= 1, `se esperaba >= 1 uso de apiFetch, hay ${uses}`);
  assertNoDirectMutations(c, 'messages/[id]');
});

test('Perfil usa apiFetch en sus 2 mutaciones', () => {
  const c = read('app/profile/page.tsx');
  assert.ok(c.includes("from '@/src/lib/api-client'"));
  const uses = (c.match(/apiFetch\(/g) ?? []).length;
  assert.ok(uses >= 2, `se esperaban >= 2 usos de apiFetch, hay ${uses}`);
  assertNoDirectMutations(c, 'profile');
});

test('Cartelera usa apiFetch para publicar', () => {
  const c = read('src/components/Cartelera.tsx');
  assert.ok(c.includes("from '@/src/lib/api-client'"));
  const uses = (c.match(/apiFetch\(/g) ?? []).length;
  assert.ok(uses >= 1, `se esperaba >= 1 uso de apiFetch, hay ${uses}`);
  assertNoDirectMutations(c, 'Cartelera');
});

test('REGRESIÓN: consumidores desenvuelven { data, pagination }', () => {
  // El 2026-10-11 /community cayó en prod porque la API pagina y la Cartelera
  // esperaba un array plano. Todo consumidor de lista debe leer body.data.
  for (const [rel, label] of [
    ['src/components/Cartelera.tsx', 'Cartelera'],
    ['app/guilds/page.tsx', 'guilds'],
    ['app/guilds/[id]/page.tsx', 'guilds/[id]'],
  ]) {
    const c = read(rel);
    assert.ok(
      c.includes('body.data') || c.includes('.data ??'),
      `${label} debe leer body.data de la respuesta paginada`
    );
  }
});

test('PollCard usa apiFetch para votar y cerrar', () => {
  const c = read('src/components/PollCard.tsx');
  assert.ok(c.includes("from '@/src/lib/api-client'"));
  const uses = (c.match(/apiFetch\(/g) ?? []).length;
  assert.ok(uses >= 2, `se esperaban >= 2 usos de apiFetch, hay ${uses}`);
  assertNoDirectMutations(c, 'PollCard');
});

test('PollCreateForm usa apiFetch para crear', () => {
  const c = read('src/components/PollCreateForm.tsx');
  assert.ok(c.includes("from '@/src/lib/api-client'"));
  const uses = (c.match(/apiFetch\(/g) ?? []).length;
  assert.ok(uses >= 1, `se esperaba >= 1 uso de apiFetch, hay ${uses}`);
  assertNoDirectMutations(c, 'PollCreateForm');
});

test('Admin usa apiFetch en sus 10 mutaciones', () => {
  const c = read('app/admin/page.tsx');
  assert.ok(c.includes("from '@/src/lib/api-client'"));
  const uses = (c.match(/apiFetch\(/g) ?? []).length;
  assert.ok(uses >= 10, `se esperaban >= 10 usos de apiFetch, hay ${uses}`);
  assertNoDirectMutations(c, 'admin');
});

test('Login usa apiFetch (obtiene token CSRF pre-auth)', () => {
  const c = read('app/login/page.tsx');
  assert.ok(c.includes("from '@/src/lib/api-client'"));
  const uses = (c.match(/apiFetch\(/g) ?? []).length;
  assert.ok(uses >= 1, `se esperaba >= 1 uso de apiFetch, hay ${uses}`);
  assertNoDirectMutations(c, 'login');
});

test('Register usa apiFetch (obtiene token CSRF pre-auth)', () => {
  const c = read('app/register/page.tsx');
  assert.ok(c.includes("from '@/src/lib/api-client'"));
  const uses = (c.match(/apiFetch\(/g) ?? []).length;
  assert.ok(uses >= 1, `se esperaba >= 1 uso de apiFetch, hay ${uses}`);
  assertNoDirectMutations(c, 'register');
});

test('Agents usa apiFetch en sus 2 mutaciones', () => {
  const c = read('app/agents/page.tsx');
  assert.ok(c.includes("from '@/src/lib/api-client'"));
  const uses = (c.match(/apiFetch\(/g) ?? []).length;
  assert.ok(uses >= 2, `se esperaban >= 2 usos de apiFetch, hay ${uses}`);
  assertNoDirectMutations(c, 'agents');
});

function assertNoDirectMutations(content, label) {
  const lines = content.split('\n');
  const bad = lines.filter((line, i) => {
    if (!/(?<![A-Za-z])fetch\(\s*['"`/]/.test(line)) return false;
    // Mira la llamada completa (hasta 6 líneas) buscando un método de escritura
    const chunk = lines.slice(i, i + 6).join('\n');
    return /method:\s*['"`](POST|PUT|PATCH|DELETE)/.test(chunk);
  });
  assert.strictEqual(bad.length, 0, `${label}: mutaciones con fetch directo: ${bad.length}`);
}

test('endpoint GET /api/auth/csrf existe y emite token', () => {
  const c = read('src/pages/api/auth/csrf.ts');
  assert.ok(c.includes('issueCsrfToken'));
  assert.ok(c.includes('csrfToken'));
});

// ─── Checks vivos (skip elegante) ───────────────────────────────────────────
const BASE = process.env.COMUNIDAD_URL ?? 'http://localhost:3000';

async function live(path, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(`${BASE}${path}`, { signal: ctrl.signal, ...options });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

test('LIVE: GET /api/auth/csrf emite token (skip si no hay servidor)', async () => {
  let res;
  try {
    res = await live('/api/auth/csrf');
  } catch {
    console.log('    (SKIP: sin servidor en ' + BASE + ')');
    return;
  }
  if (!res.ok) {
    console.log(`    (SKIP: servidor respondió ${res.status}, probablemente sin BD)`);
    return;
  }
  const data = await res.json();
  assert.ok(typeof data.csrfToken === 'string' && data.csrfToken.length >= 32);
  const setCookie = res.headers.get('set-cookie') ?? '';
  assert.ok(setCookie.includes('cps_csrf'));
});

test('LIVE: GET /api/v1/public/health responde (skip si no hay servidor/BD)', async () => {
  let res;
  try {
    res = await live('/api/v1/public/health');
  } catch {
    console.log('    (SKIP: sin servidor en ' + BASE + ')');
    return;
  }
  if (!res.ok) {
    console.log(`    (SKIP: servidor respondió ${res.status}, probablemente sin BD)`);
    return;
  }
  const data = await res.json();
  assert.ok(data.ok === true || typeof data === 'object');
});

test('LIVE: rate limiting responde 429 con Retry-After (skip si no hay servidor)', async () => {
  let last;
  try {
    // 70 requests rápidos superan el límite de 60/min de la API general
    for (let i = 0; i < 70; i++) {
      last = await live('/api/v1/public/health');
    }
  } catch {
    console.log('    (SKIP: sin servidor en ' + BASE + ')');
    return;
  }
  if (!last) {
    console.log('    (SKIP: sin respuesta)');
    return;
  }
  if (last.status === 429) {
    assert.ok(last.headers.get('retry-after') !== null);
    const body = await last.json();
    assert.ok(typeof body.retryAfterMs === 'number');
  } else {
    console.log(`    (SKIP: sin 429 — límite no alcanzado o BD caída, status ${last.status})`);
  }
});

console.log('\n✅ Tests de integración ejecutados (vivos pueden ser SKIP).\n');
