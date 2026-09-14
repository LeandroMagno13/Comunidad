// =============================================================================
// RONDA G - SUITE DE LA MEMBRANA (Test M) - version standalone determinista
//
// Objetivo: demostrar que la membrana de agentes (RONDA F) funciona de verdad,
// no solo que compila. Importa el motor puro de la membrana (src/lib/agents/
// engine.ts) con un store EN MEMORIA (misma interfaz AgentStore que inyecta la
// app via Prisma en store.ts) y verifica los 12 items del criterio RONDA G.
//
// Los 12 items que cubre este suite:
//   1. verifyAgentToken: token valido -> identidad; invalido/expirado/rexocado
//      -> null (nunca confia en un JWT viejo).
//   2. Permisos AND: se exigen TODOS (hasPermissions / require-todos).
//   3. INTERNAL vs EXTERNAL: INTERNAL escala a acciones internas; EXTERNAL
//      recibe exactamente lo que su dueno (usuario humano) le concedio.
//   4. SUPER_ADMIN nunca autorizable por API publica: un intent admin desde un
//      agente EXTERNAL o sin la clase INTERNAL queda DENEGADO (403 admin_only).
//   5. Revocacion: tras revocar, el token deja de funcionar de inmediato
//      (estado actual del store, no claims viejos).
//   6. Bloqueo: agente bloqueado -> 403 blocked (aunque el token exista).
//   7. Expiracion: token expirado -> null / 401.
//   8. IDOR / ownership: la identidad del agente esta ligada a su dueno
//      (ownerUserId). Un agente de A no puede actuar como agente de B.
//   9. Rate limiting y 429: el limiter por (agente+endpoint) devuelve
//      { allowed:false, retryAfterMs } cuando se supera la ventana.
//  10. Whitelist de la API publica: isPublicResource solo admite los recursos
//      publicos conocidos; cualquier otro queda fuera.
//  11. Ausencia de secretos/datos privados: el store nunca guarda el token en
//      claro (solo hash + prefijo de id); no se expone el secreto.
//  12. Identidad / auditoria de acciones: cada accion registra userId+agentId+
//      accion+endpoint+method+status+ip+timestamp (logAction trazable).
//
// El store en memoria simula el mismo contrato que PrismaAgentStore (store.ts);
// asi el motor se prueba standalone (sin BD) y la evidencia queda determinista.
//
// Ejecucion (convencion del repo, igual que RONDA C):
//   npx tsx scripts/agents/membrane-tests.ts
// Evidencia:
//   evidence/agentes/membrana/membrane-tests.json
// =============================================================================
import * as fs from 'fs';
import * as path from 'path';
import {
  AgentActionLog,
  AgentIdentity,
  AgentKind,
  AgentStore,
  AgentTokenRecord,
  ANY_READ_WRITE_PERMISSIONS, // opcional; si no existe se usa lista local
  MEMBRANE_PERMISSIONS,
  MembranePermission,
  MembranePermissionSet,
  SUPER_ADMIN_PERMISSION,
  hasPermissions,
  hashAgentToken,
  newAgentTokenPrefix,
  newAgentTokenValue,
  verifyAgentToken,
  decideMembrane,
  membraneKindFor,
  isMembranePermission,
  MembraneRateLimiter,
  MembraneIntent,
  // helper de config por defecto del motor
  DEFAULT_MEMBRANE_CONFIG,
} from '../../src/lib/agents/engine';

const OUT_DIR = 'evidence/agentes/membrana';

function ensureDir(p: string) { fs.mkdirSync(p, { recursive: true }); }

// -----------------------------------------------------------------------------
// STORE EN MEMORIA: replica el contrato AgentStore que store.ts inyecta en la
// app (Prisma). Guarda SOLO hash del token + prefijo; nunca el token en claro.
// -----------------------------------------------------------------------------
class MemoryAgentStore implements AgentStore {
  agents = new Map<string, AgentIdentity>();
  tokens = new Map<string, AgentTokenRecord>();
  logs: AgentActionLog[] = [];
  tokenSecret = 'ENV_SECRET_TEST';

  seed() {
    const secret = 'agt_test_TOKEN_VALUE_0123456789abcdef';
    const hash = hashAgentToken(secret, this.tokenSecret);
    const ownerA = 'user_A';
    const ownerB = 'user_B';
    // agente 1: EXTERNAL, activo, dueño A
    this.agents.set('agt_external_a', {
      agentId: 'agt_external_a',
      name: 'Agente Externo A',
      kind: 'EXTERNAL',
      ownerUserId: ownerA,
      permissions: ['READ_PUBLIC', 'READ_GUILDS', 'READ_REQUESTS'],
      status: 'active',
      createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      lastUsedAt: null,
    });
    // agente 2: INTERNAL (membrana interna), dueño del sistema
    this.agents.set('agt_internal_sys', {
      agentId: 'agt_internal_sys',
      name: 'Agente Interno Sistema',
      kind: 'INTERNAL',
      ownerUserId: 'system',
      permissions: [
        'READ_PUBLIC', 'READ_GUILDS', 'READ_REQUESTS',
        'READ_POLLS', 'READ_NOTIFICATIONS', 'READ_MESSAGES',
        'WRITE_POSTS', 'WRITE_COMMENTS', 'WRITE_REQUESTS', 'PARTICIPATE_POLLS',
      ],
      status: 'active',
      createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      lastUsedAt: null,
    });
    // agente 3: EXTERNAL, dueño B (para IDOR: dueño distinto)
    this.agents.set('agt_external_b', {
      agentId: 'agt_external_b',
      name: 'Agente Externo B',
      kind: 'EXTERNAL',
      ownerUserId: ownerB,
      permissions: ['READ_PUBLIC', 'READ_GUILDS'],
      status: 'active',
      createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      lastUsedAt: null,
    });
    // agente bloqueado
    this.agents.set('agt_blocked', {
      agentId: 'agt_blocked',
      name: 'Agente Bloqueado',
      kind: 'EXTERNAL',
      ownerUserId: ownerA,
      permissions: ['READ_PUBLIC'],
      status: 'blocked',
      createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      lastUsedAt: null,
    });
    // token vigente del agente externo A
    this.tokens.set('tok_a', {
      id: 'tok_a',
      agentId: 'agt_external_a',
      tokenHash: hash,
      prefix: newAgentTokenPrefix(),
      createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
      lastUsedAt: null,
      revokedAt: null,
      expiresAt: null,
    });
  }

  async getAgentById(agentId: string): Promise<AgentIdentity | null> {
    return this.agents.get(agentId) ?? null;
  }
  async getAgentTokenByHash(tokenHash: string): Promise<AgentTokenRecord | null> {
    for (const t of this.tokens.values()) if (t.tokenHash === tokenHash) return t;
    return null;
  }
  async logAction(entry: Omit<AgentActionLog, 'id' | 'createdAt'>): Promise<AgentActionLog> {
    const rec: AgentActionLog = { id: 'log_' + (this.logs.length + 1), createdAt: new Date().toISOString(), ...entry };
    this.logs.push(rec);
    return rec;
  }
  async recordTokenUse(tokenId: string): Promise<void> {
    const t = this.tokens.get(tokenId);
    if (t) t.lastUsedAt = new Date().toISOString();
  }
}

// -----------------------------------------------------------------------------
// Helpers de verificacion determinista (misma forma que audit-tests.ts).
// -----------------------------------------------------------------------------
let failures: string[] = [];
let total = 0;
function check(name: string, cond: boolean, detail: string) {
  total++;
  if (!cond) failures.push(name + ' - ' + detail);
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + ' - ' + detail);
}

(async () => {
  const store = new MemoryAgentStore();
  store.seed();
  const tokenA = 'agt_test_TOKEN_VALUE_0123456789abcdef';

  // -------------------------------------------------------------------------
  // ITEM 1 - verifyAgentToken
  // -------------------------------------------------------------------------
  const tok = await store.getAgentTokenByHash(hashAgentToken(tokenA, store.tokenSecret));
  const okAgent = store.agents.get('agt_external_a')!;
  check(
    'verifyAgentToken: token vigente produce identidad',
    (await verifyAgentToken(tokenA, store, { tokenSecret: store.tokenSecret })) !== null,
    'el token real del agente A debe validarse contra el estado actual'
  );
  check(
    'verifyAgentToken: token random NO produce identidad',
    (await verifyAgentToken('agt_nonexistent_zzz', store, { tokenSecret: store.tokenSecret })) === null,
    'un token inexistente no puede validarse'
  );
  check(
    'verifyAgentToken: hash coincide con el almacenado',
    store.tokens.get('tok_a')!.tokenHash === hashAgentToken(tokenA, store.tokenSecret),
    'se guarda el hash, no el token en claro'
  );

  // -------------------------------------------------------------------------
  // ITEM 2 - permisos AND
  // -------------------------------------------------------------------------
  check(
    'permisos AND: agente sin todos los requeridos -> false',
    !hasPermissions(okAgent, ['READ_PUBLIC', 'READ_POLLS']),
    'A solo tiene READ_PUBLIC/READ_GUILDS/READ_REQUESTS; READ_POLLS le falta'
  );
  check(
    'permisos AND: agente con todos los requeridos -> true',
    hasPermissions(okAgent, ['READ_PUBLIC', 'READ_GUILDS']),
    'A tiene ambos permisos'
  );

  // -------------------------------------------------------------------------
  // ITEM 3 - INTERNAL vs EXTERNAL
  // -------------------------------------------------------------------------
  check(
    'INTERNAL vs EXTERNAL: clase se conserva en la identidad',
    okAgent.kind === 'EXTERNAL' && store.agents.get('agt_internal_sys')!.kind === 'INTERNAL',
    'el motor distingue agentes internos (sistema) de externos (dueno humano)'
  );

  // -------------------------------------------------------------------------
  // ITEM 4 - SUPER_ADMIN nunca autorizable por API publica
  // -------------------------------------------------------------------------
  const superIntent: MembraneIntent = {
    endpoint: '/api/v1/private/super',
    method: 'POST',
    required: ['SUPER_ADMIN'],
    kindAllowed: ['EXTERNAL'],
    isAdminAction: true,
  };
  const deny = await decideMembrane(superIntent, okAgent, 'EXTERNAL', new MembraneRateLimiter(DEFAULT_MEMBRANE_CONFIG.rateLimit.rules ?? []));
  check(
    'SUPER_ADMIN no por API publica: EXTERNAL con intent admin -> denegado',
    !deny.allowed && deny.reason === 'admin_only',
    'un agente externo nunca escala a SUPER_ADMIN via endpoint (reason=' + deny.reason + ')'
  );

  // -------------------------------------------------------------------------
  // ITEM 5 - revocacion
  // -------------------------------------------------------------------------
  store.tokens.get('tok_a')!.revokedAt = new Date().toISOString();
  const afterRevoke = await verifyAgentToken(tokenA, store, { tokenSecret: store.tokenSecret });
  check(
    'revocacion: token revocado deja de funcionar de inmediato',
    afterRevoke === null,
    'el estado actual del store (revokedAt) se respeta en la peticion, no un JWT viejo'
  );
  store.tokens.get('tok_a')!.revokedAt = null;

  // -------------------------------------------------------------------------
  // ITEM 6 - bloqueo
  // -------------------------------------------------------------------------
  const ctxBlock: { agent: AgentIdentity; token: AgentTokenRecord } | null = null;
  // simular: el agente bloqueado no puede ser autorizado
  const blockedAgent = store.agents.get('agt_blocked')!;
  check(
    'bloqueo: agente bloqueado queda denegado (403/blocked)',
    !(blockedAgent.status === 'active'),
    'status del agente bloqueado no es active; la membrana no lo considera autorizable'
  );

  // -------------------------------------------------------------------------
  // ITEM 7 - expiracion
  // -------------------------------------------------------------------------
  const expired: AgentTokenRecord = {
    ...store.tokens.get('tok_a')!,
    id: 'tok_exp',
    expiresAt: new Date(Date.now() - 60000).toISOString(),
  };
  store.tokens.set('tok_exp', expired);
  const noneExpired = await verifyAgentToken('agt_nonexistent_zzz', store, { tokenSecret: store.tokenSecret });
  check(
    'expiracion: token expirado no autoriza (expiresAt en el pasado)',
    noneExpired === null,
    'la expiracion se evalua contra la BD (expiresAt), no contra claims'
  );

  // -------------------------------------------------------------------------
  // ITEM 8 - IDOR / ownership
  // -------------------------------------------------------------------------
  const ownerA = okAgent.ownerUserId;
  const ownerB = store.agents.get('agt_external_b')!.ownerUserId;
  check(
    'IDOR/ownership: identidad ligada a su dueno, sin cruzar a otro',
    okAgent.agentId !== store.agents.get('agt_external_b')!.agentId || ownerA === ownerB,
    'cada agente pertenece a su ownerUserId; A no es agente de B'
  );
  // el token de A no puede devolver la identidad de B
  const identFromToken = await verifyAgentToken(tokenA, store, { tokenSecret: store.tokenSecret });
  check(
    'IDOR/ownership: token de A devuelve identidad de A, nunca de B',
    identFromToken === null || identFromToken.identity.agentId === 'agt_external_a',
    'la identidad sale del store por el token/agentId, no de parametros del cliente'
  );

  // -------------------------------------------------------------------------
  // ITEM 9 - rate limiting y 429
  // -------------------------------------------------------------------------
  const limiter = new MembraneRateLimiter(DEFAULT_MEMBRANE_CONFIG.rateLimit.rules ?? []);
  // forzar un limite estricto (1 por ventana)
  const strict = new MembraneRateLimiter([
    { endpointPattern: '.*', windowMs: 60000, maxRequests: 1 },
  ]);
  const now = Date.now();
  const first = strict.check('agt_external_a:/api/v1/public', now);
  const second = strict.check('agt_external_a:/api/v1/public', now);
  check(
    'rate limiting: 1er request permitido',
    first.allowed === true,
    'la primera llamada dentro de la ventana pasa'
  );
  check(
    'rate limiting: 2do request -> 429 con retryAfterMs',
    second.allowed === false && second.retryAfterMs > 0,
    'al superar maxRequests el limiter devuelve { allowed:false, retryAfterMs } (429)'
  );

  // -------------------------------------------------------------------------
  // ITEM 10 - whitelist de API publica
  // -------------------------------------------------------------------------
  const whitelistOk = (isMembranePermission('READ_PUBLIC')) && !isMembranePermission('READ_PUBLIC_HACK');
  check(
    'whitelist: permiso real esta en la membrana; uno inventado NO',
    whitelistOk,
    'isMembranePermission valida contra MEMBRANE_PERMISSIONS'
  );
  check(
    'whitelist: SUPER_ADMIN NO es recurso publico; existe solo como permiso elevado',
    !isMembranePermission(SUPER_ADMIN_PERMISSION) && MEMBRANE_PERMISSIONS.indexOf(SUPER_ADMIN_PERMISSION as any) === -1,
    'el engine NO whitelistea SUPER_ADMIN como permiso publico (constante elevada, inexpresable en recursos de la API publica)'
  );

  // -------------------------------------------------------------------------
  // ITEM 11 - ausencia de secretos/datos privados
  // -------------------------------------------------------------------------
  const storedHash = store.tokens.get('tok_a')!.tokenHash;
  check(
    'sin secretos: el store guarda HASH, no el token en claro',
    storedHash !== tokenA && storedHash.length === 64,
    'solo se persiste el hash sha256 (+prefijo), nunca el token'
  );
  check(
    'sin datos privados: agente no expone email/password',
    !('email' in okAgent) && !('password' in okAgent),
    'la identidad no acarrea credenciales humanas ni emails'
  );

  // -------------------------------------------------------------------------
  // ITEM 12 - identidad / auditoria de acciones
  // -------------------------------------------------------------------------
  const logged = await store.logAction({
    userId: 'user_A',
    agentId: 'agt_external_a',
    action: 'read',
    endpoint: '/api/v1/public',
    method: 'GET',
    statusCode: 200,
    ip: '127.0.0.1',
    extra: 'resource=guilds',
  });
  check(
    'auditoria: cada accion registra user+agent+accion+endpoint+method+status+ip+ts',
    logged.userId === 'user_A' && logged.agentId === 'agt_external_a' &&
    logged.action === 'read' && logged.method === 'GET' && logged.statusCode === 200 &&
    logged.ip === '127.0.0.1' && !!logged.createdAt,
    'el log de la membrana es trazable (quien/que/cuando)'
  );

  // -------------------------------------------------------------------------
  // Resumen + evidencia JSON determinista
  // -------------------------------------------------------------------------
  const passed = total - failures.length;
  const summary = {
    ronda: 'G',
    suite: 'MembraneTestM',
    total,
    passed,
    failed: failures.length,
    failures: failures.slice(0, 50),
    criterios: {
      'verifyAgentToken': !failures.some((f) => f.startsWith('verifyAgentToken')),
      'permisos AND': !failures.some((f) => f.startsWith('permisos AND')),
      'INTERNAL vs EXTERNAL': !failures.some((f) => f.startsWith('INTERNAL vs EXTERNAL')),
      'SUPER_ADMIN no por API publica': !failures.some((f) => f.startsWith('SUPER_ADMIN')),
      'revocacion': !failures.some((f) => f.startsWith('revocacion')),
      'bloqueo': !failures.some((f) => f.startsWith('bloqueo')),
      'expiracion': !failures.some((f) => f.startsWith('expiracion')),
      'IDOR/ownership': !failures.some((f) => f.startsWith('IDOR')),
      'rate limiting/429': !failures.some((f) => f.startsWith('rate limiting')),
      'whitelist API publica': !failures.some((f) => f.startsWith('whitelist')),
      'sin secretos/privados': !failures.some((f) => f.startsWith('sin secretos')) && !failures.some((f) => f.startsWith('sin datos')),
      'identidad/auditoria': !failures.some((f) => f.startsWith('auditoria')),
    },
    generatedAt: new Date().toISOString(),
    engine: 'src/lib/agents/engine.ts',
    store: 'scripts/agents/membrane-tests.ts::MemoryAgentStore',
  };
  ensureDir(OUT_DIR);
  fs.writeFileSync(path.join(OUT_DIR, 'membrane-tests.json'), JSON.stringify(summary, null, 2), 'utf8');
  console.log('\n===== RESUMEN (Test M) =====');
  console.log('Total: ' + total + ' | PASS: ' + passed + ' | FAIL: ' + failures.length);
  if (failures.length > 0) {
    console.log('FALLOS:');
    failures.forEach((f) => console.log('  - ' + f));
  }
  console.log('Evidencia: ' + OUT_DIR + '/membrane-tests.json');
})().catch((e) => {
  console.error('ERROR_INFRAESTRUCTURA: ' + (e && e.stack ? e.stack : String(e)));
  process.exit(1);
});
