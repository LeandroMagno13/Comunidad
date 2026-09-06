import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Conversación inválida' });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return getConversation(req, res, id, user.id);
    case 'POST':
      return sendMessage(req, res, id, user);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end('Method Not Allowed');
  }
}

async function getConversation(_req: NextApiRequest, res: NextApiResponse, conversationId: string, userId: string) {
  const conversation = await db.conversation.findFirst({
    where: {
      id: conversationId,
      participants: { some: { userId } },
    },
    include: {
      participants: {
        include: { user: { include: { profile: true } } },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 200,
      },
    },
  });

  if (!conversation) {
    return res.status(404).json({ error: 'Conversación no encontrada' });
  }

  const other = conversation.participants.find((p: any) => p.userId !== userId)?.user;
  const myParticipant = conversation.participants.find((p: any) => p.userId === userId);

  if (!myParticipant) {
    return res.status(403).json({ error: 'No tienes acceso a esta conversación' });
  }

  // Mark messages as read
  await db.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
  await db.conversationParticipant.update({
    where: { id: myParticipant.id },
    data: { lastReadAt: new Date() },
  });

  return res.status(200).json({
    id: conversation.id,
    otherUser: other ? { id: other.id, name: other.name, avatarUrl: other.avatarUrl } : null,
    messages: conversation.messages.map((m: any) => ({
      id: m.id,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt,
      readAt: m.readAt,
    })),
  });
}

async function sendMessage(req: NextApiRequest, res: NextApiResponse, conversationId: string, user: any) {
  const { content } = req.body;

  if (!content || !String(content).trim()) {
    return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
  }

  const conversation = await db.conversation.findFirst({
    where: {
      id: conversationId,
      participants: { some: { userId: user.id } },
    },
    include: { participants: true },
  });

  if (!conversation) {
    return res.status(404).json({ error: 'Conversación no encontrada' });
  }

  const message = await db.message.create({
    data: {
      conversationId,
      senderId: user.id,
      content: String(content).trim().slice(0, 5000),
    },
  });

  await db.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  // Notify the other participant
  const other = conversation.participants.find((p: any) => p.userId !== user.id);
  if (other) {
    await db.notification.create({
      data: {
        userId: other.userId,
        type: 'message',
        title: 'Nuevo mensaje',
        content: `${user.name} te envió un mensaje`,
        link: `/messages/${conversationId}`,
      },
    });
  }

  return res.status(201).json(message);
}