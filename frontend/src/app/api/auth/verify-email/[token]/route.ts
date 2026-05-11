import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
  if (!user) {
    return Response.json({ success: false, message: 'Invalid or expired verification token' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, emailVerifyToken: null },
  });

  return Response.json({ success: true, message: 'Email verified successfully', data: null });
}
