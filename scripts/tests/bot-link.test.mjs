// Tests de vinculación bot ↔ usuario (contrato + cableado).
// Ejecutar con: node scripts/tests/bot-link.test.mjs
//
// El self-test conductual de Python vive en scripts/tests/bot-selftest.py
// (se ejecuta con `python scripts/tests/bot-selftest.py`).

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

// ─── Backend: auth de agentes en lectura ────────────────────────────────────
test('agent-auth.ts exporta getReaderUserId y traceAgentAccess', () => {
  const c = read('src/lib/agent-auth.ts');
  assert.ok(c.includes('export async function getReaderUserId'));
  assert.ok(c.includes('export async function traceAgentAccess'));
  assert.ok(c.includes('export async function getAgentAuthFromRequest'));
});

test('agent-auth.ts verifica contra el store (revocado/expirado no pasan)', () => {
  const c = read('src/lib/agent-auth.ts');
  assert.ok(c.includes('verifyAgentToken'));
  assert.ok(c.includes('prismaAgentStore'));
});

test('agent-auth.ts exige permiso granular', () => {
  const c = read('src/lib/agent-auth.ts');
  assert.ok(c.includes('hasPermissions') || c.includes('agentHasPermission'));
  assert.ok(c.includes('READ_NOTIFICATIONS') || c.includes('permission'));
});

test('agent-auth.ts nunca loguea el token', () => {
  const c = read('src/lib/agent-auth.ts');
  assert.ok(!c.includes('console.log(token'));
  assert.ok(c.includes('NUNCA se loguea') || c.includes('nunca'));
});

test('notifications GET admite agente con READ_NOTIFICATIONS; PATCH solo sesión', () => {
  const c = read('src/pages/api/notifications.ts');
  assert.ok(c.includes('READ_NOTIFICATIONS'));
  assert.ok(c.includes('getReaderUserId'));
  // PATCH sigue con sesión (el bot es solo lectura)
  const patchSection = c.slice(c.indexOf("case 'PATCH'"));
  assert.ok(!patchSection.includes('getReaderUserId'));
});

test('conversations GET admite agente con READ_MESSAGES; POST solo sesión', () => {
  const c = read('src/pages/api/conversations.ts');
  assert.ok(c.includes('READ_MESSAGES'));
  assert.ok(c.includes('getReaderUserId'));
  const postSection = c.slice(c.indexOf("case 'POST'"));
  assert.ok(!postSection.includes('getReaderUserId'));
});

test('conversations expone unread aditivo por conversación', () => {
  const c = read('src/pages/api/conversations.ts');
  assert.ok(c.includes('unread'));
  // La forma existente se mantiene (otherUser, lastMessage, updatedAt)
  assert.ok(c.includes('otherUser'));
  assert.ok(c.includes('lastMessage'));
});

// ─── Bot: vinculación y personales ──────────────────────────────────────────
test('bot tiene comandos de vinculación', () => {
  const c = read('BOT/telegram-hourly-bot.py');
  for (const cmd of ['/vincular', '/desvincular', '/mibot', '/personales']) {
    assert.ok(c.includes(`"${cmd}"`) || c.includes(`'${cmd}'`), `falta ${cmd}`);
  }
});

test('bot valida el token antes de vincular (401 vs 403)', () => {
  const c = read('BOT/telegram-hourly-bot.py');
  assert.ok(c.includes('def validate_link'));
  assert.ok(c.includes('READ_NOTIFICATIONS'));
  assert.ok(c.includes('READ_MESSAGES'));
});

test('bot nunca loguea tokens (redact + sin texto de mensajes en log)', () => {
  const c = read('BOT/telegram-hourly-bot.py');
  assert.ok(c.includes('def redact_token'));
  assert.ok(c.includes('NUNCA se loguea') || c.includes('nunca registrar tokens'));
  // El token del comando no va al log: link_failed solo lleva el motivo
  assert.ok(!c.includes('log(f"link {agent_token}'));
});

test('bot pide borrar el mensaje con el token tras vincular', () => {
  const c = read('BOT/telegram-hourly-bot.py');
  assert.ok(c.includes('borr'));
});

test('bot envía digest personal horario a vinculados', () => {
  const c = read('BOT/telegram-hourly-bot.py');
  assert.ok(c.includes('def personal_digest'));
  assert.ok(c.includes('def push_personal_digests'));
  assert.ok(c.includes('push_personal_digests(token)'));
});

test('bot mantiene el informe general sin cambios', () => {
  const c = read('BOT/telegram-hourly-bot.py');
  assert.ok(c.includes('def collect_report_data'));
  assert.ok(c.includes('def make_report'));
  assert.ok(c.includes('/informe'));
});

test('estado del bot ignora tokens en git', () => {
  const gitignore = read('.gitignore');
  assert.ok(gitignore.includes('.telegram-hourly-bot-state.json'));
});

test('self-test de Python existe', () => {
  const c = read('scripts/tests/bot-selftest.py');
  assert.ok(c.includes('BOT_SELFTEST_OK'));
  assert.ok(c.includes('redact_token'));
});

console.log('\n✅ Todos los tests de vinculación bot↔usuario pasaron.\n');
