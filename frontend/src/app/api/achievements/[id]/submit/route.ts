import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorized();

  const { id } = await params;

  const achievement = await prisma.achievement.findFirst({ where: { id, userId: authUser.userId } });
  if (!achievement) return Response.json({ success: false, message: 'Achievement not found' }, { status: 404 });

  if (!['DRAFT', 'RESUBMISSION_REQUIRED'].includes(achievement.status)) {
    return Response.json({ success: false, message: 'Achievement cannot be submitted in its current state' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.achievement.update({ where: { id }, data: { status: 'SUBMITTED' } }),
    prisma.verification.create({ data: { achievementId: id, status: 'SUBMITTED' } }),
  ]);

  return Response.json({ success: true, message: 'Achievement submitted for verification', data: null });
}
