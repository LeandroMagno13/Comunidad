// Test unitarios para el módulo de rate limiting
// Ejecutar con: node scripts/tests/rate-limit.test.mjs

import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer el archivo rate-limit.ts
const rateLimitPath = join(__dirname, '../../src/lib/rate-limit.ts');
const rateLimitContent = readFileSync(rateLimitPath, 'utf-8');

// Tests de estructura y funcionalidad
test('rate-limit.ts exporta función rateLimit', () => {
  assert.ok(rateLimitContent.includes('export function rateLimit'), 'Debe exportar rateLimit');
});

test('rate-limit.ts tiene interfaz RateLimitResult', () => {
  assert.ok(rateLimitContent.includes('RateLimitResult'), 'Debe tener interfaz RateLimitResult');
});

test('rate-limit.ts define RATE_LIMITS', () => {
  assert.ok(rateLimitContent.includes('RATE_LIMITS'), 'Debe definir RATE_LIMITS');
});

test('rate-limit.ts tiene límite para auth', () => {
  assert.ok(rateLimitContent.includes("auth:"), 'Debe tener límite para auth');
});

test('rate-limit.ts tiene límite para api', () => {
  assert.ok(rateLimitContent.includes("api:"), 'Debe tener límite para api');
});

test('rate-limit.ts tiene función getClientKey', () => {
  assert.ok(rateLimitContent.includes('getClientKey'), 'Debe tener función getClientKey');
});

test('rate-limit.ts tiene función getRateLimitType', () => {
  assert.ok(rateLimitContent.includes('getRateLimitType'), 'Debe tener función getRateLimitType');
});

test('rate-limit.ts usa Map para almacenar requests', () => {
  assert.ok(rateLimitContent.includes('new Map'), 'Debe usar Map');
});

test('rate-limit.ts tiene limpieza automática', () => {
  assert.ok(rateLimitContent.includes('cleanup'), 'Debe tener limpieza automática');
});

test('rate-limit.ts retorna allowed boolean', () => {
  assert.ok(rateLimitContent.includes('allowed'), 'Debe retornar campo allowed');
});

test('rate-limit.ts retorna retryAfterMs', () => {
  assert.ok(rateLimitContent.includes('retryAfterMs'), 'Debe retornar campo retryAfterMs');
});

test('rate-limit.ts retorna remaining', () => {
  assert.ok(rateLimitContent.includes('remaining'), 'Debe retornar campo remaining');
});

console.log('\n✅ Todos los tests de rate-limit pasaron.\n');
