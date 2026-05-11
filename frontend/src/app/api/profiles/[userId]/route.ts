import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorized();

  const { userId } = await params;

  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      user: { select: { email: true, role: true, createdAt: true } },
      skills: { include: { skill: true } },
      interests: true,
    },
  });

  if (!profile) {
    return Response.json({ success: false, message: 'Profile not found' }, { status: 404 });
  }

  return Response.json({ success: true, message: 'Profile fetched', data: profile });
}
