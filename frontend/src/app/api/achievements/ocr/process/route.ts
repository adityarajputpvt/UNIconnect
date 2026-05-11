import { NextRequest } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { getAuthUser, unauthorized } from '@/lib/auth';

function extractCertificateData(text: string) {
  const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
  const title = lines.find((l: string) => l.length > 10 && l.length < 100) || '';
  const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+ \d{1,2},?\s*\d{4}|\d{4})\b/g;
  const dates = text.match(datePattern) || [];
  const certIdPattern = /(?:certificate|cert|id|no|number)[:\s#]*([A-Z0-9\-]{6,20})/gi;
  const certIdMatch = certIdPattern.exec(text);
  const certificateId = certIdMatch ? certIdMatch[1] : '';
  const issuerPattern = /(?:issued by|presented by|awarded by|from|by)\s+([A-Za-z\s&,\.]+?)(?:\n|$)/i;
  const issuerMatch = issuerPattern.exec(text);
  const issuer = issuerMatch ? issuerMatch[1].trim() : '';
  return {
    title: title.replace(/[^a-zA-Z0-9\s\-&]/g, '').trim(),
    issuer,
    date: dates[0] || '',
    certificateId,
  };
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorized();

  try {
    const formData = await req.formData();
    const file = formData.get('certificate') as File | null;

    if (!file) return Response.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    if (!file.type.startsWith('image/')) {
      return Response.json({ success: false, message: 'OCR only supports image files' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dynamically import tesseract.js (heavy WASM module)
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    const { data } = await worker.recognize(buffer);
    await worker.terminate();

    const extractedData = extractCertificateData(data.text);

    const b64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${b64}`;
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: 'uniconnect/certificates',
    });

    return Response.json({
      success: true,
      message: 'OCR processing complete',
      data: {
        extractedData,
        confidence: data.confidence,
        rawText: data.text,
        fileUrl: uploadResult.secure_url,
        cloudinaryId: uploadResult.public_id,
      },
    });
  } catch (err) {
    console.error('OCR error:', err);
    return Response.json({ success: false, message: 'OCR processing failed' }, { status: 500 });
  }
}
