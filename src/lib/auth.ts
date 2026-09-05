import { jwtVerify } from 'jose';

export async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'test-secret');
    const { payload } = await jwtVerify(token, secret);
    return payload as any;
  } catch (error) {
    return null;
  }
}