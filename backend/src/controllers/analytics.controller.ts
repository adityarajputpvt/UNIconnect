import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/apiResponse';

export const getStudentDashboard = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const [
    profile,
    achievementStats,
    recentAchievements,
    pendingVerifications,
    recommendations,
    kudosReceived,
  ] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      include: { skills: { include: { skill: true } } },
    }),
    prisma.achievement.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    }),
    prisma.achievement.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { tags: { include: { tag: true } } },
    }),
    prisma.achievement.count({ where: { userId, status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
    prisma.recommendation.findMany({
      where: { userId, isActioned: false },
      orderBy: { relevance: 'desc' },
      take: 3,
    }),
    prisma.kudos.count({ where: { receiverId: userId } }),
  ]);

  // Category breakdown
  const categoryBreakdown = await prisma.achievement.groupBy({
    by: ['category'],
    where: { userId, status: 'APPROVED' },
    _count: true,
  });

  // Monthly activity (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyActivity = await prisma.achievement.findMany({
    where: { userId, createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true, status: true },
  });

  // Group by month
  const activityByMonth: Record<string, number> = {};
  monthlyActivity.forEach(a => {
    const month = a.createdAt.toISOString().slice(0, 7);
    activityByMonth[month] = (activityByMonth[month] || 0) + 1;
  });

  sendSuccess(res, {
    profile,
    achievementStats: achievementStats.reduce((acc, s) => {
      acc[s.status] = s._count;
      return acc;
    }, {} as Record<string, number>),
    recentAchievements,
    pendingVerifications,
    recommendations,
    kudosReceived,
    categoryBreakdown: categoryBreakdown.map(c => ({
      category: c.category,
      count: c._count,
    })),
    activityByMonth,
  }, 'Dashboard data fetched');
};

export const getFacultyDashboard = async (req: Request, res: Response): Promise<void> => {
  const [
    pendingCount,
    underReviewCount,
    approvedToday,
    recentSubmissions,
    verificationTrend,
  ] = await Promise.all([
    prisma.achievement.count({ where: { status: 'SUBMITTED' } }),
    prisma.achievement.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.achievement.count({
      where: {
        status: 'APPROVED',
        updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.achievement.findMany({
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      include: {
        user: {
          include: { profile: { select: { firstName: true, lastName: true, avatar: true } } },
        },
      },
      orderBy: { updatedAt: 'asc' },
      take: 10,
    }),
    prisma.verification.groupBy({
      by: ['status'],
      _count: true,
    }),
  ]);

  sendSuccess(res, {
    pendingCount,
    underReviewCount,
    approvedToday,
    recentSubmissions,
    verificationTrend: verificationTrend.reduce((acc, v) => {
      acc[v.status] = v._count;
      return acc;
    }, {} as Record<string, number>),
  }, 'Faculty dashboard fetched');
};

export const getAdminDashboard = async (req: Request, res: Response): Promise<void> => {
  const [
    totalStudents,
    totalAchievements,
    totalApproved,
    departmentStats,
    categoryStats,
    recentUsers,
    engagementStats,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.achievement.count(),
    prisma.achievement.count({ where: { status: 'APPROVED' } }),
    prisma.department.findMany({
      include: {
        _count: { select: { users: true, achievements: true } },
      },
    }),
    prisma.achievement.groupBy({
      by: ['category'],
      _count: true,
      orderBy: { _count: { category: 'desc' } },
    }),
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: { profile: { select: { firstName: true, lastName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.post.count(),
  ]);

  // Monthly registration trend
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const registrationTrend = await prisma.user.findMany({
    where: { createdAt: { gte: threeMonthsAgo } },
    select: { createdAt: true },
  });

  const trendByMonth: Record<string, number> = {};
  registrationTrend.forEach(u => {
    const month = u.createdAt.toISOString().slice(0, 7);
    trendByMonth[month] = (trendByMonth[month] || 0) + 1;
  });

  sendSuccess(res, {
    overview: {
      totalStudents,
      totalAchievements,
      totalApproved,
      approvalRate: totalAchievements > 0 ? Math.round((totalApproved / totalAchievements) * 100) : 0,
      engagementStats,
    },
    departmentStats,
    categoryStats: categoryStats.map(c => ({ category: c.category, count: c._count })),
    recentUsers,
    registrationTrend: trendByMonth,
  }, 'Admin dashboard fetched');
};
