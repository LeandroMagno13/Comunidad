import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return listConversations(req, res, user.id);
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

  const result = conversations.map((c: any) => {
    const other = c.participants.find((p: any) => p.userId !== userId)?.user;
    const lastMessage = c.messages[0];
    return {
      id: c.id,
      otherUser: other ? { id: other.id, name: other.name, avatarUrl: other.avatarUrl } : null,
      lastMessage: lastMessage ? { content: lastMessage.content, createdAt: lastMessage.createdAt, senderId: lastMessage.senderId } : null,
      updatedAt: c.updatedAt,
    };
  });

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