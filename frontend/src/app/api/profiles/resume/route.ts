import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import cloudinary from '@/lib/cloudinary';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorized();

  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return Response.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const b64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'uniconnect/resumes',
      resource_type: 'raw',
    });

    await prisma.profile.update({
      where: { userId: authUser.userId },
      data: { resumeUrl: result.secure_url },
    });

    return Response.json({ success: true, message: 'Resume uploaded', data: { resumeUrl: result.secure_url } });
  } catch (err) {
    console.error('Resume upload error:', err);
    return Response.json({ success: false, message: 'Upload failed' }, { status: 500 });
  }
}
