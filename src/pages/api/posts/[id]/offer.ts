import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';
import { ensureCuAccount, transferCu } from '@/src/lib/cu';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Solicitud inválida' });
  }

  const post = await db.post.findUnique({ where: { id } });
  if (!post) {
    return res.status(404).json({ error: 'Solicitud no encontrada' });
  }
  if (post.type !== 'request') {
    return res.status(400).json({ error: 'Esta publicación no es una solicitud con CU' });
  }

  const { action } = req.body;
  const account = await ensureCuAccount(user.id);

  switch (action) {
    case 'accept':
      return accept(res, user, post);
    case 'complete':
      return complete(res, user, post, account);
    case 'cancel':
      return cancel(res, user, post);
    default:
      return res.status(400).json({ error: 'Acción inválida' });
  }
}

async function accept(res: NextApiResponse, user: any, post: any) {
  if (post.authorId === user.id) {
    return res.status(400).json({ error: 'No puedes aceptar tu propia solicitud' });
  }
  if (post.requestStatus !== 'open') {
    return res.status(400).json({
      error:
        post.requestStatus === 'on_going'
          ? 'Esta solicitud ya tiene a alguien encargándose'
          : 'Esta solicitud ya no está disponible',
    });
  }

  await db.post.update({
    where: { id: post.id },
    data: { fulfillUserId: user.id, requestStatus: 'on_going' },
  });

  await db.notification.create({
    data: {
      userId: post.authorId,
      type: 'request',
      title: 'Alguien aceptó tu solicitud',
      content: `${user.name} se ofreció a realizar tu solicitud de ${post.cuOffer} CU. Completá la actividad y confirmá la tarea para transferir las CU.`,
      link: `/community/${post.id}`,
    },
  });

  return res.status(200).json({ success: true, requestStatus: 'on_going' });
}

async function complete(res: NextApiResponse, user: any, post: any, account: any) {
  if (post.authorId !== user.id) {
    return res.status(403).json({ error: 'Solo el autor de la solicitud puede confirmar la tarea' });
  }
  if (post.requestStatus !== 'on_going' || !post.fulfillUserId) {
    return res.status(400).json({ error: 'La solicitud no tiene una tarea en curso' });
  }
  if (account.balance < post.cuOffer) {
    return res.status(400).json({
      error: `No tenés suficientes CU para transferir (necesitás ${post.cuOffer} y tenés ${account.balance}).`,
    });
  }

  await transferCu(post.authorId, post.fulfillUserId, post.cuOffer, `Pago por solicitud "${post.title || post.content.slice(0, 60)}"`, {
    refType: 'request',
    refId: post.id,
  });

  await db.post.update({
    where: { id: post.id },
    data: { requestStatus: 'completed' },
  });

  await db.notification.create({
    data: {
      userId: post.fulfillUserId,
      type: 'request',
      title: `¡Recibiste ${post.cuOffer} CU!`,
      content: 'El autor confirmó tu tarea y se transfirieron las CU. Gracias por participar.',
      link: `/community/${post.id}`,
    },
  });

  return res.status(200).json({ success: true, requestStatus: 'completed' });
}

async function cancel(res: NextApiResponse, user: any, post: any) {
  const isAuthor = post.authorId === user.id;
  const isFulfiller = post.fulfillUserId === user.id;
  if (!isAuthor && !isFulfiller) {
    return res.status(403).json({ error: 'No tienes permisos para cancelar esta solicitud' });
  }
  if (post.requestStatus !== 'open' && post.requestStatus !== 'on_going') {
    return res.status(400).json({ error: 'Esta solicitud ya terminó' });
  }

  if (isAuthor) {
    await db.post.update({
      where: { id: post.id },
      data: { requestStatus: 'cancelled', fulfillUserId: null },
    });
    return res.status(200).json({ success: true, requestStatus: 'cancelled' });
  }

  // El cumplidor se baja: vuelve a quedar abierta
  await db.post.update({
    where: { id: post.id },
    data: { requestStatus: 'open', fulfillUserId: null },
  });
  await db.notification.create({
    data: {
      userId: post.authorId,
      type: 'request',
      title: 'Se liberó tu solicitud',
      content: `${user.name} dejó de encargarse de tu solicitud. Queda disponible de nuevo en la comunidad.`,
      link: `/community/${post.id}`,
    },
  });
  return res.status(200).json({ success: true, requestStatus: 'open' });
}