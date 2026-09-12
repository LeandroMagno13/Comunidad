import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest, isAdmin, isModerator } from '@/src/lib/auth';
import { CU_CONFIG_ID, ensureCuConfig, refreshCuSensor } from '@/src/lib/cu';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      if (!isModerator(user)) {
        return res.status(403).json({ error: 'No tienes permisos' });
      }
      return getConfig(res);
    case 'PATCH':
      if (!isAdmin(user)) {
        return res.status(403).json({ error: 'No tienes permisos' });
      }
      return updateConfig(req, res);
    default:
      res.setHeader('Allow', ['GET', 'PATCH']);
      return res.status(405).end('Method Not Allowed');
  }
}

async function getConfig(res: NextApiResponse) {
  const config = await ensureCuConfig();
  return res.status(200).json(config);
}

async function updateConfig(req: NextApiRequest, res: NextApiResponse) {
  const body = req.body;
  const patch: Record<string, unknown> = {};

  const floats: Array<[string, number]> = [
    ['kp', 0.0001],
    ['ki', 0],
    ['kd', 0],
    ['expansionGain', 0],
    ['contractionGain', 0],
    ['reserveShare', 0],
    ['newUserShare', 0],
    ['historicalShare', 0],
    ['newUserSensitivity', 0],
    ['sensorFlowGain', 0],
    ['sensorAccessGain', 0],
  ];
  for (const [key, min] of floats) {
    if (body[key] !== undefined) {
      const v = Number(body[key]);
      if (!Number.isFinite(v) || v < min) {
        return res.status(400).json({ error: `Valor inválido para ${key}` });
      }
      patch[key] = v;
      if (key === 'outputMin' || key === 'outputMax' || key === 'reserveShare' || key === 'newUserShare' || key === 'historicalShare') {
        if (key !== 'outputMin' && key !== 'outputMax' && v > 1) {
          return res.status(400).json({ error: `Las proporciones deben estar entre 0 y 1 (${key})` });
        }
      }
    }
  }
  if (body.accessTarget !== undefined) {
    const v = Number(body.accessTarget);
    if (!Number.isFinite(v) || v < 0 || v > 1) {
      return res.status(400).json({ error: 'accessTarget debe estar entre 0 y 1' });
    }
    patch.accessTarget = v;
  }
  const floatsBounded: Array<[string, number, number]> = [
    ['outputMin', -1000000, 1000000],
    ['outputMax', -1000000, 1000000],
  ];
  for (const [key, min, max] of floatsBounded) {
    if (body[key] !== undefined) {
      const v = Number(body[key]);
      if (!Number.isFinite(v) || v < min || v > max) {
        return res.status(400).json({ error: `Valor inválido para ${key}` });
      }
      patch[key] = v;
    }
  }
  const ints: Array<[string, number, number]> = [
    ['periodDays', 1, 3650],
    ['milestoneCu', 1, 1000000000],
    ['newUserGrantCu', 0, 1000000000],
    ['maxEmissionPerCycle', 0, 1000000000],
    ['maxBurnPerCycle', 0, 1000000000],
    ['adjustmentCap', 0, 1000000000],
  ];
  for (const [key, min, max] of ints) {
    if (body[key] !== undefined) {
      const v = Number(body[key]);
      if (!Number.isInteger(v) || v < min || v > max) {
        return res.status(400).json({ error: `Valor inválido para ${key}` });
      }
      patch[key] = v;
    }
  }
  if (body.enabled !== undefined) patch.enabled = Boolean(body.enabled);
  if (body.newUserGrantEnabled !== undefined) patch.newUserGrantEnabled = Boolean(body.newUserGrantEnabled);
  if (body.adjustmentEnabled !== undefined) patch.adjustmentEnabled = Boolean(body.adjustmentEnabled);
  if (body.reachableSetPoint !== undefined) patch.reachableSetPoint = Boolean(body.reachableSetPoint);
  if (body.adjustmentMode !== undefined) {
    const m = String(body.adjustmentMode);
    if (!['none', 'flat', 'proportional', 'manual'].includes(m)) {
      return res.status(400).json({ error: 'Método de ajuste inválido' });
    }
    patch.adjustmentMode = m;
  }

  if (patch.outputMax != null && patch.outputMin != null && Number(patch.outputMax) <= Number(patch.outputMin)) {
    return res.status(400).json({ error: 'outputMax debe ser mayor que outputMin' });
  }
  const changedShares = (['reserveShare', 'newUserShare', 'historicalShare'] as const).filter(
    (k) => patch[k] !== undefined
  );
  if (changedShares.length) {
    const sum = changedShares.reduce((s, k) => s + Number(patch[k]), 0);
    if (sum < 0 || sum > 1.0001) {
      return res.status(400).json({ error: 'Las proporciones de la política deben sumar 1 (o menos)' });
    }
  }

  const config = await db.cuConfig.update({ where: { id: CU_CONFIG_ID }, data: patch });
  const sensed = await refreshCuSensor();
  return res.status(200).json({ config, sensorRefresh: sensed });
}