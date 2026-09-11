import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest, isModerator } from '@/src/lib/auth';
import { ensureCuConfig, runCuSimulation, SimParams } from '@/src/lib/cu';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (!isModerator(user)) {
    return res.status(403).json({ error: 'No tienes permisos' });
  }

  const config = await ensureCuConfig();
  const b = req.body;
  const p: SimParams = {
    users: num(b.users, 1, 100000, 100),
    initialCu: num(b.initialCu, 0, 1000000, 20),
    emittedPerCycle: num(b.emittedPerCycle, 0, 1000000, 10),
    consumedPerCycle: num(b.consumedPerCycle, 0, 1000000, 8),
    demandGrowthPerCycle: num(b.demandGrowthPerCycle, -50, 200, 0),
    shockCycle: Math.round(num(b.shockCycle, 0, 60, 0)),
    shockAmount: num(b.shockAmount, -50, 200, 0),
    userGrowthPerCycle: num(b.userGrowthPerCycle, 0, 1000000, 0),
    startObserved: num(b.startObserved, 1, 1000000, 100),
    setPoint: num(b.setPoint, 1, 1000000, 100),
    kp: num(b.kp, 0, 1000, config.kp),
    ki: num(b.ki, 0, 1000, config.ki),
    kd: num(b.kd, 0, 1000, config.kd),
    outputMin: num(b.outputMin, -1000000, 0, config.outputMin),
    outputMax: num(b.outputMax, 0, 1000000, config.outputMax),
    expansionGain: num(b.expansionGain, 0, 1000000, 0),
    contractionGain: num(b.contractionGain, 0, 1000000, 0),
    reserveShare: num(b.reserveShare, 0, 1, config.reserveShare),
    newUserShare: num(b.newUserShare, 0, 1, config.newUserShare),
    historicalShare: num(b.historicalShare, 0, 1, config.historicalShare),
    maxEmissionPerCycle: num(b.maxEmissionPerCycle, 0, 1000000000, config.maxEmissionPerCycle),
    cycles: Math.round(num(b.cycles, 1, 60, 20)),
  };

  const cycles = runCuSimulation(p);
  return res.status(200).json({ params: p, cycles });
}

function num(value: unknown, min: number, max: number, fallback: number): number {
  const v = Number(value);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(Math.max(v, min), max);
}