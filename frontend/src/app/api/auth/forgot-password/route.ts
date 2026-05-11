import { NextRequest } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return Response.json({ success: true, message: 'If that email exists, a reset link has been sent', data: null });
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
    } catch {
      // Non-fatal
    }

    return Response.json({ success: true, message: 'If that email exists, a reset link has been sent', data: null });
  } catch (err) {
    console.error('Forgot password error:', err);
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
