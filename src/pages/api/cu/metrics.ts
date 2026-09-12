import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest, isModerator } from '@/src/lib/auth';
import { getCuMetrics } from '@/src/lib/cu';
import { computeSignals, getPatrimonySummary } from '@/src/lib/capacity';
import { db } from '@/src/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (!isModerator(user)) {
    return res.status(403).json({ error: 'No tienes permisos' });
  }
  const [metrics, signals, patrimonio, nivelCounts] = await Promise.all([
    getCuMetrics(),
    computeSignals(),
    getPatrimonySummary(),
    db.user.groupBy({ by: ['cuAccessLevel'], _count: true }),
  ]);
  const niveles = { basico: 0, medio: 0, avanzado: 0 } as Record<string, number>;
  for (const n of nivelCounts) niveles[n.cuAccessLevel] = n._count;
  const demanda = signals.reduce(
    (acc, s) => ({
      total: acc.total + s.demandaTotal,
      satisfecha: acc.satisfecha + s.demandaSatisfecha,
      insatisfecha: acc.insatisfecha + s.demandaInsatisfecha,
    }),
    { total: 0, satisfecha: 0, insatisfecha: 0 }
  );
  return res.status(200).json({
    ...metrics,
    señalizacion: {
      patrimonio,
      demanda,
      pctSatisfecha: demanda.total > 0 ? Math.round((demanda.satisfecha / demanda.total) * 100) : 100,
      niveles,
      capacidades: signals.map((s) => ({
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
    },
  });
}