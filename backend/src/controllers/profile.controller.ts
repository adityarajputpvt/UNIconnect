import { Request, Response } from 'express';
import prisma from '../config/prisma';
import cloudinary from '../config/cloudinary';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      user: { select: { email: true, role: true, createdAt: true } },
      skills: { include: { skill: true } },
      interests: true,
    },
  });

  if (!profile) {
    sendError(res, 'Profile not found', 404);
    return;
  }

  sendSuccess(res, profile, 'Profile fetched');
};

export const getPublicPortfolio = async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;

  const profile = await prisma.profile.findUnique({
    where: { portfolioSlug: slug },
    include: {
      user: { select: { email: true, role: true } },
      skills: { include: { skill: true } },
      interests: true,
    },
  });

  if (!profile || !profile.isPublic) {
    sendError(res, 'Portfolio not found', 404);
    return;
  }

  // Get approved achievements
  const achievements = await prisma.achievement.findMany({
    where: {
      userId: profile.userId,
      status: 'APPROVED',
      isPublic: true,
    },
    include: {
      tags: { include: { tag: true } },
      skills: { include: { skill: true } },
      documents: { select: { fileUrl: true, fileType: true } },
    },
    orderBy: { issueDate: 'desc' },
  });

  sendSuccess(res, { profile, achievements }, 'Portfolio fetched');
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const {
    firstName, lastName, bio, headline, phone, location,
    website, linkedinUrl, githubUrl, twitterUrl, rollNumber,
    batch, cgpa, isPublic, skills, interests,
  } = req.body;

  // Calculate completion score
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
    where: { userId },
    data: {
      firstName,
      lastName,
      bio,
      headline,
      phone,
      location,
      website,
      linkedinUrl,
      githubUrl,
      twitterUrl,
      rollNumber,
      batch,
      cgpa: cgpa ? parseFloat(cgpa) : undefined,
      isPublic,
      completionScore,
    },
  });

  // Update skills
  if (skills && Array.isArray(skills)) {
    await prisma.profileSkill.deleteMany({ where: { profileId: profile.id } });

    for (const skillData of skills) {
      const skill = await prisma.skill.upsert({
        where: { name: skillData.name },
        update: {},
        create: { name: skillData.name, category: skillData.category },
      });

      await prisma.profileSkill.create({
        data: {
          profileId: profile.id,
          skillId: skill.id,
          level: skillData.level,
        },
      });
    }
  }

  // Update interests
  if (interests && Array.isArray(interests)) {
    await prisma.interest.deleteMany({ where: { profileId: profile.id } });
    await prisma.interest.createMany({
      data: interests.map((name: string) => ({ profileId: profile.id, name })),
    });
  }

  const updatedProfile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      skills: { include: { skill: true } },
      interests: true,
    },
  });

  sendSuccess(res, updatedProfile, 'Profile updated');
};

export const uploadAvatar = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  if (!req.file) {
    sendError(res, 'No file uploaded', 400);
    return;
  }

  const b64 = Buffer.from(req.file.buffer).toString('base64');
  const dataURI = `data:${req.file.mimetype};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataURI, {
    folder: 'uniconnect/avatars',
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  });

  await prisma.profile.update({
    where: { userId },
    data: { avatar: result.secure_url },
  });

  sendSuccess(res, { avatarUrl: result.secure_url }, 'Avatar uploaded');
};

export const uploadResume = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  if (!req.file) {
    sendError(res, 'No file uploaded', 400);
    return;
  }

  const b64 = Buffer.from(req.file.buffer).toString('base64');
  const dataURI = `data:${req.file.mimetype};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataURI, {
    folder: 'uniconnect/resumes',
    resource_type: 'raw',
  });

  await prisma.profile.update({
    where: { userId },
    data: { resumeUrl: result.secure_url },
  });

  sendSuccess(res, { resumeUrl: result.secure_url }, 'Resume uploaded');
};
