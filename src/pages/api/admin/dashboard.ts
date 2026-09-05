import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getAdminDashboard(req, res);
    case 'PATCH':
      return updateUserStatus(req, res);
    default:
      res.setHeader('Allow', ['GET', 'PATCH']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function getAdminDashboard(req, res) {
  try {
    const { search, profession, guild, country, status } = req.query;

    // Get users with filters
    const whereClause = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { profile: { profession: { contains: search as string, mode: 'insensitive' } } },
      ];
    }
    
    if (profession) {
      whereClause.profile = { profession: { equals: profession as string, mode: 'insensitive' } };
    }
    
    if (country) {
      whereClause.profile = { ...whereClause.profile, country: { equals: country as string, mode: 'insensitive' } };
    }
    
    if (status) {
      whereClause.profile = { ...whereClause.profile, status: { equals: status as string } };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        profile: true,
        skills: true,
        categories: true,
        guildMemberships: {
          include: {
            guild: true,
          },
        },
        contributions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get statistics
    const totalUsers = await prisma.user.count();
    const newUsersThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    });

    const professionCounts = await prisma.profile.groupBy({
      by: ['profession'],
      _count: true,
    });

    const statusCounts = await prisma.profile.groupBy({
      by: ['status'],
      _count: true,
    });

    const guilds = await prisma.guild.findMany({
      include: {
        members: true,
        projects: true,
      },
    });

    const categories = await prisma.category.findMany({
      include: {
        users: true,
      },
    });

    // Count potential investors, lawyers, economists, programmers
    const potentialInvestors = await prisma.user.count({
      where: {
        profile: {
          profession: {
            contains: 'inversor',
            mode: 'insensitive',
          },
        },
      },
    });

    const lawyers = await prisma.user.count({
      where: {
        profile: {
          profession: {
            contains: 'abogad',
            mode: 'insensitive',
          },
        },
      },
    });

    const economists = await prisma.user.count({
      where: {
        profile: {
          profession: {
            contains: 'econom',
            mode: 'insensitive',
          },
        },
      },
    });

    const programmers = await prisma.user.count({
      where: {
        profile: {
          profession: {
            contains: 'program',
            mode: 'insensitive',
          },
        },
      },
    });

    return res.status(200).json({
      users,
      stats: {
        totalUsers,
        newUsersThisMonth,
        professionCounts,
        statusCounts,
        guilds: guilds.length,
        categories: categories.length,
        potentialInvestors,
        lawyers,
        economists,
        programmers,
      },
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateUserStatus(req, res) {
  try {
    const { userId, status, note } = req.body;

    if (!userId || !status) {
      return res.status(400).json({ error: 'Missing userId or status' });
    }

    const validStatuses = ['registered', 'reviewing', 'approved', 'active'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          update: { status },
        },
      },
      include: { profile: true },
    });

    // Add admin note if provided
    if (note) {
      await prisma.adminNote.create({
        data: {
          userId,
          content: note,
        },
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}