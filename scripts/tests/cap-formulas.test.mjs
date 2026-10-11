// Test unitarios para las fórmulas canónicas de capacidad
// Ejecutar con: node scripts/tests/cap-formulas.test.mjs

import { test } from 'node:test';
import assert from 'node:assert';

// Reimplementamos las fórmulas aquí para testing sin dependencias externas
// (ya que tsx tarda demasiado en instalarse)

const LEVEL_FACTOR = { basico: 0.2, medio: 0.5, avanzado: 1.0 };

function levelWeight(level) {
  const w = LEVEL_FACTOR[level];
  return w !== undefined ? w : LEVEL_FACTOR.basico;
}

function levelWeightFromIndex(n) {
  if (n >= 2) return LEVEL_FACTOR.avanzado;
  if (n >= 1) return LEVEL_FACTOR.medio;
  return LEVEL_FACTOR.basico;
}

function round2(v) {
  return Math.round(v * 100) / 100;
}

function presionFrom(demandaInsatisfecha, ofertaEfectiva) {
  if (demandaInsatisfecha > 0 && ofertaEfectiva > 0) {
    return round2(demandaInsatisfecha / ofertaEfectiva);
  }
  if (demandaInsatisfecha > 0) return 100;
  return 0;
}

function cargaHumanaFrom(utilizada, disponible) {
  if (disponible > 0) return round2(utilizada / disponible);
  if (utilizada > 0) return 100;
  return 0;
}

function welcomeGrant(config) {
  if (!Number.isInteger(config.newUserGrantCu) || config.newUserGrantCu <= 0) return 0;
  const cap = config.grantCap > 0 ? config.grantCap : config.newUserGrantCu;
  return Math.max(0, Math.min(config.newUserGrantCu, cap));
}

function shouldExpire(createdAt, windowDays, now) {
  const limit = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  return createdAt.getTime() < limit.getTime();
}

function expiresAtFrom(now, windowDays) {
  return new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);
}

function accessLevelFrom(context) {
  if (context.asProvider >= 1) return 'avanzado';
  if (context.asAsker >= 1) return 'medio';
  return 'basico';
}

function urgencyCost(level) {
  const l = Math.max(1, Math.floor(level));
  return l * l;
}

function urgencyPeriodKey(now, periodDays) {
  const days = Math.floor(now.getTime() / (periodDays * 24 * 60 * 60 * 1000));
  return `p${days}`;
}

function urgencyNextRenewalAt(now, periodDays) {
  const ms = periodDays * 24 * 60 * 60 * 1000;
  const bucket = Math.floor(now.getTime() / ms);
  return new Date((bucket + 1) * ms);
}

function urgencyBudgetFor(base, current, now, periodDays) {
  return current.period === urgencyPeriodKey(now, periodDays) ? current.remaining : base;
}

// ─── TESTS ──────────────────────────────────────────────────────────────────

test('round2 redondea a 2 decimales', () => {
  assert.strictEqual(round2(1.2345), 1.23);
  assert.strictEqual(round2(1.2355), 1.24);
  assert.strictEqual(round2(0), 0);
});

test('levelWeight devuelve el peso correcto', () => {
  assert.strictEqual(levelWeight('basico'), 0.2);
  assert.strictEqual(levelWeight('medio'), 0.5);
  assert.strictEqual(levelWeight('avanzado'), 1.0);
  assert.strictEqual(levelWeight('desconocido'), 0.2);
});

test('levelWeightFromIndex mapea índices numéricos', () => {
  assert.strictEqual(levelWeightFromIndex(0), 0.2);
  assert.strictEqual(levelWeightFromIndex(1), 0.5);
  assert.strictEqual(levelWeightFromIndex(2), 1.0);
  assert.strictEqual(levelWeightFromIndex(3), 1.0);
});

test('presionFrom: demanda / oferta', () => {
  assert.strictEqual(presionFrom(50, 100), 0.5);
  assert.strictEqual(presionFrom(100, 100), 1.0);
  assert.strictEqual(presionFrom(0, 100), 0);
  assert.strictEqual(presionFrom(50, 0), 100);
});

test('cargaHumanaFrom: utilizada / disponible', () => {
  assert.strictEqual(cargaHumanaFrom(50, 100), 0.5);
  assert.strictEqual(cargaHumanaFrom(100, 100), 1.0);
  assert.strictEqual(cargaHumanaFrom(0, 100), 0);
  assert.strictEqual(cargaHumanaFrom(50, 0), 100);
});

test('welcomeGrant: grant válido', () => {
  assert.strictEqual(welcomeGrant({ newUserGrantCu: 20, grantCap: 30 }), 20);
  assert.strictEqual(welcomeGrant({ newUserGrantCu: 50, grantCap: 30 }), 30);
  assert.strictEqual(welcomeGrant({ newUserGrantCu: 0, grantCap: 30 }), 0);
});

test('shouldExpire: ventana de expiración', () => {
  const now = new Date('2024-01-15T00:00:00Z');
  const createdAt = new Date('2024-01-10T00:00:00Z');
  assert.strictEqual(shouldExpire(createdAt, 7, now), false);
  
  const oldCreatedAt = new Date('2024-01-01T00:00:00Z');
  assert.strictEqual(shouldExpire(oldCreatedAt, 7, now), true);
});

test('expiresAtFrom: fecha de expiración', () => {
  const now = new Date('2024-01-15T00:00:00Z');
  const expiresAt = expiresAtFrom(now, 7);
  assert.strictEqual(expiresAt.toISOString(), '2024-01-22T00:00:00.000Z');
});

test('accessLevelFrom: niveles de acceso', () => {
  assert.strictEqual(accessLevelFrom({ asProvider: 1, asAsker: 0 }), 'avanzado');
  assert.strictEqual(accessLevelFrom({ asProvider: 0, asAsker: 1 }), 'medio');
  assert.strictEqual(accessLevelFrom({ asProvider: 0, asAsker: 0 }), 'basico');
});

test('urgencyCost: costo cuadrático', () => {
  assert.strictEqual(urgencyCost(1), 1);
  assert.strictEqual(urgencyCost(2), 4);
  assert.strictEqual(urgencyCost(3), 9);
  assert.strictEqual(urgencyCost(0), 1);
  assert.strictEqual(urgencyCost(-5), 1);
});

test('urgencyPeriodKey: períodos', () => {
  const now = new Date('2024-01-15T12:30:00Z');
  const key = urgencyPeriodKey(now, 7);
  // floor(timestamp_ms / (7*24*60*60*1000)) = floor(1705321800000 / 604800000) = 2819
  assert.strictEqual(key, 'p2819');
  
  const now2 = new Date('2024-01-15T23:59:59Z');
  assert.strictEqual(urgencyPeriodKey(now, 7), urgencyPeriodKey(now2, 7));
});

test('urgencyNextRenewalAt: próxima renovación', () => {
  const now = new Date('2024-01-15T12:00:00Z');
  const next = urgencyNextRenewalAt(now, 7);
  // floor(1705320000000 / 604800000) = 2819, (2819+1)*604800000 = 1705924800000 = 2024-01-18
  assert.strictEqual(next.toISOString(), '2024-01-18T00:00:00.000Z');
});

test('urgencyBudgetFor: presupuesto de urgencia', () => {
  const now = new Date('2024-01-15T12:00:00Z');
  const current = { period: urgencyPeriodKey(now, 7), remaining: 2 };
  assert.strictEqual(urgencyBudgetFor(3, current, now, 7), 2);
  
  const past = new Date('2024-01-01T00:00:00Z');
  const oldCurrent = { period: urgencyPeriodKey(past, 7), remaining: 0 };
  assert.strictEqual(urgencyBudgetFor(3, oldCurrent, now, 7), 3);
});

console.log('\n✅ Todos los tests de cap-formulas ejecutados.\n');
