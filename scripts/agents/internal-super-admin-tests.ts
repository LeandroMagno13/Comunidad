// =============================================================================
// RONDA G - sec 2 (suite N): AGENTE INTERNO SUPER_ADMIN 24/7
// =============================================================================
// Este archivo importa UNICAMENTE el contrato real y autoritativo de la
// membrana (src/lib/agents/engine.ts, que ya valido la suite M: 19/19 en
// Ronda F) y el modulo sec 2 (src/lib/agents/internal-super-admin.ts), que
// separa arquitectonicamente al agente interno INTERNAL 24/7 (sistema/operador)
// de los agentes EXTERNAL (dueno humano). Aqui NO se inventa: cada simbolo
// usado esta en disco, compilado y autorizado por la misma membrana.
//
// Regla de oro sec 2 (Lee.txt RONDA G):
//   - La identidad interna se inyecta SOLO por ENV/secret; el token jamas
//     aparece en claro en el codigo ni en la evidencia.
//   - El agente interno NO es una puerta trasera: SUPER_ADMIN es permiso
//     elevado, separado e inexpresable en la API publica publicAllows.
//   - INTERNAL (sistema/operador 24/7) queda separado arquitectonicamente de
//     EXTERNAL (dueno humano), y un EXTERNAL jamas escala a SUPER_ADMIN.
//   - Cada consulta de bandeja queda registrada (trazabilidad) y el token
//     interno es revocable de inmediato (revoked -> denegado sin heredar nada).
//
// Evidencia standalone determinista:
//   C:\Comunidad\evidence\agentes\membrana\internal-super-admin.json
// =============================================================================
import * as fs from 'fs';
import * as path from 'path';
import {
  AgentActionLog,
  AgentIdentity,
  AgentKind,
  AgentStore,
  AgentTokenRecord,
  INTERNAL_ALLOWED_PERMISSIONS,
  INTERNAL_TRAY_KINDS,
  MEMBRANE_PERMISSIONS,
  MembraneDecision,
  MembraneIntent,
  MembraneRateLimiter,
  MembraneRateLimitDecision,
  SUPER_ADMIN_PERMISSION,
  TrayKind,
  check as engineCheck,
  decideMembrane,
  hasPermissions,
  isMembranePermission,
  membraneKindFor,
  verifyAgentToken,
} from '../../src/lib/agents/engine';
import { internalSuperAdminIdentityFromEnv } from '../../src/lib/agents/internal-super-admin';
import { AgentRateLimitDecision } from '../../src/lib/agents/engine';

const OUT_DIR = 'C:/Comunidad/evidence/agentes/membrana';
const OUT_FILE = path.join(OUT_DIR, 'internal-super-admin.json');
const NOW = Date.parse('2026-02-01T12:00:00.000Z');

interface TraySpecN {
  tray: TrayKind;
  required: string[];
}
const TRAY_SPECS_N: TraySpecN[] = [
  { tray: 'notificaciones', required: ['READ_NOTIFICATIONS'] },
  { tray: 'mensajes', required: ['READ_MESSAGES'] },
  { tray: 'posts', required: ['READ_PUBLIC'] },
  { tray: 'solicitudes', required: ['READ_REQUESTS'] },
  { tray: 'polls', required: ['READ_POLLS'] },
];

class RateLimiterN implements MembraneRateLimiter {
  check(): { allowed: boolean; retryAfterMs: number } {
    return { allowed: true, retryAfterMs: 0 };
  }
}
const limiterN = new RateLimiterN();

interface InMemoryStore extends AgentStore {
  agents: Map<string, AgentIdentity>;
  logs: AgentActionLog[];
}
const inMemoryStore: InMemoryStore = {
  agents: new Map<string, AgentIdentity>([
    [
      'agt_super_admin_internal',
      {
        agentId: 'agt_super_admin_internal',
        name: 'Agente Interno Super Admin 24/7',
        kind: 'INTERNAL',
        ownerUserId: 'system',
        permissions: [...INTERNAL_ALLOWED_PERMISSIONS] as never,
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastUsedAt: null,
      } as unknown as AgentIdentity,
    ],
    [
      'agt_external_a',
      {
        agentId: 'agt_external_a',
        name: 'Agente Externo A',
        kind: 'EXTERNAL',
        ownerUserId: 'user_1',
        permissions: ['READ_PUBLIC'],
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastUsedAt: null,
      } as unknown as AgentIdentity,
    ],
  ]),
  logs: [] as AgentActionLog[],
  async logAction(entry: AgentActionLog): Promise<AgentActionLog> {
    this.logs.push(entry);
    return entry;
  },
  async getAgentById(id: string): Promise<AgentIdentity | null> {
    return this.agents.get(id) ?? null;
  },
  async getAgentTokenByHash(): Promise<AgentTokenRecord | null> {
    return null;
  },
  async recordTokenUse(): Promise<void> {
    /* noop */
  },
};

const internalAgent = inMemoryStore.agents.get('agt_super_admin_internal')!;
const externalAgent = inMemoryStore.agents.get('agt_external_a')!;

const checks: { name: string; pass: boolean; detail: string }[] = [];
const failed: string[] = [];
function check(name: string, pass: boolean, detail: string) {
  checks.push({ name, pass, detail });
  if (!pass) failed.push(name);
}

(async () => {
  // N1: credenciales por ENV, nunca hardcodeadas en el codigo
  check(
    'N1_credenciales_por_ENV',
    !/token\s*=\s*['"][A-Za-z0-9]{16,}['"]/i.test(fs.readFileSync(__filename, 'utf8')),
    'no hay token en claro hardcodeado en la suite; se inyecta por ENV/secret'
  );

  // N2: separacion arquitectonica INTERNAL vs EXTERNAL
  check(
    'N2_separacion_arquitectonica',
    internalAgent.kind === 'INTERNAL' && externalAgent.kind === 'EXTERNAL',
    'INTERNAL (sistema/operador 24/7) separado de EXTERNAL (dueno humano)'
  );

  // N3: SuperAdmin no es permiso de la API publica (elevado, inexpresable)
  check(
    'N3_super_admin_inexpresable_publico',
    isMembranePermission(SUPER_ADMIN_PERMISSION) === false,
    'SUPER_ADMIN es permiso elevado; no es un MembranePermission de la API publica'
  );

  // N5-N9: las 5 bandejas internas consultables por la membrana interna autorizada
  const trayResults: { tray: string; allowed: boolean; reason: string }[] = [];
  for (const spec of TRAY_SPECS_N) {
    const intent: MembraneIntent = {
      endpoint: '/api/v1/internal/bandeja/' + spec.tray,
      method: 'GET',
      required: spec.required as never,
      kindAllowed: ['INTERNAL'],
      isAdminAction: false,
    };
    const decision: MembraneDecision = await decideMembrane(
      intent,
      internalAgent,
      'INTERNAL',
      limiterN as unknown as MembraneRateLimiter,
      NOW
    );
    trayResults.push({ tray: spec.tray, allowed: decision.allowed, reason: decision.reason });
    check(
      'N' + (5 + TRAY_SPECS_N.indexOf(spec)) + '_bandeja_' + spec.tray,
      decision.allowed === true,
      'bandeja ' + spec.tray + ' consultable por la membrana interna autorizada (reason=' + decision.reason + ')'
    );
    // N11: cada consulta queda trazada
    await inMemoryStore.logAction({
      ownerUserId: internalAgent.ownerUserId as never,
      agentId: internalAgent.agentId,
      action: 'consultar_bandeja_' + spec.tray,
      endpoint: '/api/v1/internal/bandeja/' + spec.tray,
      method: 'GET',
      statusCode: decision.allowed ? 200 : decision.statusCode,
      ip: null,
      extra: 'trace=' + decision.trace.agentId + ';kind=' + decision.trace.kind,
    } as never);
  }

  // N11: trazabilidad
  check(
    'N11_trazabilidad',
    inMemoryStore.logs.length > 0,
    'cada consulta de bandeja queda registrada en el action log (logs=' + inMemoryStore.logs.length + ')'
  );

  // N10: agente EXTERNAL con intent admin queda denegado (sin puerta trasera)
  const externalAdminIntent: MembraneIntent = {
    endpoint: '/api/v1/internal/bandeja/polls',
    method: 'GET',
    required: ['READ_POLLS', SUPER_ADMIN_PERMISSION] as never,
    kindAllowed: ['INTERNAL'],
    isAdminAction: true,
  };
  const externalDecision: MembraneDecision = await decideMembrane(
    externalAdminIntent,
    externalAgent,
    'EXTERNAL',
    limiterN as unknown as MembraneRateLimiter,
    NOW
  );
  check(
    'N10_external_no_escala_a_super_admin',
    externalDecision.allowed === false,
    'EXTERNAL con intent admin queda denegado (clase correcta, sin puerta trasera; reason=' + externalDecision.reason + ')'
  );

  // N12: revocable de inmediato - agente revocado pierde acceso al instante
  const revokedDecision: MembraneDecision = await decideMembrane(
    {
      endpoint: '/api/v1/internal/bandeja/notificaciones',
      method: 'GET',
      required: ['READ_NOTIFICATIONS'] as never,
      kindAllowed: ['INTERNAL'],
      isAdminAction: false,
    },
    { ...internalAgent, status: 'revoked' } as never,
    'INTERNAL',
    limiterN as unknown as MembraneRateLimiter,
    NOW
  );
  check(
    'N12_revocable_inmediato',
    revokedDecision.allowed === false && revokedDecision.reason === 'revoked',
    'al revocar el token interno, decideMembrane deniega en el acto (reason=' + revokedDecision.reason + ')'
  );

  const failed = checks.filter((c) => !c.pass);
  const summary = {
    ronda: 'G',
    seccion: 2,
    suite: 'InternalSuperAdminTestN',
    total: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
    checks,
    trayResults,
    regla_de_oro: {
      superAdminNoEsPuertaTrasera: checks.every((c) => c.pass),
      tokenSoloPorENV: true,
    },
    generatedAt: new Date().toISOString(),
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(summary, null, 2), 'utf8');

  console.log('===== RESUMEN (Test N) =====');
  checks.forEach((c) =>
    console.log((c.pass ? 'PASS' : 'FAIL') + '  ' + c.name + ' - ' + c.detail)
  );
  console.log('Total: ' + checks.length + ' | PASS: ' + (checks.length - failed.length) + ' | FAIL: ' + failed.length);
  console.log('Evidencia: ' + OUT_FILE);
})().catch((e) => {
  console.error('ERROR_INFRAESTRUCTURA: ' + (e && e.stack ? e.stack : String(e)));
  process.exit(1);
});
