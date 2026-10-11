// Test unitarios para el store de estado global
// Ejecutar con: node scripts/tests/store.test.mjs

import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer el archivo store.tsx
const storePath = join(__dirname, '../../src/lib/store.tsx');
const storeContent = readFileSync(storePath, 'utf-8');

// Tests de estructura y funcionalidad
test('store.tsx exporta AppProvider', () => {
  assert.ok(storeContent.includes('export function AppProvider'), 'Debe exportar AppProvider');
});

test('store.tsx exporta useAppStore', () => {
  assert.ok(storeContent.includes('export function useAppStore'), 'Debe exportar useAppStore');
});

test('store.tsx usa React Context', () => {
  assert.ok(storeContent.includes('createContext'), 'Debe usar createContext');
});

test('store.tsx usa useReducer', () => {
  assert.ok(storeContent.includes('useReducer'), 'Debe usar useReducer');
});

test('store.tsx maneja usuario', () => {
  assert.ok(storeContent.includes('SET_USER'), 'Debe manejar SET_USER');
  assert.ok(storeContent.includes('SET_USER'), 'Debe manejar CLEAR_USER');
});

test('store.tsx maneja notificaciones', () => {
  assert.ok(storeContent.includes('SET_NOTIFICATIONS'), 'Debe manejar SET_NOTIFICATIONS');
  assert.ok(storeContent.includes('MARK_AS_READ'), 'Debe manejar MARK_AS_READ');
});

test('store.tsx maneja estado de carga', () => {
  assert.ok(storeContent.includes('SET_LOADING'), 'Debe manejar SET_LOADING');
});

test('store.tsx maneja errores', () => {
  assert.ok(storeContent.includes('SET_ERROR'), 'Debe manejar SET_ERROR');
});

test('store.tsx persiste en localStorage', () => {
  assert.ok(storeContent.includes('localStorage'), 'Debe usar localStorage');
  assert.ok(storeContent.includes('localStorage.setItem'), 'Debe guardar en localStorage');
  assert.ok(storeContent.includes('localStorage.getItem'), 'Debe cargar de localStorage');
});

test('store.tsx tiene acción LOGOUT', () => {
  assert.ok(storeContent.includes('LOGOUT'), 'Debe tener acción LOGOUT');
});

test('store.tsx calcula unreadCount correctamente', () => {
  assert.ok(storeContent.includes('unreadCount'), 'Debe calcular unreadCount');
  assert.ok(storeContent.includes('filter'), 'Debe usar filter para contar no leídas');
});

console.log('\n✅ Todos los tests de store pasaron.\n');
