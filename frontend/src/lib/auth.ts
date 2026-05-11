import { NextRequest } from 'next/server';
import { verifyAccessToken, JwtPayload } from './jwt';
import prisma from './prisma';

export async function getAuthUser(req: NextRequest): Promise<JwtPayload & { id: string } | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, isActive: true, role: true },
    });

    if (!user || !user.isActive) return null;

    return { ...payload, id: payload.userId };
  } catch {
    return null;
  }
}

export function unauthorized() {
  return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
}

export function forbidden() {
  return Response.json({ success: false, message: 'Insufficient permissions' }, { status: 403 });
}

export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
