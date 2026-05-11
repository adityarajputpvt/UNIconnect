import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const { refreshToken: token } = await req.json();
    if (!token) {
      return Response.json({ success: false, message: 'Refresh token required' }, { status: 400 });
    }

    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || user.refreshToken !== token) {
      return Response.json({ success: false, message: 'Invalid refresh token' }, { status: 401 });
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });

    return Response.json({
      success: true,
      message: 'Token refreshed',
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch {
    return Response.json({ success: false, message: 'Invalid refresh token' }, { status: 401 });
  }
}
