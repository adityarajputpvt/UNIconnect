import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import cloudinary from '@/lib/cloudinary';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorized();

  const { id } = await params;

  const achievement = await prisma.achievement.findFirst({ where: { id, userId: authUser.userId } });
  if (!achievement) return Response.json({ success: false, message: 'Achievement not found' }, { status: 404 });

  try {
    const formData = await req.formData();
    const file = formData.get('document') as File | null;

    if (!file) return Response.json({ success: false, message: 'No file uploaded' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const b64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'uniconnect/documents',
      resource_type: file.type === 'application/pdf' ? 'raw' : 'image',
    });

    const document = await prisma.document.create({
      data: {
        achievementId: id,
        fileName: file.name,
        fileUrl: result.secure_url,
        fileType: file.type,
        fileSize: file.size,
        cloudinaryId: result.public_id,
      },
    });

    return Response.json({ success: true, message: 'Document uploaded', data: document }, { status: 201 });
  } catch (err) {
    console.error('Document upload error:', err);
    return Response.json({ success: false, message: 'Upload failed' }, { status: 500 });
  }
}
