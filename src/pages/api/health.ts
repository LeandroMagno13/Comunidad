import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return res.status(200).json({
        message: 'Comunidad Capital Humano API',
        version: '0.1.0',
        features: [
          'User authentication and profiles',
          'Community Units (CU) system',
          'Gremios (guilds) management',
          'Projects for collaboration',
          'Admin dashboard',
          'Resource access system',
        ],
      });
    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}
