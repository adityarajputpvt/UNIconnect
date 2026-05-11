import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName, role = 'STUDENT', rollNumber, batch } = await req.json();

    if (!email || !password || !firstName || !lastName) {
      return Response.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ success: false, message: 'Email already registered' }, { status: 409 });
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

    try {
      const template = emailTemplates.verifyEmail(firstName, emailVerifyToken);
      await sendEmail({ to: email, ...template });
    } catch {
      // Non-fatal — continue even if email fails
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    return Response.json({
      success: true,
      message: 'Registration successful',
      data: {
        user: { id: user.id, email: user.email, role: user.role, profile: user.profile },
        accessToken,
        refreshToken,
      },
    }, { status: 201 });
  } catch (err) {
    console.error('Register error:', err);
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
