import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorized();

  try {
    const {
      firstName, lastName, bio, headline, phone, location,
      website, linkedinUrl, githubUrl, twitterUrl, rollNumber,
      batch, cgpa, isPublic, skills, interests,
    } = await req.json();

    let completionScore = 0;
    if (firstName && lastName) completionScore += 20;
    if (bio) completionScore += 15;
    if (headline) completionScore += 10;
    if (phone) completionScore += 5;
    if (location) completionScore += 5;
    if (website || linkedinUrl || githubUrl) completionScore += 10;
    if (skills?.length > 0) completionScore += 15;
    if (interests?.length > 0) completionScore += 10;
    if (rollNumber) completionScore += 10;

    const profile = await prisma.profile.update({
      where: { userId: authUser.userId },
      data: {
        firstName, lastName, bio, headline, phone, location,
        website, linkedinUrl, githubUrl, twitterUrl, rollNumber,
        batch, cgpa: cgpa ? parseFloat(cgpa) : undefined,
        isPublic, completionScore,
      },
    });

    if (skills && Array.isArray(skills)) {
      await prisma.profileSkill.deleteMany({ where: { profileId: profile.id } });
      for (const skillData of skills) {
        const skill = await prisma.skill.upsert({
          where: { name: skillData.name },
          update: {},
          create: { name: skillData.name, category: skillData.category },
        });
        await prisma.profileSkill.create({
          data: { profileId: profile.id, skillId: skill.id, level: skillData.level },
        });
      }
    }

    if (interests && Array.isArray(interests)) {
      await prisma.interest.deleteMany({ where: { profileId: profile.id } });
      await prisma.interest.createMany({
        data: interests.map((name: string) => ({ profileId: profile.id, name })),
      });
    }

    const updatedProfile = await prisma.profile.findUnique({
      where: { userId: authUser.userId },
      include: { skills: { include: { skill: true } }, interests: true },
    });

    return Response.json({ success: true, message: 'Profile updated', data: updatedProfile });
  } catch (err) {
    console.error('Update profile error:', err);
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
