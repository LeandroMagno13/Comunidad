import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest, isAdmin } from '@/src/lib/auth';
import { MANUAL_UPDATED_AT, MANUAL_VERSION } from '@/src/lib/manual';

// Avisa a TODOS los usuarios sobre la versión vigente del manual de uso.
// No reemplaza el contenido del manual: solo crea la notificación que el
// requerimiento exige cuando el manual cambia de versión.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (!isAdmin(user)) {
    return res.status(403).json({ error: 'Solo administradores pueden avisar cambios del manual' });
  }

  const { title, content, link } = req.body || {};
  const finalTitle =
    typeof title === 'string' && title.trim() ? title.trim() : `El manual de uso se actualizó (v${MANUAL_VERSION})`;
  const finalContent =
    typeof content === 'string' && content.trim()
      ? content.trim()
      : `Hay una nueva versión del manual de uso (v${MANUAL_VERSION}, ${MANUAL_UPDATED_AT}). Consultala para saber qué se puede y qué no se puede hacer en esta versión.`;
  const finalLink = typeof link === 'string' && link.trim() ? link.trim() : '/manual';

  const users = await db.user.findMany({ select: { id: true } });
  if (users.length === 0) {
    return res.status(200).json({ success: true, notified: 0, manualVersion: MANUAL_VERSION });
  }

  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: 'system',
      title: finalTitle,
      content: finalContent,
      link: finalLink,
    })),
  });

  return res.status(200).json({ success: true, notified: users.length, manualVersion: MANUAL_VERSION });
}