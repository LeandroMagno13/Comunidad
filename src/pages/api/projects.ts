import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getProjects(req, res);
    case 'POST':
      return createProject(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function getProjects(req, res) {
  try {
    const projects = await prisma.project.findMany({
      include: {
        contributors: {
          include: {
            profile: true,
          },
        },
        responsibilities: true,
      },
    });
    return res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function createProject(req, res) {
  try {
    const { title, description, objectives, status, guildIds } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        objectives,
        status,
        guildIds: guildIds || [],
        contributors: {
          connect: [],
        },
      },
      include: {
        contributors: true,
      },
    });

    return res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
