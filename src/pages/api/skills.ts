import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getSkills(req, res);
    case 'POST':
      return createSkill(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function getSkills(req, res) {
  try {
    const skills = await prisma.skill.findMany({
      include: {
        users: {
          include: {
            profile: true,
          },
        },
      },
    });
    return res.status(200).json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function createSkill(req, res) {
  try {
    const { name, description, category, level } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Skill name is required' });
    }

    const skill = await prisma.skill.create({
      data: {
        name,
        description,
        category,
        level,
      },
    });

    return res.status(201).json(skill);
  } catch (error) {
    console.error('Error creating skill:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
