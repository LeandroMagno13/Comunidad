import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getGuilds(req, res);
    case 'POST':
      return createGuild(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function getGuilds(req, res) {
  try {
    const guilds = await prisma.guild.findMany({
      include: {
        members: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        projects: true,
        discussions: true,
      },
    });
    return res.status(200).json(guilds);
  } catch (error) {
    console.error('Error fetching guilds:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function createGuild(req, res) {
  try {
    const { name, description, purpose } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    const guild = await prisma.guild.create({
      data: {
        name,
        description,
        purpose,
      },
    });

    return res.status(201).json(guild);
  } catch (error) {
    console.error('Error creating guild:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
