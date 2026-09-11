import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest, isAdmin } from '@/src/lib/auth';
import { applyHistoricalAdjustment } from '@/src/lib/cu';

// POST /api/cu/adjust — solo admin
// Ajuste histórico AUDITABLE de un saldo de CU. Deshabilitado por defecto
// (config.adjustmentEnabled). Todo ajuste queda registrado en CuTransaction.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }
  const actor = await getUserFromRequest(req);
  if (!actor) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (!isAdmin(actor)) {
    return res.status(403).json({ error: 'No tienes permisos' });
  }

  const { userId, amount, reason } = req.body ?? {};
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId requerido' });
  }
  const delta = Number(amount);
  if (!Number.isInteger(delta) || delta === 0) {
    return res.status(400).json({ error: 'amount debe ser un entero distinto de cero' });
  }
  const text = String(reason || '').trim();
  if (!text || text.length > 300) {
    return res.status(400).json({ error: 'Se requiere un motivo de hasta 300 caracteres' });
  }

  try {
    const account = await applyHistoricalAdjustment(userId, delta, text, actor.id);
    return res.status(200).json({ ok: true, balance: account.balance, delta });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al aplicar el ajuste';
    return res.status(400).json({ error: message });
  }
}