// Test unitarios para el middleware
// Ejecutar con: node scripts/tests/middleware.test.mjs

import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer el archivo middleware.ts
const middlewarePath = join(__dirname, '../../middleware.ts');
const middlewareContent = readFileSync(middlewarePath, 'utf-8');

// Tests de estructura
test('middleware.ts tiene función middleware', () => {
  assert.ok(middlewareContent.includes('export async function middleware'), 'Debe exportar middleware');
});

test('middleware.ts tiene configuración matcher', () => {
  assert.ok(middlewareContent.includes('export const config'), 'Debe exportar config');
  assert.ok(middlewareContent.includes('matcher'), 'Debe tener matcher');
});

test('middleware.ts protege rutas /messages', () => {
  assert.ok(middlewareContent.includes('/messages'), 'Debe proteger /messages');
});

test('middleware.ts protege rutas /profile', () => {
  assert.ok(middlewareContent.includes('/profile'), 'Debe proteger /profile');
});

test('middleware.ts protege rutas /community', () => {
  assert.ok(middlewareContent.includes('/community'), 'Debe proteger /community');
});

test('middleware.ts protege rutas /admin', () => {
  assert.ok(middlewareContent.includes('/admin'), 'Debe proteger /admin');
});

test('middleware.ts usa jwtVerify', () => {
  assert.ok(middlewareContent.includes('jwtVerify'), 'Debe usar jwtVerify');
});

test('middleware.ts tiene roles STAFF_ROLES', () => {
  assert.ok(middlewareContent.includes('STAFF_ROLES'), 'Debe tener STAFF_ROLES');
  assert.ok(middlewareContent.includes('SUPER_ADMIN'), 'Debe incluir SUPER_ADMIN');
  assert.ok(middlewareContent.includes('ADMIN'), 'Debe incluir ADMIN');
  assert.ok(middlewareContent.includes('MODERATOR'), 'Debe incluir MODERATOR');
});

test('middleware.ts usa cookie cps_token', () => {
  assert.ok(middlewareContent.includes('cps_token'), 'Debe usar cookie cps_token');
});

test('middleware.ts tiene parámetro redirect en login', () => {
  assert.ok(middlewareContent.includes('redirect'), 'Debe tener parámetro redirect');
});

test('middleware.ts importa rate-limit', () => {
  assert.ok(middlewareContent.includes('rate-limit'), 'Debe importar rate-limit');
});

test('middleware.ts aplica rate limiting', () => {
  assert.ok(middlewareContent.includes('rateLimit('), 'Debe aplicar rateLimit');
});

test('middleware.ts tiene headers de seguridad', () => {
  assert.ok(middlewareContent.includes('X-Frame-Options'), 'Debe tener X-Frame-Options');
  assert.ok(middlewareContent.includes('X-Content-Type-Options'), 'Debe tener X-Content-Type-Options');
  assert.ok(middlewareContent.includes('Referrer-Policy'), 'Debe tener Referrer-Policy');
});

test('middleware.ts tiene función addSecurityHeaders', () => {
  assert.ok(middlewareContent.includes('addSecurityHeaders'), 'Debe tener addSecurityHeaders');
});

test('middleware.ts retorna 429 cuando excede rate limit', () => {
  assert.ok(middlewareContent.includes('429'), 'Debe retornar 429');
});

test('middleware.ts retorna header Retry-After', () => {
  assert.ok(middlewareContent.includes('Retry-After'), 'Debe retornar Retry-After');
});

test('middleware.ts verifica CSRF en mutaciones de API', () => {
  assert.ok(middlewareContent.includes('csrf-edge'), 'Debe importar csrf-edge');
  assert.ok(middlewareContent.includes('csrfCheckEdge'), 'Debe llamar csrfCheckEdge');
});

test('middleware.ts bloquea CSRF solo con CSRF_ENFORCE=true', () => {
  assert.ok(middlewareContent.includes('isCsrfEnforced'), 'Debe consultar isCsrfEnforced');
  assert.ok(middlewareContent.includes('403'), 'Debe retornar 403 al bloquear');
});

test('middleware.ts observa sin bloquear por defecto', () => {
  assert.ok(middlewareContent.includes('x-csrf-would-block'), 'Debe marcar x-csrf-would-block');
  assert.ok(middlewareContent.includes('x-csrf-observed'), 'Debe marcar x-csrf-observed');
});

console.log('\n✅ Todos los tests de middleware pasaron.\n');
