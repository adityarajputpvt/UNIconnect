import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorized, getPaginationParams } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorized();

  const { searchParams } = new URL(req.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const where: Record<string, unknown> = { userId: authUser.userId };
  if (category) where.category = category;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { issuingAuthority: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [achievements, total] = await Promise.all([
    prisma.achievement.findMany({
      where,
      include: {
        tags: { include: { tag: true } },
        skills: { include: { skill: true } },
        documents: { select: { id: true, fileUrl: true, fileType: true } },
        verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.achievement.count({ where }),
  ]);

  return Response.json({
    success: true,
    message: 'Achievements fetched',
    data: achievements,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorized();

  try {
    const {
      title, description, category, issuingAuthority,
      issueDate, expiryDate, credentialId, credentialUrl,
      tags, skills, isPublic = true,
    } = await req.json();

    const achievement = await prisma.achievement.create({
      data: {
        userId: authUser.userId,
        title, description, category, issuingAuthority,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        credentialId, credentialUrl, isPublic, status: 'DRAFT',
      },
    });

    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName.toLowerCase() },
          update: {},
          create: { name: tagName.toLowerCase() },
        });
        await prisma.achievementTag.create({ data: { achievementId: achievement.id, tagId: tag.id } });
      }
    }

    if (skills && Array.isArray(skills)) {
      for (const skillName of skills) {
        const skill = await prisma.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName },
        });
        await prisma.achievementSkill.create({ data: { achievementId: achievement.id, skillId: skill.id } });
      }
    }

    const full = await prisma.achievement.findUnique({
      where: { id: achievement.id },
      include: {
        tags: { include: { tag: true } },
        skills: { include: { skill: true } },
        documents: true,
        verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    return Response.json({ success: true, message: 'Achievement created', data: full }, { status: 201 });
  } catch (err) {
    console.error('Create achievement error:', err);
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
