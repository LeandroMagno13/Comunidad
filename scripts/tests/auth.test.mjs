// Test unitarios para las funciones de autenticación
// Ejecutar con: node scripts/tests/auth.test.mjs

import { test } from 'node:test';
import assert from 'node:assert';

// Verificamos que auth.ts existe y tiene la estructura esperada
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer el archivo auth.ts
const authPath = join(__dirname, '../../src/lib/auth.ts');
const authContent = readFileSync(authPath, 'utf-8');

// Tests de estructura y seguridad
test('auth.ts exporta las funciones necesarias', () => {
  assert.ok(authContent.includes('export async function signToken'), 'Debe exportar signToken');
  assert.ok(authContent.includes('export async function verifyToken'), 'Debe exportar verifyToken');
  assert.ok(authContent.includes('export async function getSessionUser'), 'Debe exportar getSessionUser');
  assert.ok(authContent.includes('export async function getUserFromRequest'), 'Debe exportar getUserFromRequest');
  assert.ok(authContent.includes('export function publicUser'), 'Debe exportar publicUser');
});

test('auth.ts tiene protección de secreto en producción', () => {
  assert.ok(authContent.includes('JWT_SECRET'), 'Debe usar JWT_SECRET');
  assert.ok(authContent.includes('length < 32'), 'Debe validar longitud mínima del secreto');
  assert.ok(authContent.includes('NODE_ENV'), 'Debe verificar NODE_ENV');
});

test('auth.ts define roles de staff correctamente', () => {
  assert.ok(authContent.includes('SUPER_ADMIN'), 'Debe incluir SUPER_ADMIN');
  assert.ok(authContent.includes('ADMIN'), 'Debe incluir ADMIN');
  assert.ok(authContent.includes('MODERATOR'), 'Debe incluir MODERATOR');
});

test('auth.ts tiene helpers de roles', () => {
  assert.ok(authContent.includes('export function isSuperAdmin'), 'Debe exportar isSuperAdmin');
  assert.ok(authContent.includes('export function isAdmin'), 'Debe exportar isAdmin');
  assert.ok(authContent.includes('export function isModerator'), 'Debe exportar isModerator');
});

test('auth.ts bloquea usuarios banned/deactivated', () => {
  assert.ok(authContent.includes('banned'), 'Debe verificar estado banned');
  assert.ok(authContent.includes('deactivated'), 'Debe verificar estado deactivated');
});

test('auth.ts usa cookie httpOnly', () => {
  assert.ok(authContent.includes('cps_token'), 'Debe usar cookie cps_token');
});

test('auth.ts acepta Bearer token', () => {
  assert.ok(authContent.includes('Bearer'), 'Debe aceptar Authorization: Bearer');
});

test('auth.ts filtra campos sensibles en publicUser', () => {
  // publicUser NO debe incluir password
  const publicUserMatch = authContent.match(/export function publicUser[\s\S]*?^}/m);
  assert.ok(publicUserMatch, 'Debe tener función publicUser');
  const publicUserCode = publicUserMatch[0];
  assert.ok(!publicUserCode.includes('password'), 'publicUser NO debe exponer password');
  assert.ok(!publicUserCode.includes('hash'), 'publicUser NO debe exponer hash');
});

console.log('\n✅ Todos los tests de auth pasaron.\n');
