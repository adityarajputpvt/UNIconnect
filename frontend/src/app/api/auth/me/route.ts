import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    include: {
      profile: {
        include: {
          skills: { include: { skill: true } },
          interests: true,
        },
      },
      department: true,
    },
  });

  if (!user) return Response.json({ success: false, message: 'User not found' }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, refreshToken, resetPasswordToken, emailVerifyToken, ...safeUser } = user;

  return Response.json({ success: true, message: 'User fetched', data: safeUser });
}
