import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const profile = await prisma.profile.findUnique({
    where: { portfolioSlug: slug },
    include: {
      user: { select: { email: true, role: true } },
      skills: { include: { skill: true } },
      interests: true,
    },
  });

  if (!profile || !profile.isPublic) {
    return Response.json({ success: false, message: 'Portfolio not found' }, { status: 404 });
  }

  const achievements = await prisma.achievement.findMany({
    where: { userId: profile.userId, status: 'APPROVED', isPublic: true },
    include: {
      tags: { include: { tag: true } },
      skills: { include: { skill: true } },
      documents: { select: { fileUrl: true, fileType: true } },
    },
    orderBy: { issueDate: 'desc' },
  });

  return Response.json({ success: true, message: 'Portfolio fetched', data: { profile, achievements } });
}
