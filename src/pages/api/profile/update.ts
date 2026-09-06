import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/src/lib/db';
import { getUserFromRequest } from '@/src/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(405).end('Method Not Allowed');
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const {
    name,
    profession,
    country,
    bio,
    expertise,
    interests,
    availability,
    linkedinUrl,
    githubUrl,
    websiteUrl,
  } = req.body;

  const updateProfile = db.profile.upsert({
    where: { userId: user.id },
    update: {
      ...(profession !== undefined ? { profession: profession || null } : {}),
      ...(country !== undefined ? { country: country || null } : {}),
      ...(bio !== undefined ? { bio: bio || null } : {}),
      ...(expertise !== undefined ? { expertise: Array.isArray(expertise) ? expertise.slice(0, 30) : [] } : {}),
      ...(interests !== undefined ? { interests: Array.isArray(interests) ? interests.slice(0, 30) : [] } : {}),
      ...(availability !== undefined ? { availability: availability || null } : {}),
      ...(linkedinUrl !== undefined ? { linkedinUrl: linkedinUrl || null } : {}),
      ...(githubUrl !== undefined ? { githubUrl: githubUrl || null } : {}),
      ...(websiteUrl !== undefined ? { websiteUrl: websiteUrl || null } : {}),
    },
    create: {
      userId: user.id,
      profession,
      country,
      bio,
      expertise: Array.isArray(expertise) ? expertise : [],
      interests: Array.isArray(interests) ? interests : [],
      availability,
      linkedinUrl,
      githubUrl,
      websiteUrl,
    },
  });

  const updateUser = name
    ? db.user.update({ where: { id: user.id }, data: { name: String(name).trim().slice(0, 100) } })
    : Promise.resolve();

  await Promise.all([updateProfile, updateUser]);

  return res.status(200).json({ success: true });
}