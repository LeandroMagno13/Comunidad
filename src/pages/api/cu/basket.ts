import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest, isAdmin, isModerator } from '@/src/lib/auth';
import { ensureCuBasket } from '@/src/lib/cu';

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
      return getBasket(res);
    case 'PATCH':
      if (!isAdmin(user)) {
        return res.status(403).json({ error: 'No tienes permisos' });
      }
      return updateBasket(req, res);
    default:
      res.setHeader('Allow', ['GET', 'PATCH']);
      return res.status(405).end('Method Not Allowed');
  }
}

async function getBasket(res: NextApiResponse) {
  const basket = await ensureCuBasket();
  return res.status(200).json(basket);
}

async function updateBasket(req: NextApiRequest, res: NextApiResponse) {
  const basket = await ensureCuBasket();
  const body = req.body;
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (!String(body.name).trim()) {
      return res.status(400).json({ error: 'El nombre no puede estar vacío' });
    }
    data.name = String(body.name).trim().slice(0, 200);
  }
  if (body.description !== undefined) data.description = String(body.description).slice(0, 500) || null;
  if (body.targetCu !== undefined) {
    const v = Number(body.targetCu);
    if (!Number.isInteger(v) || v < 1) {
      return res.status(400).json({ error: 'Set point inválido' });
    }
    data.targetCu = v;
  }
  if (body.observedCu !== undefined) {
    const v = Number(body.observedCu);
    if (!Number.isInteger(v) || v < 1) {
      return res.status(400).json({ error: 'Valor observado inválido' });
    }
    data.observedCu = v;
  }
  if (body.observedMethod !== undefined) {
    const m = String(body.observedMethod);
    if (!['manual', 'auto'].includes(m)) {
      return res.status(400).json({ error: 'Metodología de observación inválida (manual | auto)' });
    }
    data.observedMethod = m;
  }
  if (body.periodDays !== undefined) {
    const v = Number(body.periodDays);
    if (!Number.isInteger(v) || v < 1 || v > 3650) {
      return res.status(400).json({ error: 'Período inválido' });
    }
    data.periodDays = v;
  }

  let items: { name: string; weight: number; description?: string }[] | null = null;
  if (Array.isArray(body.items)) {
    if (body.items.length === 0 || body.items.length > 50) {
      return res.status(400).json({ error: 'La canasta debe tener entre 1 y 50 ítems' });
    }
    const totalWeight = body.items.reduce((s: number, it: any) => s + Number(it.weight), 0);
    if (!(totalWeight > 0)) {
      return res.status(400).json({ error: 'Los pesos de la canasta deben sumar más que cero' });
    }
    const parsedItems = body.items.map((it: any) => ({
      name: String(it.name || '').trim().slice(0, 200),
      weight: Number(it.weight),
      description: it.description ? String(it.description).slice(0, 300) : undefined,
    }));
    if (parsedItems.some((it: { name: string; weight: number }) => !it.name || !Number.isFinite(it.weight) || it.weight <= 0)) {
      return res.status(400).json({ error: 'Ítem de canasta inválido' });
    }
    items = parsedItems;
  }

  const updated = await db.cuBasket.update({
    where: { id: basket.id },
    data: {
      ...data,
      ...(items
        ? {
            items: {
              deleteMany: {},
              create: items,
            },
          }
        : {}),
    },
    include: { items: true },
  });
  return res.status(200).json(updated);
}