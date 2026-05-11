import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { sendEmail, emailTemplates } from '../utils/email';
import { logger } from '../utils/logger';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, firstName, lastName, role = 'STUDENT', rollNumber, batch } = req.body;

  // Check existing user
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    sendError(res, 'Email already registered', 409);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const emailVerifyToken = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role,
      emailVerifyToken,
      profile: {
        create: {
          firstName,
          lastName,
          rollNumber,
          batch,
          portfolioSlug: `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Date.now()}`,
        },
      },
    },
    include: { profile: true },
  });

  // Send verification email
  try {
    const template = emailTemplates.verifyEmail(firstName, emailVerifyToken);
    await sendEmail({ to: email, ...template });
  } catch (err) {
    logger.warn('Failed to send verification email:', err);
  }

  const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  sendSuccess(res, {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
    },
    accessToken,
    refreshToken,
  }, 'Registration successful', 201);
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user || !user.isActive) {
    sendError(res, 'Invalid credentials', 401);
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    sendError(res, 'Invalid credentials', 401);
    return;
  }

  const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken, lastLoginAt: new Date() },
  });

  sendSuccess(res, {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      profile: user.profile,
    },
    accessToken,
    refreshToken,
  }, 'Login successful');
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken: token } = req.body;
  if (!token) {
    sendError(res, 'Refresh token required', 400);
    return;
  }

  try {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || user.refreshToken !== token) {
      sendError(res, 'Invalid refresh token', 401);
      return;
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });

    sendSuccess(res, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed');
  } catch {
    sendError(res, 'Invalid refresh token', 401);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  if (req.user) {
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { refreshToken: null },
    });
  }
  sendSuccess(res, null, 'Logged out successfully');
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;

  const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
  if (!user) {
    sendError(res, 'Invalid or expired verification token', 400);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, emailVerifyToken: null },
  });

  sendSuccess(res, null, 'Email verified successfully');
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    sendSuccess(res, null, 'If that email exists, a reset link has been sent');
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetPasswordToken: resetToken, resetPasswordExpiry: resetExpiry },
  });

  try {
    const name = user.profile?.firstName || 'User';
    const template = emailTemplates.resetPassword(name, resetToken);
    await sendEmail({ to: email, ...template });
  } catch (err) {
    logger.warn('Failed to send reset email:', err);
  }

  sendSuccess(res, null, 'If that email exists, a reset link has been sent');
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    sendError(res, 'Invalid or expired reset token', 400);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpiry: null,
      refreshToken: null,
    },
  });

  sendSuccess(res, null, 'Password reset successfully');
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: {
      profile: {
        include: {
          skills: { include: { skill: true } },
          interests: true,
        },
      },
      department: true,
    },
  });

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  const { password, refreshToken, resetPasswordToken, emailVerifyToken, ...safeUser } = user;
  sendSuccess(res, safeUser, 'User fetched');
};
