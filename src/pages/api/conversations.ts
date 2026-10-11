import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';
import { getReaderUserId } from '@/src/lib/agent-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // Solo el GET admite token de agente (READ_MESSAGES). POST sigue exigiendo
  // sesión: el bot personal es de solo lectura.
  if (method === 'GET') {
    const reader = await getReaderUserId(req, {
      permission: 'READ_MESSAGES',
      action: 'agent.conversations.read',
      endpoint: '/api/conversations',
    });
    if (!reader) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    return listConversations(req, res, reader.userId);
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  switch (method) {
    case 'POST':
      return startConversation(req, res, user.id);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end('Method Not Allowed');
  }
}

async function listConversations(_req: NextApiRequest, res: NextApiResponse, userId: string) {
  const conversations = await db.conversation.findMany({
    where: {
      participants: { some: { userId } },
    },
    include: {
      participants: {
        include: { user: { include: { profile: true } } },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const result = await Promise.all(
    conversations.map(async (c: any) => {
      const other = c.participants.find((p: any) => p.userId !== userId)?.user;
      const lastMessage = c.messages[0];
      // No leídos del otro participante (aditivo: no cambia la forma existente).
      const unread = await db.message.count({
        where: { conversationId: c.id, readAt: null, NOT: { senderId: userId } },
      });
      return {
        id: c.id,
        otherUser: other ? { id: other.id, name: other.name, avatarUrl: other.avatarUrl } : null,
        lastMessage: lastMessage ? { content: lastMessage.content, createdAt: lastMessage.createdAt, senderId: lastMessage.senderId } : null,
        unread,
        updatedAt: c.updatedAt,
      };
    })
  );

  return res.status(200).json(result);
}

async function startConversation(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { recipientId } = req.body;

  if (!recipientId || recipientId === userId) {
    return res.status(400).json({ error: 'Destinatario inválido' });
  }

  const recipient = await db.user.findUnique({ where: { id: recipientId } });
  if (!recipient) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const existing = await db.conversation.findFirst({
    where: {
      participants: { some: { userId } },
      AND: {
        participants: { some: { userId: recipientId } },
      },
    },
    include: {
      participants: true,
    },
  });

  if (existing) {
    return res.status(200).json({ id: existing.id });
  }

  const conversation = await db.conversation.create({
    data: {
      participants: {
        create: [{ userId }, { userId: recipientId }],
      },
    },
    include: { participants: true },
  });

  return res.status(201).json({ id: conversation.id });
}