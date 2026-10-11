// Tests conductuales del check CSRF Edge (lógica real, sin mocks).
// Ejecutar con: node scripts/tests/csrf-edge.test.mjs
//
// Importa el módulo TypeScript real (Node 24 hace type-stripping).
// Si el import falla, el test falla: no hay espejos de lógica que
// puedan diverger del código real.

import { test } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { csrfCheckEdge, isCsrfEnforced } from '../../src/lib/csrf-edge.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('anti-drift: csrf-edge.ts y csrf-client.ts definen los mismos valores', () => {
  const edge = readFileSync(join(__dirname, '../../src/lib/csrf-edge.ts'), 'utf-8');
  const client = readFileSync(join(__dirname, '../../src/lib/csrf-client.ts'), 'utf-8');
  for (const value of ['cps_csrf', 'x-csrf-token']) {
    assert.ok(edge.includes(value), `csrf-edge.ts debe contener ${value}`);
    assert.ok(client.includes(value), `csrf-client.ts debe contener ${value}`);
  }
});

function req(method, headers = {}) {
  return new Request('http://localhost/api/posts', {
    method,
    headers: new Headers(headers),
  });
}

test('GET nunca se verifica (skipped)', () => {
  assert.strictEqual(csrfCheckEdge(req('GET')), 'skipped');
  assert.strictEqual(csrfCheckEdge(req('HEAD')), 'skipped');
  assert.strictEqual(csrfCheckEdge(req('OPTIONS')), 'skipped');
});

test('Bearer queda exento aunque sea mutación (skipped)', () => {
  assert.strictEqual(
    csrfCheckEdge(req('POST', { authorization: 'Bearer abc123' })),
    'skipped'
  );
  assert.strictEqual(
    csrfCheckEdge(req('PATCH', { authorization: 'Bearer xyz' })),
    'skipped'
  );
});

test('Mutación sin cookie ni header → missing', () => {
  assert.strictEqual(csrfCheckEdge(req('POST')), 'missing');
  assert.strictEqual(csrfCheckEdge(req('PUT')), 'missing');
  assert.strictEqual(csrfCheckEdge(req('PATCH')), 'missing');
  assert.strictEqual(csrfCheckEdge(req('DELETE')), 'missing');
});

test('Mutación solo con cookie → missing', () => {
  assert.strictEqual(
    csrfCheckEdge(req('POST', { cookie: 'cps_csrf=tok123' })),
    'missing'
  );
});

test('Mutación solo con header → missing', () => {
  assert.strictEqual(
    csrfCheckEdge(req('POST', { 'x-csrf-token': 'tok123' })),
    'missing'
  );
});

test('Cookie y header iguales → ok', () => {
  assert.strictEqual(
    csrfCheckEdge(
      req('POST', { cookie: 'cps_csrf=tok123', 'x-csrf-token': 'tok123' })
    ),
    'ok'
  );
});

test('Cookie y header distintos → mismatch', () => {
  assert.strictEqual(
    csrfCheckEdge(
      req('POST', { cookie: 'cps_csrf=aaa', 'x-csrf-token': 'bbb' })
    ),
    'mismatch'
  );
});

test('Cookie convive con otras cookies', () => {
  assert.strictEqual(
    csrfCheckEdge(
      req('POST', {
        cookie: 'cps_token=jwt; cps_csrf=tok123; otra=1',
        'x-csrf-token': 'tok123',
      })
    ),
    'ok'
  );
});

test('isCsrfEnforced: solo true explícito', () => {
  const prev = process.env.CSRF_ENFORCE;
  try {
    delete process.env.CSRF_ENFORCE;
    assert.strictEqual(isCsrfEnforced(), false);
    process.env.CSRF_ENFORCE = 'false';
    assert.strictEqual(isCsrfEnforced(), false);
    process.env.CSRF_ENFORCE = '1';
    assert.strictEqual(isCsrfEnforced(), false);
    process.env.CSRF_ENFORCE = 'true';
    assert.strictEqual(isCsrfEnforced(), true);
  } finally {
    if (prev === undefined) delete process.env.CSRF_ENFORCE;
    else process.env.CSRF_ENFORCE = prev;
  }
});

console.log('\n✅ Todos los tests conductuales de CSRF Edge pasaron.\n');
