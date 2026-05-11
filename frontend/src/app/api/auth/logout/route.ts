import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  await prisma.user.update({ where: { id: user.userId }, data: { refreshToken: null } });

  return Response.json({ success: true, message: 'Logged out successfully', data: null });
}
