import { NextApiRequest, NextApiResponse } from 'next';
import { issueCsrfToken } from '@/src/lib/csrf';

// Emite un token CSRF (double-submit cookie) para que el cliente lo envíe
// como header `x-csrf-token` en las mutaciones (POST/PUT/PATCH/DELETE).
// Paso 1 (no rompe nada): el servidor aún no bloquea sin token; el bloqueo
// se activará cuando el frontend ya lo envíe en todas las mutaciones.

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }
  const token = issueCsrfToken(res);
  return res.status(200).json({ csrfToken: token });
}
