import { NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequest, publicUser } from '@/src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  return res.status(200).json({
    user: {
      ...publicUser(user),
      profile: user.profile,
    },
  });
}