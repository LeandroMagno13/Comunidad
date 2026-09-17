import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';
import { ensureCuAccount, ensureCuConfig } from '@/src/lib/cu';
import { urgencyBudgetFor, urgencyNextRenewalAt } from '@/src/lib/cap-formulas';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return getAccount(res, user);
    case 'PATCH':
      return updateEstimate(req, res, user);
    default:
      res.setHeader('Allow', ['GET', 'PATCH']);
      return res.status(405).end('Method Not Allowed');
  }
}

async function getAccount(res: NextApiResponse, user: any) {
  const account = await ensureCuAccount(user.id);
  const transactions = await db.cuTransaction.findMany({
    where: { OR: [{ fromUserId: user.id }, { toUserId: user.id }] },
    include: {
      fromUser: { select: { id: true, name: true } },
      toUser: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const config = await ensureCuConfig();
  const periodDays = config.urgencyBudgetPeriodDays ?? 7;
  const base = config.urgencyBudgetBase ?? 3;
  const now = new Date();
  const remaining = urgencyBudgetFor(
    base,
    { period: user.urgencyBudgetPeriod, remaining: user.urgencyBudgetRemaining },
    now,
    periodDays
  );
  const urgency = {
    base,
    remaining,
    maxLevel: config.urgencyBudgetMaxLevel ?? 3,
    periodDays,
    renewsAt: urgencyNextRenewalAt(now, periodDays).toISOString(),
  };
  return res.status(200).json({ account, transactions, urgency });
}

async function updateEstimate(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { liberationEstimate } = req.body;
  const value =
    liberationEstimate == null || liberationEstimate === ''
      ? null
      : Number(liberationEstimate);
  if (value !== null && (!Number.isInteger(value) || value < 0 || value > 100000000)) {
    return res.status(400).json({ error: 'Estimación inválida' });
  }
  const account = await db.cuAccount.update({
    where: { userId: user.id },
    data: { liberationEstimate: value },
  });
  return res.status(200).json({ account });
}