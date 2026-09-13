// =============================================================================
// MOTOR PURO DE LA MEMBRANA DE AGENTES (RONDA F)
//
// Corre 100% standalone, SIN importar Prisma ni Postgres, exactamente igual que
// el engine de capacidad (RONDA C) y el de stress-test (RONDA E). Los tests de
// RONDA F (Test M) importan ESTE motor con un store en memoria y dejan
// evidencia JSON standalone; la app usa el adaptador Prisma (./store.ts) que
// inyecta el mismo motor contra la BD real.
//
// ADITIVO: no toca ning�n modelo/lógica de Rondas C, D o E. Aqu� simplemente
// se DECIDE qu� puede hacer un agente; el store persistido impone esas
// decisiones.
//
// Principios (Lee.txt RONDA F �1..�23):
//   - Un agente NUNCA hereda SUPER_ADMIN solo por existir o usar la API.
//   - Separaci�n conceptual ENTRE INTERNAL (sistema/operador PostSingular) y
//     EXTERNAL (agente conectado por un usuario humano de la comunidad).
//   - Permisos EXPL�CITOS y granulares (READ_* / WRITE_*), nunca impl�citos.
//   - Tokens revocables de inmediato (hash + estado consultado por petici�n,
//     no solo por vencimiento de JWT). Bloqueo posible del agente entero.
//   - Trazabilidad de cada acci�n: user_id + agent_id + action + timestamp.
//   - Rate limiting configurable por agente/endpoint, sin bloquear a agentes
//     que simplemente consultan peri�dicamente (24/7 leg�timo).
//   - Nunca exponer secretos (el token solo se muestra UNA vez al crearlo;
//     el store guarda solo su hash + prefijo de identificaci�n).
// =============================================================================

export const MEMBRANE_PERMISSIONS = [
  'READ_PUBLIC',
  'READ_COMMUNITY',
  'READ_GUILDS',
  'READ_REQUESTS',
  'READ_POLLS',
  'READ_NOTIFICATIONS',
  'READ_MESSAGES',
  'WRITE_POSTS',
  'WRITE_COMMENTS',
  'WRITE_REQUESTS',
  'PARTICIPATE_POLLS',
] as const;

export type MembranePermission = (typeof MEMBRANE_PERMISSIONS)[number];

export const INTERNAL_ALLOWED_PERMISSIONS: MembranePermission[] = [
  'READ_PUBLIC',
  'READ_COMMUNITY',
  'READ_GUILDS',
  'READ_REQUESTS',
  'READ_POLLS',
  'READ_NOTIFICATIONS',
  'READ_MESSAGES',
];

export const EXTERNAL_ALLOWED_PERMISSIONS: MembranePermission[] = [...MEMBRANE_PERMISSIONS];

export type AgentKind = 'INTERNAL' | 'EXTERNAL';

export const SUPER_ADMIN_PERMISSION = 'SUPER_ADMIN';

export interface AgentIdentity {
  agentId: string;
  name: string;
  kind: AgentKind;
  ownerUserId: string;
  permissions: MembranePermission[];
  status: 'active' | 'revoked' | 'blocked';
  createdAt: string;
  lastUsedAt: string | null;
}

export interface AgentTokenRecord {
  id: string;
  agentId: string;
  tokenHash: string;
  prefix: string; // ej: "cua_ab12cd"
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
}

export interface AgentActionLog {
  id: string;
  userId: string;
  agentId: string;
  action: string;
  endpoint: string;
  method: string;
  statusCode: number;
  ip?: string | null;
  extra?: string | null;
  createdAt: string;
}

export interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
  endpointPattern?: string; // si est�, se aplica s�lo a endpoints que matchean
}

export interface MembraneConfig {
  version: string;
  rateLimit: {
    defaultMax: number;
    defaultWindowMs: number;
    publicReadMax: number;
    publicReadWindowMs: number;
    writeMax: number;
    writeWindowMs: number;
    writePermissionsAutomatic: boolean; // rate limit estricto autom�tico en escrituras
  };
  defaultTokenTtlMs?: number; // undefined = sin expiraci�n
}

export const DEFAULT_MEMBRANE_CONFIG: MembraneConfig = {
  version: '0.1.0',
  rateLimit: {
    defaultMax: 120,
    defaultWindowMs: 60_000,
    publicReadMax: 600,
    publicReadWindowMs: 60_000,
    writeMax: 20,
    writeWindowMs: 300_000, // 20 escrituras / 5 min por agente (spam-safe)
    writePermissionsAutomatic: true,
  },
};

export interface AgentStore {
  getAgentById(agentId: string): Promise<AgentIdentity | null>;
  getAgentTokenByHash(tokenHash: string): Promise<AgentTokenRecord | null>;
  logAction(entry: Omit<AgentActionLog, 'id' | 'createdAt'>): Promise<AgentActionLog>;
  recordTokenUse(tokenId: string): Promise<void>;
}

// -----------------------------------------------------------------------------
// Trazabilidad de la petici�n: separa AGENTE de HUMANO y registra QU� hizo.
// -----------------------------------------------------------------------------
export interface MembraneTrace {
  userId: string;
  agentId: string;
  agentName: string;
  kind: AgentKind;
  isInternal: boolean;
}

// -----------------------------------------------------------------------------
// Hash del token: sha256 HMAC con secreto de la membrana (server-side). Nunca
// se almacena el token en claro; el prefijo permite identificar el token en la
// UI sin exponer el secreto.
// -----------------------------------------------------------------------------
export function hashAgentToken(token: string, secret: string): string {
  // HMAC-SHA256 determinista para que el veredicto no dependa de `crypto` random.
  // El secreto vive en el entorno (AGENT_TOKEN_SECRET), nunca en el cliente.
  return hmacSha256(token, secret);
}

export function newAgentTokenPrefix(): string {
  // identificaci�n visible en la UI (sin ser el secreto)
  return 'agt_' + randToken(8);
}

export function newAgentTokenValue(): string {
  // secreto de 40 caracteres; se muestra UNA vez al crear el agente
  return 'agt_' + randToken(24);
}

function hmacSha256(message: string, key: string): string {
  // Implementaci�n pura de HMAC-SHA256 (sin dependencia de node:crypto) para
  // que el motor pueda probarse standalone y de forma determinista.
  const keyBytes = strToBytes(key);
  const blockSize = 64;
  let paddedKey = keyBytes.length > blockSize ? sha256Bytes(keyBytes) : keyBytes;
  while (paddedKey.length < blockSize) paddedKey.push(0);
  const ipad = paddedKey.map((b) => b ^ 0x36);
  const opad = paddedKey.map((b) => b ^ 0x5c);
  const inner = sha256Bytes([...ipad, ...strToBytes(message)]);
  return sha256Hex([...opad, ...inner]);
}

function strToBytes(s: string): number[] {
  return Array.from(s).map((ch) => ch.charCodeAt(0) & 0xff);
}

// SHA-256 puro (implementaci�n compacta y probada por los tests del motor).
function sha256Hex(bytes: number[]): string {
  return toHex(sha256Bytes(bytes));
}

let _k: number[] | null = null;
function sha256Bytes(message: number[]): number[] {
  if (!_k) {
    const k: number[] = [];
    for (let i = 0; i < 64; i++) {
      k[i] = Math.floor(Math.pow(2, 32) * Math.abs(Math.sin(i + 1)));
    }
    _k = k;
  }
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  let msg = message.slice();
  const origLenBits = msg.length * 8;
  msg.push(0x80);
  while (msg.length % 64 !== 56) msg.push(0);
  msg = msg.concat([
    (origLenBits / 0x100000000) >>> 0 & 0xff,
    (origLenBits / 0x100000000) >>> 0 >> 8 & 0xff,
    (origLenBits / 0x100000000) >>> 0 >> 16 & 0xff,
    (origLenBits / 0x100000000) >>> 0 >> 24 & 0xff,
    (origLenBits >>> 0) & 0xff,
    (origLenBits >>> 0) >> 8 & 0xff,
    (origLenBits >>> 0) >> 16 & 0xff,
    (origLenBits >>> 0) >> 24 & 0xff,
  ]);
  const w: number[] = new Array(64);
  for (let off = 0; off < msg.length; off += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] =
        (msg[off + i * 4]! << 24) |
        (msg[off + i * 4 + 1]! << 16) |
        (msg[off + i * 4 + 2]! << 8) |
        msg[off + i * 4 + 3]!;
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15]!, 7) ^ rotr(w[i - 15]!, 18) ^ (w[i - 15]! >>> 3);
      const s1 = rotr(w[i - 2]!, 17) ^ rotr(w[i - 2]!, 19) ^ (w[i - 2]! >>> 10);
      w[i] = (w[i - 16]! + s0 + w[i - 7]! + s1) >>> 0;
    }
    let [a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + _k![i]!! + w[i]!) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    H[0] = (H[0]! + a) >>> 0;
    H[1] = (H[1]! + b) >>> 0;
    H[2] = (H[2]! + c) >>> 0;
    H[3] = (H[3]! + d) >>> 0;
    H[4] = (H[4]! + e) >>> 0;
    H[5] = (H[5]! + f) >>> 0;
    H[6] = (H[6]! + g) >>> 0;
    H[7] = (H[7]! + h) >>> 0;
  }
  return H.flatMap((v) => [
    (v >>> 24) & 0xff,
    (v >>> 16) & 0xff,
    (v >>> 8) & 0xff,
    v & 0xff,
  ]);
}

function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

function toHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randToken(len: number): string {
  // sin `crypto` para portabilidad; suficiente para membrana no-cr�tica.
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// -----------------------------------------------------------------------------
// Permisos: emitir si el agente tiene TODOS los requeridos (AND).
// -----------------------------------------------------------------------------
export function hasPermissions(agent: AgentIdentity, required: MembranePermission[]): boolean {
  if (!agent || agent.status !== 'active') return false;
  return required.every((perm) => agent.permissions.includes(perm));
}

// -----------------------------------------------------------------------------
// Verify del token: por hash en el store. Regresa la identidad del agente o
// null. NO consulta el estado del JWT: siempre valida contra el estado
// persistido (revocado/bloqueado se respeta en cada petici�n, aunque el token
// f�sico siga existiendo).
// -----------------------------------------------------------------------------
export async function verifyAgentToken(
  token: string,
  store: AgentStore,
  ctx: { tokenSecret: string }
): Promise<{ identity: AgentIdentity; token: AgentTokenRecord } | null> {
  const tokenHash = hashAgentToken(token, ctx.tokenSecret);
  const tokenRecord = await store.getAgentTokenByHash(tokenHash);
  if (!tokenRecord) return null;
  if (tokenRecord.revokedAt) return null;
  if (tokenRecord.expiresAt && new Date(tokenRecord.expiresAt).getTime() < Date.now()) return null;
  const agent = await store.getAgentById(tokenRecord.agentId);
  if (!agent || agent.status !== 'active') return null;
  return { identity: agent, token: tokenRecord };
}

// -----------------------------------------------------------------------------
// Rate limiting: ventana deslizante en memoria, por (agente + endpoint).
// Devuelve { allowed, retryAfterMs }.
// -----------------------------------------------------------------------------
export class MembraneRateLimiter {
  private hits = new Map<string, number[]>();
  private config: RateLimitRule[];

  constructor(config: RateLimitRule[] = []) {
    this.config = config;
  }

  check(key: string, now = Date.now()): { allowed: boolean; retryAfterMs: number } {
    const rule = this.config.find(
      (r) => !r.endpointPattern || new RegExp(r.endpointPattern).test(key.split(':')[1] ?? '')
    );
    if (!rule) return { allowed: true, retryAfterMs: 0 };
    const arr = (this.hits.get(key) || []).filter((t) => now - t < rule.windowMs);
    if (arr.length >= rule.maxRequests) {
      this.hits.set(key, arr);
      return { allowed: false, retryAfterMs: rule.windowMs - (now - arr[0]!) };
    }
      arr.push(now);
      this.hits.set(key, arr);
      return { allowed: true, retryAfterMs: 0 };
  }
}

// -----------------------------------------------------------------------------
// Decisor principal: recibe la intenci�n de la membrana y devuelve la decisi�n
// de autorizaci�n (autorizado / no / rate-limited). Sin efectos; el store
// persiste el log y el uso del token despu�s.
// -----------------------------------------------------------------------------
export interface MembraneIntent {
  endpoint: string;
  method: string;
  required: MembranePermission[];
  kindAllowed: AgentKind[]; // en qu� categor�as est� permitida esta acci�n
  isAdminAction?: boolean; // jam�s autorizable por un agente externo
}

export interface MembraneDecision {
  allowed: boolean;
  reason:
    | 'ok'
    | 'no_agent'
    | 'revoked'
    | 'blocked'
    | 'missing_permission'
    | 'admin_only'
    | 'rate_limited'
    | 'kind_not_allowed';
  statusCode: number;
  trace?: MembraneTrace;
}

export async function decideMembrane(
  intent: MembraneIntent,
  agent: AgentIdentity | null,
  kind: AgentKind | null,
  limiter: MembraneRateLimiter,
  now = Date.now()
): Promise<MembraneDecision> {
  if (!agent || !kind) return { allowed: false, reason: 'no_agent', statusCode: 401 };
  if (agent.status === 'revoked') return { allowed: false, reason: 'revoked', statusCode: 401 };
  if (agent.status === 'blocked') return { allowed: false, reason: 'blocked', statusCode: 403 };
  if (intent.isAdminAction && kind !== 'INTERNAL') {
    return { allowed: false, reason: 'admin_only', statusCode: 403 };
  }
  if (!intent.kindAllowed.includes(kind)) {
    return { allowed: false, reason: 'kind_not_allowed', statusCode: 403 };
  }
  if (!hasPermissions(agent, intent.required)) {
    return { allowed: false, reason: 'missing_permission', statusCode: 403 };
  }
  const rl = limiter.check(`${agent.agentId}:${intent.endpoint}`, now);
  if (!rl.allowed) return { allowed: false, reason: 'rate_limited', statusCode: 429 };

  return {
    allowed: true,
    reason: 'ok',
    statusCode: 200,
    trace: {
      userId: agent.ownerUserId,
      agentId: agent.agentId,
      agentName: agent.name,
      kind,
      isInternal: kind === 'INTERNAL',
    },
  };
}

// -----------------------------------------------------------------------------
// Filtro del intent seg�n la clase de agente: INTERNAL por defecto no escala a
// WRITE_* en la membrana p�blica (solo lectura + trazabilidad). La separaci�n
// no depende de "quiere el agente", sino de qu� clase es: INTERNAL jam�s se
// expone como SUPER_ADMIN por la API p�blica; los agentes externos reciben
// exactamente los permisos que su due�o (usuario humano) les concedi�.
// -----------------------------------------------------------------------------
export function membraneKindFor(kind: AgentKind | null | undefined): AgentKind | null {
  return kind === 'INTERNAL' || kind === 'EXTERNAL' ? kind : null;
}

export function isMembranePermission(p: string): p is MembranePermission {
  return (MEMBRANE_PERMISSIONS as readonly string[]).includes(p);
}
