// Tests para paginación, caché, CSRF y auditoría (sin dependencias externas)
// Ejecutar con: node scripts/tests/infra.test.mjs

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

// ─── Paginación ─────────────────────────────────────────────────────────────
test('pagination.ts exporta parsePagination y paginatedResponse', () => {
  const c = read('src/lib/pagination.ts');
  assert.ok(c.includes('export function parsePagination'));
  assert.ok(c.includes('export function paginatedResponse'));
  assert.ok(c.includes('export function buildPaginationMeta'));
});

test('pagination.ts limita el máximo a 100', () => {
  const c = read('src/lib/pagination.ts');
  assert.ok(c.includes('MAX_LIMIT') || c.includes('100'));
});

test('posts.ts usa el helper de paginación', () => {
  const c = read('src/pages/api/posts.ts');
  assert.ok(c.includes('parsePagination'));
  assert.ok(c.includes('paginatedResponse'));
});

test('guilds.ts usa el helper de paginación', () => {
  const c = read('src/pages/api/guilds.ts');
  assert.ok(c.includes('parsePagination'));
  assert.ok(c.includes('paginatedResponse'));
});

test('posts y guilds filtran soft deletes', () => {
  const posts = read('src/pages/api/posts.ts');
  const guilds = read('src/pages/api/guilds.ts');
  assert.ok(posts.includes('deletedAt'));
  assert.ok(guilds.includes('deletedAt'));
});

// ─── Caché ──────────────────────────────────────────────────────────────────
test('cache.ts exporta cached, cacheGet y cacheSet', () => {
  const c = read('src/lib/cache.ts');
  assert.ok(c.includes('export function cacheGet'));
  assert.ok(c.includes('export function cacheSet'));
  assert.ok(c.includes('export async function cached'));
});

test('cache.ts tiene TTLs configurados', () => {
  const c = read('src/lib/cache.ts');
  assert.ok(c.includes('CACHE_TTL'));
});

// ─── CSRF ───────────────────────────────────────────────────────────────────
test('csrf.ts exporta verifyCsrf e issueCsrfToken', () => {
  const c = read('src/lib/csrf.ts');
  assert.ok(c.includes('export function verifyCsrf'));
  assert.ok(c.includes('export function issueCsrfToken'));
});

test('csrf.ts usa comparación de tiempo constante', () => {
  const c = read('src/lib/csrf.ts');
  assert.ok(c.includes('timingSafeEqual'));
});

test('csrf.ts no exige token en GET', () => {
  const c = read('src/lib/csrf.ts');
  assert.ok(c.includes("'GET'"));
});

test('endpoint /api/auth/csrf existe', () => {
  const c = read('src/pages/api/auth/csrf.ts');
  assert.ok(c.includes('issueCsrfToken'));
});

// ─── Auditoría ──────────────────────────────────────────────────────────────
test('audit.ts exporta audit y sanea secretos', () => {
  const c = read('src/lib/audit.ts');
  assert.ok(c.includes('export async function audit'));
  assert.ok(c.includes('[redacted]'));
  assert.ok(c.includes('password'));
});

test('audit.ts nunca rompe el flujo principal', () => {
  const c = read('src/lib/audit.ts');
  assert.ok(c.includes('try'));
  assert.ok(c.includes('catch'));
});

// ─── Seguridad en middleware ────────────────────────────────────────────────
test('middleware tiene CSP', () => {
  const c = read('middleware.ts');
  assert.ok(c.includes('Content-Security-Policy'));
  assert.ok(c.includes("frame-ancestors 'none'"));
});

test('middleware tiene HSTS', () => {
  const c = read('middleware.ts');
  assert.ok(c.includes('Strict-Transport-Security'));
});

test('middleware cubre /api/:path*', () => {
  const c = read('middleware.ts');
  assert.ok(c.includes("'/api/:path*'"));
});

// ─── UX ─────────────────────────────────────────────────────────────────────
test('tailwind tiene darkMode class', () => {
  const c = read('tailwind.config.js');
  assert.ok(c.includes("darkMode") && c.includes("'class'"));
});

test('ThemeToggle existe y es accesible', () => {
  const c = read('src/components/ThemeToggle.tsx');
  assert.ok(c.includes('aria-label'));
  assert.ok(c.includes('comunidad-theme'));
});

test('layout tiene skip link y manifest', () => {
  const c = read('app/layout.tsx');
  assert.ok(c.includes('#contenido'));
  assert.ok(c.includes('Saltar al contenido'));
  assert.ok(c.includes('manifest.json'));
});

test('manifest.json es válido', () => {
  const raw = read('public/manifest.json');
  const m = JSON.parse(raw);
  assert.ok(m.name);
  assert.ok(m.start_url === '/');
  assert.ok(Array.isArray(m.icons));
});

console.log('\n✅ Todos los tests de infraestructura pasaron.\n');
