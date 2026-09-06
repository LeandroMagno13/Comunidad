import { NextApiRequest, NextApiResponse } from 'next';
import { TOKEN_COOKIE } from '@/src/lib/auth';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader(
    'Set-Cookie',
    `${TOKEN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return res.status(200).json({ success: true });
}