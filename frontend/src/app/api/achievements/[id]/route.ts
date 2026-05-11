import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorized();

  const { id } = await params;

  const achievement = await prisma.achievement.findFirst({
    where: { id, userId: authUser.userId },
    include: {
      tags: { include: { tag: true } },
      skills: { include: { skill: true } },
      documents: true,
      verifications: {
        include: { reviewer: { include: { profile: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!achievement) {
    return Response.json({ success: false, message: 'Achievement not found' }, { status: 404 });
  }

  return Response.json({ success: true, message: 'Achievement fetched', data: achievement });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorized();

  const { id } = await params;

  const existing = await prisma.achievement.findFirst({ where: { id, userId: authUser.userId } });
  if (!existing) return Response.json({ success: false, message: 'Achievement not found' }, { status: 404 });
  if (existing.status === 'APPROVED') {
    return Response.json({ success: false, message: 'Cannot edit an approved achievement' }, { status: 400 });
  }

  try {
    const {
      title, description, category, issuingAuthority,
      issueDate, expiryDate, credentialId, credentialUrl, tags, isPublic,
    } = await req.json();

    await prisma.achievement.update({
      where: { id },
      data: {
        title, description, category, issuingAuthority,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        credentialId, credentialUrl, isPublic,
      },
    });

    if (tags) {
      await prisma.achievementTag.deleteMany({ where: { achievementId: id } });
      for (const tagName of tags) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName.toLowerCase() },
          update: {},
          create: { name: tagName.toLowerCase() },
        });
        await prisma.achievementTag.create({ data: { achievementId: id, tagId: tag.id } });
      }
    }

    const updated = await prisma.achievement.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        skills: { include: { skill: true } },
        documents: true,
      },
    });

    return Response.json({ success: true, message: 'Achievement updated', data: updated });
  } catch (err) {
    console.error('Update achievement error:', err);
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorized();

  const { id } = await params;

  const existing = await prisma.achievement.findFirst({ where: { id, userId: authUser.userId } });
  if (!existing) return Response.json({ success: false, message: 'Achievement not found' }, { status: 404 });

  await prisma.achievement.delete({ where: { id } });

  return Response.json({ success: true, message: 'Achievement deleted', data: null });
}
