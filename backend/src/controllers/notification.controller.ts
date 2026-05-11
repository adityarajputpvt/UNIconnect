import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess, getPaginationParams } from '../utils/apiResponse';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  sendSuccess(res, { notifications, unreadCount }, 'Notifications fetched', 200, {
    page, limit, total, totalPages: Math.ceil(total / limit),
  });
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { id } = req.params;

  if (id === 'all') {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    sendSuccess(res, null, 'All notifications marked as read');
  } else {
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    sendSuccess(res, null, 'Notification marked as read');
  }
};
