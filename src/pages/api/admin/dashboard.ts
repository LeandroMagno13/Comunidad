import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Solo el Super Admin puede gestionar la comunidad' });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return getStats(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).end('Method Not Allowed');
  }
}

async function getStats(_req: NextApiRequest, res: NextApiResponse) {
  const [
    userCount,
    activeUsers,
    guildCount,
    postCount,
    commentCount,
    pendingMemberships,
    pendingReports,
    conversationCount,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: 'active' } }),
    db.guild.count(),
    db.post.count({ where: { status: 'visible' } }),
    db.comment.count({ where: { status: 'visible' } }),
    db.guildMembership.count({ where: { status: 'pending' } }),
    db.report.count({ where: { status: 'pending' } }),
    db.conversation.count(),
  ]);

  const recentUsers = await db.user.findMany({
    include: { profile: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const recentPosts = await db.post.findMany({
    include: { author: true, _count: { select: { comments: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return res.status(200).json({
    stats: {
      userCount,
      activeUsers,
      guildCount,
      postCount,
      commentCount,
      pendingMemberships,
      pendingReports,
      conversationCount,
    },
    recentUsers,
    recentPosts,
  });
}