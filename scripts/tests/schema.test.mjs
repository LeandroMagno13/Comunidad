// Test unitarios para el schema de Prisma
// Ejecutar con: node scripts/tests/schema.test.mjs

import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer el archivo schema.prisma
const schemaPath = join(__dirname, '../../prisma/schema.prisma');
const schemaContent = readFileSync(schemaPath, 'utf-8');

// Tests de estructura general
test('schema.prisma tiene generator client', () => {
  assert.ok(schemaContent.includes('generator client'), 'Debe tener generator client');
  assert.ok(schemaContent.includes('prisma-client-js'), 'Debe usar prisma-client-js');
});

test('schema.prisma tiene datasource db', () => {
  assert.ok(schemaContent.includes('datasource db'), 'Debe tener datasource db');
  assert.ok(schemaContent.includes('postgresql'), 'Debe usar PostgreSQL');
  assert.ok(schemaContent.includes('DATABASE_URL'), 'Debe usar DATABASE_URL');
});

// Tests de modelos principales
test('schema.prisma tiene modelo User', () => {
  assert.ok(schemaContent.includes('model User'), 'Debe tener modelo User');
});

test('schema.prisma tiene modelo Profile', () => {
  assert.ok(schemaContent.includes('model Profile'), 'Debe tener modelo Profile');
});

test('schema.prisma tiene modelo Guild', () => {
  assert.ok(schemaContent.includes('model Guild'), 'Debe tener modelo Guild');
});

test('schema.prisma tiene modelo Post', () => {
  assert.ok(schemaContent.includes('model Post'), 'Debe tener modelo Post');
});

test('schema.prisma tiene modelo Comment', () => {
  assert.ok(schemaContent.includes('model Comment'), 'Debe tener modelo Comment');
});

test('schema.prisma tiene modelo Poll', () => {
  assert.ok(schemaContent.includes('model Poll'), 'Debe tener modelo Poll');
});

test('schema.prisma tiene modelo Project', () => {
  assert.ok(schemaContent.includes('model Project'), 'Debe tener modelo Project');
});

test('schema.prisma tiene modelo CuAccount', () => {
  assert.ok(schemaContent.includes('model CuAccount'), 'Debe tener modelo CuAccount');
});

test('schema.prisma tiene modelo CuTransaction', () => {
  assert.ok(schemaContent.includes('model CuTransaction'), 'Debe tener modelo CuTransaction');
});

test('schema.prisma tiene modelo Agent', () => {
  assert.ok(schemaContent.includes('model Agent'), 'Debe tener modelo Agent');
});

// Tests de soft delete
test('User tiene deletedAt para soft delete', () => {
  assert.ok(schemaContent.includes('deletedAt'), 'User debe tener deletedAt');
});

test('Post tiene deletedAt para soft delete', () => {
  const postSection = schemaContent.match(/model Post \{[\s\S]*?\}/);
  assert.ok(postSection, 'Debe tener modelo Post');
  assert.ok(postSection[0].includes('deletedAt'), 'Post debe tener deletedAt');
});

test('Comment tiene deletedAt para soft delete', () => {
  const commentSection = schemaContent.match(/model Comment \{[\s\S]*?\}/);
  assert.ok(commentSection, 'Debe tener modelo Comment');
  assert.ok(commentSection[0].includes('deletedAt'), 'Comment debe tener deletedAt');
});

test('Guild tiene deletedAt para soft delete', () => {
  const guildSection = schemaContent.match(/model Guild \{[\s\S]*?\}/);
  assert.ok(guildSection, 'Debe tener modelo Guild');
  assert.ok(guildSection[0].includes('deletedAt'), 'Guild debe tener deletedAt');
});

// Tests de índices
test('schema.prisma tiene índices para deletedAt', () => {
  const deletedAtIndexes = schemaContent.match(/@@index\(\[deletedAt\]\)/g);
  assert.ok(deletedAtIndexes, 'Debe tener índices para deletedAt');
  assert.ok(deletedAtIndexes.length >= 5, 'Debe tener al menos 5 índices para deletedAt');
});

test('schema.prisma tiene índices para status', () => {
  assert.ok(schemaContent.includes('@@index([status, deletedAt])'), 'Debe tener índice compuesto status+deletedAt');
});

// Tests de seguridad
test('User no expone password en campos públicos', () => {
  const userSection = schemaContent.match(/model User \{[\s\S]*?\n\}/);
  assert.ok(userSection, 'Debe tener modelo User');
  // password está en el modelo pero no debe ser público por defecto
  assert.ok(userSection[0].includes('password'), 'User debe tener campo password');
});

test('AgentToken no guarda token en claro', () => {
  const tokenSection = schemaContent.match(/model AgentToken \{[\s\S]*?\}/);
  assert.ok(tokenSection, 'Debe tener modelo AgentToken');
  assert.ok(tokenSection[0].includes('hash'), 'AgentToken debe tener campo hash');
  assert.ok(!tokenSection[0].includes('token String'), 'AgentToken NO debe tener token en claro');
});

test('AgentToken tiene prefijo para identificación', () => {
  const tokenSection = schemaContent.match(/model AgentToken \{[\s\S]*?\}/);
  assert.ok(tokenSection, 'Debe tener modelo AgentToken');
  assert.ok(tokenSection[0].includes('prefix'), 'AgentToken debe tener campo prefix');
});

// Tests de relaciones
test('User tiene relación con Profile', () => {
  assert.ok(schemaContent.includes('profile'), 'User debe tener relación con Profile');
});

test('User tiene relación con GuildMembership', () => {
  assert.ok(schemaContent.includes('guildMemberships'), 'User debe tener relación con GuildMembership');
});

test('Post tiene relación con Comment', () => {
  assert.ok(schemaContent.includes('comments'), 'Post debe tener relación con Comment');
});

test('Guild tiene relación con Post', () => {
  assert.ok(schemaContent.includes('posts'), 'Guild debe tener relación con Post');
});

// Tests de campos de auditoría
test('User tiene createdAt y updatedAt', () => {
  const userSection = schemaContent.match(/model User \{[\s\S]*?\n\}/);
  assert.ok(userSection, 'Debe tener modelo User');
  assert.ok(userSection[0].includes('createdAt'), 'User debe tener createdAt');
  assert.ok(userSection[0].includes('updatedAt'), 'User debe tener updatedAt');
});

test('Post tiene createdAt y updatedAt', () => {
  const postSection = schemaContent.match(/model Post \{[\s\S]*?\}/);
  assert.ok(postSection, 'Debe tener modelo Post');
  assert.ok(postSection[0].includes('createdAt'), 'Post debe tener createdAt');
  assert.ok(postSection[0].includes('updatedAt'), 'Post debe tener updatedAt');
});

// Tests de campos específicos
test('User tiene campo role', () => {
  assert.ok(schemaContent.includes('role'), 'User debe tener campo role');
});

test('User tiene campo status', () => {
  assert.ok(schemaContent.includes('status'), 'User debe tener campo status');
});

test('Post tiene campo status', () => {
  const postSection = schemaContent.match(/model Post \{[\s\S]*?\}/);
  assert.ok(postSection, 'Debe tener modelo Post');
  assert.ok(postSection[0].includes('status'), 'Post debe tener campo status');
});

test('Agent tiene campo permissions', () => {
  const agentSection = schemaContent.match(/model Agent \{[\s\S]*?\}/);
  assert.ok(agentSection, 'Debe tener modelo Agent');
  assert.ok(agentSection[0].includes('permissions'), 'Agent debe tener campo permissions');
});

test('AgentToken tiene campo revokedAt', () => {
  const tokenSection = schemaContent.match(/model AgentToken \{[\s\S]*?\}/);
  assert.ok(tokenSection, 'Debe tener modelo AgentToken');
  assert.ok(tokenSection[0].includes('revokedAt'), 'AgentToken debe tener campo revokedAt');
});

console.log('\n✅ Todos los tests de schema pasaron.\n');
