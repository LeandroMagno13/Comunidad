// ============================================================================
// RONDA C — FORMULAS CANONICAS COMPARTIDAS (producto ⇄ engine)
//
// Unica fuente de verdad para las reglas de capacidad y senales. Ambas capas
// (producto: src/lib/capacity.ts; simulador: scripts/capacity/engine.ts)
// importan estas funciones; NUNCA se duplica la formula.
//
// NO contiene logica de PID ni de dinero. No convierte CU ⇄ patrimonio.
// Nivel de acceso = participacion/contribucion, nunca saldo de CU.
// ============================================================================

// Multiplicador de oferta efectiva por nivel de acceso. Canonico (ver
// AUDITORIA-CU-CAPACIDAD.md §7): avanzado pesa 1.0 (como disponibilidad x
// calidad, rango 0..1), medio 0.5, basico 0.2. Engine usaba avanzado = 2.0;
// esa divergencia queda unificada aqui, razon documentada en el CLEANUP doc.
export const LEVEL_FACTOR = { basico: 0.2, medio: 0.5, avanzado: 1.0 } as const;

export type AccessLevelName = keyof typeof LEVEL_FACTOR;

export function levelWeight(level: string): number {
  const w = LEVEL_FACTOR[level as AccessLevelName];
  return w ?? LEVEL_FACTOR.basico;
}

// Engine usa niveles numericos 0/1/2; producto usa strings 'basico'/'medio'/'avanzado'.
export function levelWeightFromIndex(n: number): number {
  if (n >= 2) return LEVEL_FACTOR.avanzado;
  if (n >= 1) return LEVEL_FACTOR.medio;
  return LEVEL_FACTOR.basico;
}

export function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

// ---------------------------------------------------------------------------
// SENALES: presion y carga humana son metricas INDEPENDIENTES.
// ---------------------------------------------------------------------------

// Presion: demanda insatisfecha / oferta efectiva (0 si no hay demanda).
// Escasez real -> alta; demanda totalmente satisfecha -> 0 (por diseno). El
// complemento es cargaHumana (utilizacion). Formula documentada en
// REPORTE-CU-CAPACIDAD.md §12 y AUDITORIA §15.
export function presionFrom(demandaInsatisfecha: number, ofertaEfectiva: number): number {
  return demandaInsatisfecha > 0 && ofertaEfectiva > 0
    ? round2(demandaInsatisfecha / ofertaEfectiva)
    : demandaInsatisfecha > 0
    ? 100
    : 0;
}

// Carga humana: capacidad humana UTILIZADA / capacidad humana DISPONIBLE.
// Mide cuanto del recurso humano se ocupo realmente (utilizacion), NO la
// demanda pendiente. Independiente de la presion: una demanda totalmente
// satisfecha que ocupa toda la capacidad humana da presion ~0 y carga alta.
export function cargaHumanaFrom(utilizada: number, disponible: number): number {
  return disponible > 0 ? round2(utilizada / disponible) : utilizada > 0 ? 100 : 0;
}

// ---------------------------------------------------------------------------
// GRANT DE BIENVENIDA — politica propia y explicita, NO depende de metrics.error
// (el PID no influye; ver AUDITORIA §2-C).
// ---------------------------------------------------------------------------
export function welcomeGrant(config: { newUserGrantCu: number; grantCap: number }): number {
  if (!Number.isInteger(config.newUserGrantCu) || config.newUserGrantCu <= 0) return 0;
  const cap = config.grantCap > 0 ? config.grantCap : config.newUserGrantCu;
  return Math.max(0, Math.min(config.newUserGrantCu, cap));
}

// ---------------------------------------------------------------------------
// EXPIRACION DE SOLICITUDES — demanda vigente, no acumulacion historica.
// ---------------------------------------------------------------------------
export function shouldExpire(createdAt: Date, windowDays: number, now: Date): boolean {
  const limit = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  return createdAt.getTime() < limit.getTime();
}

export function expiresAtFrom(now: Date, windowDays: number): Date {
  return new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// NIVEL DE ACCESO = participacion/contribucion verificada. NUNCA saldo de CU.
// Politica experimental vigente (no la definitiva): no asume jerarquia moral.
// ---------------------------------------------------------------------------
export function accessLevelFrom(context: { asProvider: number; asAsker: number }): 'avanzado' | 'medio' | 'basico' {
  if (context.asProvider >= 1) return 'avanzado'; // contribucion verificada (satisfacer a otros)
  if (context.asAsker >= 1) return 'medio'; // participo solicitando
  return 'basico'; // piso: nadie queda fuera por no tener nada que ofrecer
}

// ---------------------------------------------------------------------------
// RONDA D — PRESUPUESTO DE URGENCIA (reemplaza la "apuesta de prioridad" libre)
//
// La apuesta libre (RONDA C) no tenia costo de oportunidad real: la senal de
// urgencia se saturaba y quien acumulaba CU podia comprar prioridad
// (reintroducia concentracion). RONDA D:
//   1) presupuesto PERIODICO y NO ACUMULABLE (no se puede ahorrar urgencia);
//   2) costo CRECIENTE (cuadratico: marcar 2 cuesta 4, marcar 3 cuesta 9) —
//      adaptacion del quadratic voting: gritar mas fuerte cuesta mas caro;
//   3) la urgencia NO se transfiere ni se convierte en CU (principio de bancos
//      del tiempo: el proveedor recibe participacion verificada, no urgencia).
// ---------------------------------------------------------------------------

// Costo de marcar una solicitud como urgente con nivel 1..N. Cuadratico.
export function urgencyCost(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return l * l;
}

// Clave de periodo del presupuesto (no acumulable entre periodos). Usa dias de
// reloj UTC; un usuario no puede "guardar" puntos para el proximo periodo.
export function urgencyPeriodKey(now: Date, periodDays: number): string {
  const days = Math.floor(now.getTime() / (periodDays * 24 * 60 * 60 * 1000));
  return `p${days}`;
}

// Presupuesto vigente de un usuario: si el periodo cambio, se resetea al tope.
// El parametro `base` es la asignacion fija por periodo (configurable).
export function urgencyBudgetFor(
  base: number,
  current: { period: string; remaining: number },
  now: Date,
  periodDays: number
): number {
  return current.period === urgencyPeriodKey(now, periodDays) ? current.remaining : base;
}