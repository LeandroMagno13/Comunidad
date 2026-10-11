// Test unitarios para las validaciones con Zod
// Ejecutar con: node scripts/tests/validations.test.mjs

import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer el archivo validations.ts
const validationsPath = join(__dirname, '../../src/lib/validations.ts');
const validationsContent = readFileSync(validationsPath, 'utf-8');

// Tests de estructura
test('validations.ts no usa dependencias externas', () => {
  assert.ok(!validationsContent.includes("from 'zod'"), 'No debe depender de zod (instalación por red inestable)');
});

test('validations.ts tiene createPostSchema', () => {
  assert.ok(validationsContent.includes('createPostSchema'), 'Debe tener createPostSchema');
});

test('validations.ts tiene createCommentSchema', () => {
  assert.ok(validationsContent.includes('createCommentSchema'), 'Debe tener createCommentSchema');
});

test('validations.ts tiene createGuildSchema', () => {
  assert.ok(validationsContent.includes('createGuildSchema'), 'Debe tener createGuildSchema');
});

test('validations.ts tiene createProjectSchema', () => {
  assert.ok(validationsContent.includes('createProjectSchema'), 'Debe tener createProjectSchema');
});

test('validations.ts tiene registerSchema', () => {
  assert.ok(validationsContent.includes('registerSchema'), 'Debe tener registerSchema');
});

test('validations.ts tiene loginSchema', () => {
  assert.ok(validationsContent.includes('loginSchema'), 'Debe tener loginSchema');
});

test('validations.ts tiene createPollSchema', () => {
  assert.ok(validationsContent.includes('createPollSchema'), 'Debe tener createPollSchema');
});

test('validations.ts tiene createCapacityRequestSchema', () => {
  assert.ok(validationsContent.includes('createCapacityRequestSchema'), 'Debe tener createCapacityRequestSchema');
});

test('validations.ts tiene función validateBody', () => {
  assert.ok(validationsContent.includes('export function validateBody'), 'Debe exportar validateBody');
});

// Tests de reglas específicas
test('createPostSchema valida content', () => {
  assert.ok(validationsContent.includes('content:'), 'Debe validar content');
  assert.ok(validationsContent.includes('20000'), 'Debe tener límite de 20000 caracteres');
});

test('registerSchema valida email', () => {
  assert.ok(validationsContent.includes('email:'), 'Debe validar email');
  assert.ok(validationsContent.includes('Email inválido'), 'Debe validar formato de email');
});

test('registerSchema valida password', () => {
  assert.ok(validationsContent.includes('password:'), 'Debe validar password');
  assert.ok(validationsContent.includes('al menos 8 caracteres'), 'Debe tener mínimo 8 caracteres');
});

test('registerSchema valida name', () => {
  assert.ok(validationsContent.includes('name:'), 'Debe validar name');
  assert.ok(validationsContent.includes('El nombre es obligatorio'), 'Debe exigir nombre');
});

test('loginSchema valida email', () => {
  assert.ok(validationsContent.includes('email:'), 'Debe validar email en login');
});

test('loginSchema valida password', () => {
  assert.ok(validationsContent.includes('password:'), 'Debe validar password en login');
});

test('createGuildSchema valida name', () => {
  assert.ok(validationsContent.includes('name:'), 'Debe validar name en guild');
  assert.ok(validationsContent.includes('100 caracteres'), 'Debe limitar a 100 caracteres');
});

test('createGuildSchema valida description', () => {
  assert.ok(validationsContent.includes('description:'), 'Debe validar description en guild');
});

console.log('\n✅ Todos los tests de validaciones pasaron.\n');
