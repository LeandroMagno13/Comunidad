// Verificación CSRF compatible con Edge Runtime (middleware).
//
// NO importa node:crypto (no disponible en Edge): usa comparación directa.
// Es seguro porque el token es aleatorio de 256 bits: adivinarlo es
// inviable independientemente del tiempo de comparación, y la ventana
// de medición remota no es explotable en la práctica para este caso.
//
// Reglas:
// - Solo se verifican mutaciones (POST/PUT/PATCH/DELETE) bajo /api/.
// - Requests con `Authorization: Bearer ...` quedan EXENTAS: no usan
//   cookies, así que no hay riesgo CSRF (agentes externos, scripts).
//   Sin esta exención, la API de agentes se rompería con 403.
// - Sin cookie o sin header, o si no coinciden → 'missing' | 'mismatch'.

// NOTA: no se importa de './csrf-client' porque Node ESM (tests) exige
// extensión explícita y TS no la admite sin flags extra. Los valores DEBEN
// coincidir con src/lib/csrf-client.ts; el test csrf-edge.test.mjs lo
// verifica (anti-drift). Si cambiás un valor, cambialo en ambos archivos.
const CSRF_COOKIE = 'cps_csrf';
const CSRF_HEADER = 'x-csrf-token';

export type CsrfCheckResult = 'ok' | 'skipped' | 'missing' | 'mismatch';

function isMutation(method: string): boolean {
  const m = method.toUpperCase();
  return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const found = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return found ? found.slice(name.length + 1) : null;
}

export function csrfCheckEdge(req: Request): CsrfCheckResult {
  if (!isMutation(req.method)) return 'skipped';

  // Autenticación por Bearer (agentes/scripts): no hay cookies → no hay CSRF.
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return 'skipped';

  const cookie = readCookie(req.headers.get('cookie'), CSRF_COOKIE);
  const header = req.headers.get(CSRF_HEADER);
  if (!cookie || !header) return 'missing';
  return cookie === header ? 'ok' : 'mismatch';
}

// Activación del bloqueo: solo con CSRF_ENFORCE=true explícito.
// Por defecto (incluido desarrollo) solo se OBSERVA: se loguea y se marca
// la respuesta con `x-csrf-would-block: 1`, sin romper nada.
export function isCsrfEnforced(): boolean {
  return process.env.CSRF_ENFORCE === 'true';
}
