// ============================================================================
// RONDA C â€” Sistema de seÃ±alizaciÃ³n y asignaciÃ³n de capacidad (CU)
// ----------------------------------------------------------------------------
// No hay PID, no hay "canasta = 100 CU", no hay emisiÃ³n automÃ¡tica por error.
// Las CU son seÃ±ales de demanda/participaciÃ³n dentro de una capacidad real
// limitada. El patrimonio real es la fuente material (separada de CU).
//
// Reglas del mini-mundo (documentadas, ver REPORTE-CU-CAPACIDAD.md Â§3-Â§9):
//   R1  Demanda: cada agente genera solicitudes (capacidad, intensidad, CU
//       apostadas como prioridad). La apuesta queda en hold mientras espera.
//   R2  Oferta: cada agente declara capacidades (disponibilidad Ã— calidad).
//       La oferta efectiva = Î£ agentes (disponibilidad Ã— calidad).
//   R3  AutomatizaciÃ³n: la tecnologÃ­a satisface `automatizacionÃ—demanda`
//       antes de asignar capacidad humana.
//   R4  SeÃ±al de presiÃ³n: presiÃ³n = demandaHumanaInsatisfecha / capacidadEff.
//       (0 si no hay demanda; ver Â§9 del informe: fÃ³rmula, por quÃ©, riesgos)
//   R5  AsignaciÃ³n racionada: piso para nivel BÃSICO (el bÃ¡sico nunca queda
//       sin acceso mientras exista alguna capacidad); luego medio; luego
//       avanzado. Dentro del mismo nivel, mayor apuesta de CU decides brega.
//   R6  Nivel â‰  rango social: nivel = participaciÃ³n + contribuciones
//       verificadas (celeridad + entregas); NO solo balance de CU.
//   R7  CU consumida por demanda satisfecha (pasa al proveedor como crÃ©dito
//       de contribuciÃ³n); si la solicitud expira sin satisfacerse, la apuesta
//       vuelve. El CU se comporta como seÃ±al, no como dinero (se estresa).
//   R8  Patrimonio: separado. La absorciÃ³n real de capacidad consume un
//       presupuesto de RECURSOS DISTRIBUIBLES (distributableCapacity), no CU.
//   R9  EmisiÃ³n: polÃ­tica separada y documentada (grants bÃ¡sicos y de
//       participaciÃ³n, con topes y reglas anti-farming) â€” nunca PID.
// ============================================================================

import { levelWeightFromIndex, presionFrom, cargaHumanaFrom } from '@/src/lib/cap-formulas';

export type AccessLevel = 0 | 1 | 2; // 0=bÃ¡sico 1=medio 2=avanzado

export interface CapacityDef {
  id: string;
  categoria: string;
  nombre: string;
  automatizacion: number; // 0..1 fracciÃ³n de la demanda que la tecnologÃ­a cubre
}

export interface AgentOffer {
  capacityId: string;
  disponibilidad: number; // 0..1
  calidad: number; // 0..1
}

export interface Agent {
  id: number;
  wealth: number; // patrimonio simulado (USD)
  cu: number; // balance de CU (seÃ±al de participaciÃ³n)
  committedCu: number; // CU en hold por solicitudes activas
  participation: number; // actividad acumulada 0..1
  contributions: number; // entregas satisfechas como proveedor
  capacityWeight: number; // nivel ponderado de capacidades ofertadas (2024: oferta)
  nivelAcceso: AccessLevel;
  offers: AgentOffer[];
  resourcesUsed: number; // recursos distribuibles absorbidos al ciclo actual
  requestsCreated: number; // solicitudes generadas
  requestsSatisfied: number;
  requestsUnsatisfied: number;
  skills: string[];
}

export interface CapacityRequest {
  id: number;
  cycle: number;
  expiryCycle: number;
  agent: number; // solicitante
  capacityId: string;
  intensity: number; // 1..3
  cuCommitted: number; // apuesta (prioridad)
  provider: number | null; // agente que satisface
  status: 'registered' | 'satisfied' | 'expired';
}

export interface CapacityStat {
  capacidad: string;
  demandaRegistrada: number;
  demandaSatisfecha: number;
  demandaInsatisfecha: number;
  automatizada: number; // demanda satisfecha por tecnologÃ­a
  humanaSatisfecha: number;
  ofertaDisponible: number;
  ofertaUtilizada: number;
  
  cargaHumana: number; // demanda humana que cae sobre la capacidad efectiva
}

export interface CycleSnapshot {
  cycle: number;
  stats: CapacityStat[];
  acceso: { basico: number; medio: number; avanzado: number };
  cuSupply: number;
  cuCirculante: number;
  cuAccumulatedTop: number; // fracciÃ³n de CU en el 10 % con mÃ¡s CU
  cuGini: number;
  demandaTotal: number;
  demandaSatisfecha: number;
  demandaInsatisfecha: number;
  pctSatisfecha: number;
  recursosUsados: number;
  recursosDistribuidos: number;
  participants: number;
}

export interface CapacitySimConfig {
  agents: number;
  cycles: number;
  seed: number;
  cuInit: number; // CU inicial por agente (seÃ±al)
  wealthPerAgent: number; // patrimonio inicial por agente (USD)
  wealthDistribution: 'uniform' | 'desigual' | 'concentrada';
  demandScale: number; // probabilidad base de generar solicitud/agente/ciclo
  demandGrowth: number; // %/ciclo de crecimiento de demanda
  demandShock: { cycle: number; amount: number } | null;
  demandConcentration: { capacityId: string; frac: number } | null; // concentra demanda en una capacidad
  supplyScale: number; // 1 = oferta nominal por agente; <1 escasez; >1 abundancia
  supplyMonopoly: { capacityId: string; providerFrac: number } | null; // % de proveedores concentrados
  automation: { [capacityId: string]: number }; // recortes sobre automatizacion base
  automationShock: { capacityId: string; cycle: number; to: number } | null; // automatizaciÃ³n repentina
  newTechCycle: number | null; // apariciÃ³n de nueva capacidad tecnolÃ³gica
  participation: {
    sinCapacidades: number; // fracciÃ³n de agentes sin ofertas (participaciÃ³n baja)
    inactivos: number; // fracciÃ³n que casi no genera demanda
    expertos: number; // fracciÃ³n de agentes expertos muy demandados
  };
  distributableRate: number; // fracciÃ³n del patrimonio realmente distribuible (regla Â§8)
  grantsEnabled: boolean;
  grantNewUserCu: number;
  grantParticipationCu: number;
  grantParticipationEvery: number; // ciclos entre micro-grants
  cuCap: number; // tope de balance (anti-reserva de valor; 0 = sin tope)
  maxHoldCycles: number; // ventana de espera antes de expirar solicitud
  accessRule: { basicFloor: number; agentBasicQuota: number }; // R5
}

export const DEFAULT_CAPACITY_CONFIG: CapacitySimConfig = {
  agents: 200,
  cycles: 40,
  seed: 101,
  cuInit: 4,
  wealthPerAgent: 1000,
  wealthDistribution: 'uniform',
  demandScale: 0.25,
  demandGrowth: 0,
  demandShock: null,
  demandConcentration: null,
  supplyScale: 1,
  supplyMonopoly: null,
  automation: {},
  automationShock: null,
  newTechCycle: null,
  participation: { sinCapacidades: 0, inactivos: 0, expertos: 0 },
  distributableRate: 0.2,
  grantsEnabled: true,
  grantNewUserCu: 3,
  grantParticipationCu: 1,
  grantParticipationEvery: 5,
  cuCap: 30,
  maxHoldCycles: 8,
  accessRule: { basicFloor: 0.34, agentBasicQuota: 0.02 },
};

export const CAPACITY_CATALOG: CapacityDef[] = [
  { id: 'programacion', categoria: 'tÃ©cnica', nombre: 'ProgramaciÃ³n de software', automatizacion: 0.4 },
  { id: 'reparacion', categoria: 'tÃ©cnica', nombre: 'ReparaciÃ³n tÃ©cnica', automatizacion: 0.15 },
  { id: 'asesoria-juridica', categoria: 'profesional', nombre: 'Asesoramiento jurÃ­dico', automatizacion: 0.5 },
  { id: 'diseno', categoria: 'creativa', nombre: 'DiseÃ±o grÃ¡fico y UI', automatizacion: 0.5 },
  { id: 'mediacion', categoria: 'social', nombre: 'MediaciÃ³n de conflictos', automatizacion: 0.1 },
  { id: 'investigacion', categoria: 'profesional', nombre: 'InvestigaciÃ³n y anÃ¡lisis', automatizacion: 0.3 },
  { id: 'traduccion', categoria: 'lingÃ¼Ã­stica', nombre: 'TraducciÃ³n', automatizacion: 0.8 },
  { id: 'fabricacion', categoria: 'manual', nombre: 'FabricaciÃ³n artesanal', automatizacion: 0.2 },
  { id: 'soporte-tecnico', categoria: 'tÃ©cnica', nombre: 'Soporte tÃ©cnico', automatizacion: 0.6 },
  { id: 'salud-y-cuidado', categoria: 'social', nombre: 'Salud y cuidado personal', automatizacion: 0.05 },
];

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function giniValues(sorted: number[]): number {
  const n = sorted.length;
  if (n < 2) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += (2 * (i + 1) - n - 1) * sorted[i]!;
  return Math.abs(sum / (n * sorted.reduce((a, b) => a + b, 0) + 1e-9));
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

export interface CapacitySim {
  config: CapacitySimConfig;
  agents: Agent[];
  requests: CapacityRequest[];
  history: CycleSnapshot[];
  finalStats: CapacityStat[];
  seed: number;
}

// ---------------------------------------------------------------------------
// ConstrucciÃ³n de agentes
// ---------------------------------------------------------------------------
function buildAgents(cfg: CapacitySimConfig, rng: () => number): Agent[] {
  const agents: Agent[] = [];
  const all = CAPACITY_CATALOG.map((c) => c.id);
  const nSinCap = Math.round(cfg.agents * cfg.participation.sinCapacidades);
  const nInactivos = Math.round(cfg.agents * cfg.participation.inactivos);
  const nExpertos = Math.round(cfg.agents * cfg.participation.expertos);

  const wealths = allocateByDistribution(cfg);
  for (let i = 0; i < cfg.agents; i++) {
    const skills: string[] = [];
    const offers: AgentOffer[] = [];
    const isSinCap = i < nSinCap;
    const isExperto = i >= cfg.agents - nExpertos;
    if (!isSinCap) {
      const nSkills = 1 + Math.floor(rng() * 2);
      const pool = [...all];
      const pickCap = (skip?: string) => {
        const cand = pool.filter((c) => c !== skip);
        const idx = Math.floor(rng() * cand.length);
        const id = cand[idx]!;
        pool.splice(pool.indexOf(id), 1);
        return id;
      };
      for (let k = 0; k < nSkills; k++) {
        const id = pickCap();
        skills.push(id);
        const esp = isExperto ? 1.2 + rng() * 0.6 : 0;
        offers.push({
          capacityId: id,
          disponibilidad: clamp(0.4 + rng() * 0.5 + esp, 0, 1),
          calidad: clamp(0.5 + rng() * 0.5 + (isExperto ? 0.45 : 0), 0, 1),
        });
      }
    }
    const capacityWeight = offers.reduce((s, o) => s + o.disponibilidad * o.calidad, 0);
    const cuShare = 0.5 + rng() * cfg.cuInit;
    agents.push({
      id: i,
      wealth: wealths[i]!,
      cu: cfg.cuInit,
      committedCu: 0,
      participation: 0,
      contributions: 0,
      capacityWeight,
      nivelAcceso: 1,
      offers,
      resourcesUsed: 0,
      requestsCreated: 0,
      requestsSatisfied: 0,
      requestsUnsatisfied: 0,
      skills,
    });
    void cuShare;
  }
  return agents;
}

function allocateByDistribution(cfg: CapacitySimConfig): number[] {
  const n = cfg.agents;
  const total = cfg.wealthPerAgent * n;
  if (cfg.wealthDistribution === 'uniform') return new Array(n).fill(cfg.wealthPerAgent);
  if (cfg.wealthDistribution === 'desigual') {
    // 20% retiene 80%
    const out: number[] = [];
    const richN = Math.max(1, Math.round(n * 0.2));
    const rich = (total * 0.8) / richN;
    const poor = (total * 0.2) / (n - richN || 1);
    for (let i = 0; i < n; i++) out.push(i < richN ? rich : poor);
    return out;
  }
  // concentrada: 2% retiene 90 %
  const out: number[] = [];
  const topN = Math.max(1, Math.round(n * 0.02));
  const top = (total * 0.9) / topN;
  const rest = (total * 0.1) / (n - topN || 1);
  for (let i = 0; i < n; i++) out.push(i < topN ? top : rest);
  return out;
}

// ---------------------------------------------------------------------------
// MÃ©tricas puras (correlaciÃ³n Pearson)
// ---------------------------------------------------------------------------
export function pearson(a: number[], b: number[]): number | null {
  if (a.length !== b.length || a.length < 2) return null;
  const n = a.length;
  let sx = 0;
  let sy = 0;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sx += a[i]!;
    sy += b[i]!;
    sxy += a[i]! * b[i]!;
    sxx += a[i]! * a[i]!;
    syy += b[i]! * b[i]!;
  }
  const den = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
  if (den < 1e-9) return null;
  return (n * sxy - sx * sy) / den;
}

// ---------------------------------------------------------------------------
// SimulaciÃ³n RONDA C
// ---------------------------------------------------------------------------
export function runCapacitySim(cfg: CapacitySimConfig): CapacitySim {
  const rng = mulberry32(cfg.seed);
  const agents = buildAgents(cfg, rng);
  // recursos distribuibles por agente por ciclo (regla: solo fracciÃ³n del patrimonio
  // disponible, tras reservas/reinversiÃ³n/costos) â€” R8
  const distributablePerAgent = agents.map((a) => {
    const regla = { reservas: 0.4, reinversion: 0.3, costos: 0.1 };
    const distrib = Math.max(0, a.wealth * (cfg.distributableRate ?? (1 - regla.reservas - regla.reinversion - regla.costos)));
    return distrib / Math.max(1, cfg.cycles);
  });
  const recursosPorNivel = [0.1, 0.35, 0.55]; // cuota de recursos por nivel de acceso

  let requests: CapacityRequest[] = [];
  let nextReqId = 1;
  const history: CycleSnapshot[] = [];
  const pressurePast = new Map<string, number>();

  const inactivos = new Set<number>();
  const sinCap = new Set<number>();
  const expertos = new Set<number>();
  const capFrac: Record<string, number> = cfg.demandConcentration
    ? { [cfg.demandConcentration.capacityId]: cfg.demandConcentration.frac }
    : {};
  let currentCycle = 0; // set en cada iteraciÃ³n (autoOf lee el ciclo vigente)
  const autoOf = (c: CapacityDef): number => {
    if (cfg.automationShock && cfg.automationShock.capacityId === c.id && currentCycle >= cfg.automationShock.cycle) {
      return cfg.automationShock.to;
    }
    if (cfg.newTechCycle && c.id === newTechTarget && currentCycle >= cfg.newTechCycle) return 0.92;
    return cfg.automation[c.id] ?? c.automatizacion;
  };
  const newTechTarget = cfg.newTechCycle ? CAPACITY_CATALOG.reduce((acc, c) => (c.automatizacion < acc.automatizacion ? c : acc)).id : null;

  // proveedores efectivos (monopolio = fracciÃ³n minoritaria de oferentes)
  function effProviders(capId: string): Agent[] {
    const all = agents.filter((a) => a.offers.some((o) => o.capacityId === capId));
    if (!cfg.supplyMonopoly || cfg.supplyMonopoly.capacityId !== capId) return all;
    const keep = Math.max(1, Math.round(all.length * cfg.supplyMonopoly.providerFrac));
    return all.slice(0, keep);
  }

  // participaciones iniciales
  const nInact = Math.round(cfg.agents * cfg.participation.inactivos);
  const nSin = Math.round(cfg.agents * cfg.participation.sinCapacidades);
  const nExp = Math.round(cfg.agents * cfg.participation.expertos);
  for (let i = 0; i < cfg.agents; i++) if (i < nSin) sinCap.add(i);
  for (let i = 0; i < cfg.agents; i++) if (i >= cfg.agents - nExp) expertos.add(i);
  for (let i = 0; i < nInact; i++) inactivos.add(i);

  function statsOf(): CapacityStat[] {
    return CAPACITY_CATALOG.map((c) => {
      const dem = requests.filter((r) => r.capacityId === c.id);
      const sat = dem.filter((r) => r.status === 'satisfied');
      const humanSatisfied = sat.filter((r) => r.provider !== null).length;
      const autoSatisfied = sat.filter((r) => r.provider === null).length;
      const total = dem.length;
      const satN = sat.length;
      const unsatisfied = total - satN;
const offer = effProviders(c.id).reduce((s, a) => {
        const o = a.offers.find((x) => x.capacityId === c.id);
        // Factor de nivel CANÓNICO compartido con el producto (cap-formulas.ts):
        // basico 0.2 / medio 0.5 / avanzado 1.0. Engine ya NO usa 0.2/1.0/2.0.
        return s + (o ? o.disponibilidad * o.calidad * levelWeightFromIndex(a.nivelAcceso) : 0);
      }, 0);
      const eff = offer * cfg.supplyScale;
      // Presión: demanda insatisfecha / oferta efectiva (escasez).
      // Carga humana: capacidad humana UTILIZADA (satisfecha por humanos) / oferta.
      // Señales independientes compartidas con el producto (cap-formulas.ts).
      const presion = presionFrom(unsatisfied, eff);
      const cargaHumana = cargaHumanaFrom(humanSatisfied, eff);
      pressurePast.set(c.id, presion);
      return {
        capacidad: c.id,
        demandaRegistrada: total,
        demandaSatisfecha: satN,
        demandaInsatisfecha: unsatisfied,
        automatizada: autoSatisfied,
        humanaSatisfecha: humanSatisfied,
        ofertaDisponible: round2(eff),
        ofertaUtilizada: round2(humanSatisfied),
        presion: round2(presion),
        cargaHumana: round2(cargaHumana),
      };
    });
  }

  for (let cycle = 1; cycle <= cfg.cycles; cycle++) {
    currentCycle = cycle;
    // 1) expiraciÃ³n de solicitudes (R7: devuelve apuesta)
    for (const r of requests) {
      if (r.status === 'registered' && cycle > r.expiryCycle) {
        r.status = 'expired';
        const a = agents[r.agent]!;
        a.committedCu = Math.max(0, a.committedCu - r.cuCommitted);
        a.cu += r.cuCommitted;
        a.requestsUnsatisfied += 1;
      }
    }

    // 2) demanda (R1)
    const demandMult = Math.pow(1 + cfg.demandGrowth / 100, cycle - 1);
    for (const a of agents) {
      if (inactivos.has(a.id) && rng() > 0.05) continue;
      let prob = cfg.demandScale * demandMult;
      if (cfg.demandShock && cycle >= cfg.demandShock.cycle) prob *= 1 + cfg.demandShock.amount;
      if (sinCap.has(a.id)) prob *= 0.6;
      if (rng() > prob) continue;
      let capId: string;
      if (cfg.demandConcentration && rng() < capFrac[cfg.demandConcentration.capacityId]! * 1) {
        capId = cfg.demandConcentration.capacityId;
      } else {
        const pool = CAPACITY_CATALOG.map((c) => c.id);
        capId = pool[Math.floor(rng() * pool.length)]!;
      }
      const d = CAPACITY_CATALOG.find((c) => c.id === capId)!;
      if (cfg.newTechCycle && cycle >= cfg.newTechCycle) {
        // la nueva capacidad tecnolÃ³gica absorbe parte de la demanda automatizable
        void d;
      }
      const intensity = 1 + Math.floor(rng() * 3);
      const stake = Math.min(a.cu, Math.max(0, Math.round(intensity * (0.5 + rng()))));
      if (a.cu >= intensity * 0.5) {
        a.cu -= stake;
        a.committedCu += stake;
        a.requestsCreated += 1;
        requests.push({
          id: nextReqId++,
          cycle,
          expiryCycle: cycle + cfg.maxHoldCycles,
          agent: a.id,
          capacityId: capId,
          intensity,
          cuCommitted: stake,
          provider: null,
          status: 'registered',
        });
      }
    }

    // 3) nuevas solicitudes / entrada de usuarios (crecimiento masivo simple)
    // (los escenarios F manejan el crecimiento vÃ­a agents fijos; se documenta)

    // 4) oferta efectiva por capacidad + racionamiento (R2, R5)
    for (const cap of CAPACITY_CATALOG) {
      const pend = requests.filter((r) => r.capacityId === cap.id && r.status === 'registered');
      if (!pend.length) continue;
      const auto = autoOf(cap);
      const autoN = Math.min(pend.length, Math.round(pend.length * auto));
      for (let k = 0; k < autoN; k++) {
        const idx = pend[k]!;
        idx.status = 'satisfied';
        idx.provider = null; // tecnologÃ­a
      }
      const humanPend = pend.filter((r) => r.status === 'registered');
      if (!humanPend.length) continue;
      const effSupply = statsOf().find((s) => s.capacidad === cap.id)?.ofertaDisponible ?? 0;
      let capacityUnits = effSupply;
      // proveedores disponibles
      const providers = agents.filter((a) => a.offers.some((o) => o.capacityId === cap.id));
      // cuota bÃ¡sica (R5 piso)
      const basic = humanPend.filter((r) => agents[r.agent]!.nivelAcceso === 0);
      const medium = humanPend.filter((r) => agents[r.agent]!.nivelAcceso === 1);
      const advanced = humanPend.filter((r) => agents[r.agent]!.nivelAcceso === 2);
      const quota = cfg.accessRule.basicFloor;
      const basicCap = Math.min(capacityUnits * quota, basic.length);
      const orderly = (list: CapacityRequest[]) =>
        [...list].sort((a, b) => b.cuCommitted - a.cuCommitted);
      for (const r of orderly(basic).slice(0, Math.ceil(basicCap))) {
        if (capacityUnits <= 0) break;
        serve(r, capacityUnits, providers, rng);
        capacityUnits -= r.intensity;
      }
      for (const r of orderly(medium)) {
        if (capacityUnits <= 0) break;
        if (r.status !== 'registered') continue;
        serve(r, capacityUnits, providers, rng);
        capacityUnits -= r.intensity;
      }
      for (const r of orderly(advanced)) {
        if (capacityUnits <= 0) break;
        if (r.status !== 'registered') continue;
        serve(r, capacityUnits, providers, rng);
        capacityUnits -= r.intensity;
      }
      void advanced;
    }

    // 5) recursos reales: la absorciÃ³n de capacidad consume presupuesto distribuible (R8)
    for (const r of requests.filter((x) => x.status === 'satisfied' && x.provider !== null)) {
      const asker = agents[r.agent]!;
      if (asker.resourcesUsed >= distributablePerAgent[asker.id]! * recursosPorNivel[asker.nivelAcceso]) {
        // agente sin presupuesto real: la solicitud no se materializa
        r.status = 'expired';
        r.provider = null;
        const a = agents[r.agent]!;
        a.committedCu = Math.max(0, a.committedCu - r.cuCommitted);
        a.cu += r.cuCommitted;
        a.requestsUnsatisfied += 1;
        continue;
      }
      asker.resourcesUsed += r.intensity;
      asker.requestsSatisfied += 1;
      // transferencia de seÃ±al: apuesta â†’ proveedor (crÃ©dito de contribuciÃ³n, R7)
      const p = agents[r.provider];
      if (p) {
        p.cu += r.cuCommitted;
        p.committedCu += 0;
        p.contributions += r.intensity;
        p.requestsSatisfied += 1;
      }
    }
    // reset de recursos por ciclo
    for (const a of agents) a.resourcesUsed = 0;

    // 6) niveles de acceso (R6): participaciÃ³n + contribuciones, no sÃ³lo CU
    for (const a of agents) {
      if (sinCap.has(a.id) || inactivos.has(a.id)) {
        a.nivelAcceso = 0; // piso preservado
        continue;
      }
      const pct = cycle / cfg.cycles;
      if (a.contributions >= 6 && a.requestsSatisfied >= 2 && rng() < pct) a.nivelAcceso = 2;
      else if (a.requestsCreated + a.contributions >= 1 || expertos.has(a.id)) a.nivelAcceso = 1;
    }
    // expertos reciben presiÃ³n alta (R14) si su capacidad es escasa

    // 7) emisiÃ³n separada (R9): grants nuevos + participaciÃ³n con topes y tope de balance
    if (cfg.grantsEnabled && cycle % cfg.grantParticipationEvery === 0) {
      for (const a of agents) {
        if (a.participation > 0) a.cu += cfg.grantParticipationCu;
        if (cfg.cuCap > 0) a.cu = Math.min(a.cu, cfg.cuCap);
      }
    }
    if (cycle === 1 && cfg.grantsEnabled) {
      for (const a of agents) a.cu += cfg.grantNewUserCu;
    }

    // 8) snapshot y mÃ©tricas por ciclo
    const stats = statsOf();
    const cuBal = agents.map((a) => a.cu).sort((x, y) => x - y);
    const top10 = Math.ceil(agents.length / 10);
    const cumTop = cuBal.slice(-top10).reduce((s, v) => s + v, 0) / (cuBal.reduce((s, v) => s + v, 0) || 1);
    history.push({
      cycle,
      stats,
      acceso: {
        basico: agents.filter((a) => a.nivelAcceso === 0).length,
        medio: agents.filter((a) => a.nivelAcceso === 1).length,
        avanzado: agents.filter((a) => a.nivelAcceso === 2).length,
      },
      cuSupply: agents.reduce((s, a) => s + a.cu + a.committedCu, 0),
      cuCirculante: agents.reduce((s, a) => s + a.cu, 0),
      cuAccumulatedTop: round2(cumTop),
      cuGini: round2(giniValues(cuBal)),
      demandaTotal: requests.length,
      demandaSatisfecha: requests.filter((r) => r.status === 'satisfied').length,
      demandaInsatisfecha: requests.filter((r) => r.status === 'expired').length + requests.filter((r) => r.status === 'registered').length,
      pctSatisfecha: round2((requests.filter((r) => r.status === 'satisfied').length / Math.max(1, requests.length)) * 100),
      recursosUsados: agents.reduce((s, a) => s + a.requestsSatisfied, 0),
      recursosDistribuidos: round2(distributablePerAgent.reduce((s, v) => s + v, 0)),
      participants: agents.filter((a) => a.requestsCreated > 0).length,
    });
  }

  return {
    config: cfg,
    agents,
    requests,
    history,
    finalStats: statsOf(),
    seed: cfg.seed,
  };

  function serve(r: CapacityRequest, capLeft: number, providers: Agent[], rng: () => number) {
    if (r.status !== 'registered') return;
    if (capLeft < r.intensity) return;
    let provider: Agent | null = null;
    if (providers.length) {
      provider = providers[Math.floor(rng() * providers.length)]!;
    } else {
      // demanda sin proveedor humano â†’ tecnologÃ­a incompleta la cubre si puede
    }
    if (provider) {
      r.status = 'satisfied';
      r.provider = provider.id;
      provider.participation = Math.min(1, provider.participation + 0.02);
      void capLeft;
    }
  }
}

export function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
