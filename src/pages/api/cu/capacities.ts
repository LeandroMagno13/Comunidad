import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest } from '@/src/lib/auth';
import { computeSignals } from '@/src/lib/capacity';
import { db } from '@/src/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  if (req.method === 'GET') {
    const signals = await computeSignals();
    return res.status(200).json({
      habilidades: signals.map((s) => ({
        capacityId: s.capacityId,
        slug: s.slug,
        name: s.name,
        category: s.category,
        automatizacion: s.automatizacion,
        demandaTotal: s.demandaTotal,
        demandaSatisfecha: s.demandaSatisfecha,
        demandaInsatisfecha: s.demandaInsatisfecha,
        pctSatisfecha: s.pctSatisfecha,
        ofertaDeclarada: s.ofertaDeclarada,
        ofertaEfectiva: s.ofertaEfectiva,
        presion: s.presion,
        cargaHumana: s.cargaHumana,
      })),
    });
  }

  if (req.method === 'POST') {
    const { capacitySlug, disponibilidad, calidad } = req.body || {};
    if (!capacitySlug) return res.status(400).json({ error: 'Falta capacitySlug' });
    const capacity = await db.capacity.findUnique({ where: { slug: String(capacitySlug) } });
    if (!capacity || !capacity.active) return res.status(400).json({ error: 'Capacidad inexistente o inactiva' });
    const disp = Math.min(1, Math.max(0, Number(disponibilidad) || 0.5));
    const cal = Math.min(1, Math.max(0, Number(calidad) || 0.5));
    await db.userCapacity.upsert({
      where: { userId_capacityId: { userId: user.id, capacityId: capacity.id } },
      update: { disponibilidad: disp, calidad: cal },
      create: { userId: user.id, capacityId: capacity.id, disponibilidad: disp, calidad: cal },
    });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end('Method Not Allowed');
}