import { Request, Response } from 'express';
import prisma from '../config/prisma';
import cloudinary from '../config/cloudinary';
import { sendSuccess, sendError, getPaginationParams } from '../utils/apiResponse';
import { createWorker } from 'tesseract.js';
import { logger } from '../utils/logger';

export const createAchievement = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const {
    title, description, category, issuingAuthority,
    issueDate, expiryDate, credentialId, credentialUrl,
    tags, skills, isPublic = true,
  } = req.body;

  const achievement = await prisma.achievement.create({
    data: {
      userId,
      title,
      description,
      category,
      issuingAuthority,
      issueDate: issueDate ? new Date(issueDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      credentialId,
      credentialUrl,
      isPublic,
      status: 'DRAFT',
    },
  });

  // Handle tags
  if (tags && Array.isArray(tags)) {
    for (const tagName of tags) {
      const tag = await prisma.tag.upsert({
        where: { name: tagName.toLowerCase() },
        update: {},
        create: { name: tagName.toLowerCase() },
      });
      await prisma.achievementTag.create({
        data: { achievementId: achievement.id, tagId: tag.id },
      });
    }
  }

  // Handle skills
  if (skills && Array.isArray(skills)) {
    for (const skillName of skills) {
      const skill = await prisma.skill.upsert({
        where: { name: skillName },
        update: {},
        create: { name: skillName },
      });
      await prisma.achievementSkill.create({
        data: { achievementId: achievement.id, skillId: skill.id },
      });
    }
  }

  const fullAchievement = await prisma.achievement.findUnique({
    where: { id: achievement.id },
    include: {
      tags: { include: { tag: true } },
      skills: { include: { skill: true } },
      documents: true,
      verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  sendSuccess(res, fullAchievement, 'Achievement created', 201);
};

export const getAchievements = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
  const { category, status, search } = req.query;

  const where: Record<string, unknown> = { userId };
  if (category) where.category = category;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
      { issuingAuthority: { contains: String(search), mode: 'insensitive' } },
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

  sendSuccess(res, achievements, 'Achievements fetched', 200, {
    page, limit, total, totalPages: Math.ceil(total / limit),
  });
};

export const getAchievementById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const achievement = await prisma.achievement.findFirst({
    where: { id, userId },
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
    sendError(res, 'Achievement not found', 404);
    return;
  }

  sendSuccess(res, achievement, 'Achievement fetched');
};

export const updateAchievement = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const existing = await prisma.achievement.findFirst({ where: { id, userId } });
  if (!existing) {
    sendError(res, 'Achievement not found', 404);
    return;
  }

  if (existing.status === 'APPROVED') {
    sendError(res, 'Cannot edit an approved achievement', 400);
    return;
  }

  const {
    title, description, category, issuingAuthority,
    issueDate, expiryDate, credentialId, credentialUrl,
    tags, skills, isPublic,
  } = req.body;

  await prisma.achievement.update({
    where: { id },
    data: {
      title,
      description,
      category,
      issuingAuthority,
      issueDate: issueDate ? new Date(issueDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      credentialId,
      credentialUrl,
      isPublic,
    },
  });

  // Update tags
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

  sendSuccess(res, updated, 'Achievement updated');
};

export const deleteAchievement = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const existing = await prisma.achievement.findFirst({ where: { id, userId } });
  if (!existing) {
    sendError(res, 'Achievement not found', 404);
    return;
  }

  await prisma.achievement.delete({ where: { id } });
  sendSuccess(res, null, 'Achievement deleted');
};

export const submitForVerification = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const achievement = await prisma.achievement.findFirst({ where: { id, userId } });
  if (!achievement) {
    sendError(res, 'Achievement not found', 404);
    return;
  }

  if (!['DRAFT', 'RESUBMISSION_REQUIRED'].includes(achievement.status)) {
    sendError(res, 'Achievement cannot be submitted in its current state', 400);
    return;
  }

  await prisma.$transaction([
    prisma.achievement.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    }),
    prisma.verification.create({
      data: {
        achievementId: id,
        status: 'SUBMITTED',
      },
    }),
  ]);

  sendSuccess(res, null, 'Achievement submitted for verification');
};

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const achievement = await prisma.achievement.findFirst({ where: { id, userId } });
  if (!achievement) {
    sendError(res, 'Achievement not found', 404);
    return;
  }

  if (!req.file) {
    sendError(res, 'No file uploaded', 400);
    return;
  }

  const b64 = Buffer.from(req.file.buffer).toString('base64');
  const dataURI = `data:${req.file.mimetype};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataURI, {
    folder: 'uniconnect/documents',
    resource_type: req.file.mimetype === 'application/pdf' ? 'raw' : 'image',
  });

  const document = await prisma.document.create({
    data: {
      achievementId: id,
      fileName: req.file.originalname,
      fileUrl: result.secure_url,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      cloudinaryId: result.public_id,
    },
  });

  sendSuccess(res, document, 'Document uploaded', 201);
};

export const processOCR = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  if (!req.file) {
    sendError(res, 'No file uploaded', 400);
    return;
  }

  // Only process images for OCR
  if (!req.file.mimetype.startsWith('image/')) {
    sendError(res, 'OCR only supports image files', 400);
    return;
  }

  try {
    const worker = await createWorker('eng');
    const { data } = await worker.recognize(req.file.buffer);
    await worker.terminate();

    const rawText = data.text;
    const confidence = data.confidence;

    // Extract metadata from OCR text using regex patterns
    const extractedData = extractCertificateData(rawText);

    // Upload to cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: 'uniconnect/certificates',
    });

    sendSuccess(res, {
      extractedData,
      confidence,
      rawText,
      fileUrl: uploadResult.secure_url,
      cloudinaryId: uploadResult.public_id,
    }, 'OCR processing complete');
  } catch (error) {
    logger.error('OCR processing failed:', error);
    sendError(res, 'OCR processing failed', 500);
  }
};

// Helper: Extract certificate data from OCR text
function extractCertificateData(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Try to find title (usually first meaningful line)
  const title = lines.find(l => l.length > 10 && l.length < 100) || '';

  // Date patterns
  const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},?\s*\d{4}|\d{4})\b/g;
  const dates = text.match(datePattern) || [];

  // Certificate ID patterns
  const certIdPattern = /(?:certificate|cert|id|no|number)[:\s#]*([A-Z0-9\-]{6,20})/gi;
  const certIdMatch = certIdPattern.exec(text);
  const certificateId = certIdMatch ? certIdMatch[1] : '';

  // Issuer - look for "issued by", "presented by", "awarded by"
  const issuerPattern = /(?:issued by|presented by|awarded by|from|by)\s+([A-Za-z\s&,\.]+?)(?:\n|$)/i;
  const issuerMatch = issuerPattern.exec(text);
  const issuer = issuerMatch ? issuerMatch[1].trim() : '';

  return {
    title: title.replace(/[^a-zA-Z0-9\s\-&]/g, '').trim(),
    issuer,
    date: dates[0] || '',
    certificateId,
  };
}
