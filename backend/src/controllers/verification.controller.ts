import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess, sendError, getPaginationParams } from '../utils/apiResponse';
import { sendEmail, emailTemplates } from '../utils/email';
import { logger } from '../utils/logger';

export const getPendingVerifications = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
  const { category, department } = req.query;

  const where: Record<string, unknown> = {
    status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
  };

  if (category) where.category = category;
  if (department) where.departmentId = department;

  const [achievements, total] = await Promise.all([
    prisma.achievement.findMany({
      where,
      include: {
        user: {
          include: {
            profile: { select: { firstName: true, lastName: true, avatar: true, rollNumber: true } },
          },
        },
        documents: true,
        tags: { include: { tag: true } },
        verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'asc' },
      skip,
      take: limit,
    }),
    prisma.achievement.count({ where }),
  ]);

  sendSuccess(res, achievements, 'Pending verifications fetched', 200, {
    page, limit, total, totalPages: Math.ceil(total / limit),
  });
};

export const reviewAchievement = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const reviewerId = req.user!.userId;
  const { status, remarks } = req.body;

  const validStatuses = ['APPROVED', 'REJECTED', 'RESUBMISSION_REQUIRED', 'UNDER_REVIEW'];
  if (!validStatuses.includes(status)) {
    sendError(res, 'Invalid status', 400);
    return;
  }

  const achievement = await prisma.achievement.findUnique({
    where: { id },
    include: {
      user: {
        include: { profile: true },
      },
    },
  });

  if (!achievement) {
    sendError(res, 'Achievement not found', 404);
    return;
  }

  // Update achievement status and create verification record
  await prisma.$transaction([
    prisma.achievement.update({
      where: { id },
      data: { status },
    }),
    prisma.verification.create({
      data: {
        achievementId: id,
        reviewerId,
        status,
        remarks,
        reviewedAt: new Date(),
      },
    }),
    // Create notification for student
    prisma.notification.create({
      data: {
        userId: achievement.userId,
        type: status === 'APPROVED' ? 'ACHIEVEMENT_APPROVED' : 'ACHIEVEMENT_REJECTED',
        title: `Achievement ${status === 'APPROVED' ? 'Approved' : 'Update'}`,
        message: `Your achievement "${achievement.title}" has been ${status.toLowerCase().replace('_', ' ')}.`,
        data: { achievementId: id, status, remarks },
      },
    }),
    // Audit log
    prisma.auditLog.create({
      data: {
        userId: reviewerId,
        action: 'REVIEW_ACHIEVEMENT',
        entity: 'Achievement',
        entityId: id,
        newData: { status, remarks },
      },
    }),
  ]);

  // Send email notification
  try {
    const name = achievement.user.profile?.firstName || 'Student';
    const template = emailTemplates.achievementVerified(name, achievement.title, status, remarks);
    await sendEmail({ to: achievement.user.email, ...template });
  } catch (err) {
    logger.warn('Failed to send verification email:', err);
  }

  sendSuccess(res, null, `Achievement ${status.toLowerCase()}`);
};

export const getVerificationHistory = async (req: Request, res: Response): Promise<void> => {
  const { achievementId } = req.params;

  const history = await prisma.verification.findMany({
    where: { achievementId },
    include: {
      reviewer: {
        include: { profile: { select: { firstName: true, lastName: true, avatar: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, history, 'Verification history fetched');
};

export const getVerificationStats = async (req: Request, res: Response): Promise<void> => {
  const [pending, underReview, approved, rejected, resubmission] = await Promise.all([
    prisma.achievement.count({ where: { status: 'SUBMITTED' } }),
    prisma.achievement.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.achievement.count({ where: { status: 'APPROVED' } }),
    prisma.achievement.count({ where: { status: 'REJECTED' } }),
    prisma.achievement.count({ where: { status: 'RESUBMISSION_REQUIRED' } }),
  ]);

  sendSuccess(res, { pending, underReview, approved, rejected, resubmission }, 'Stats fetched');
};
