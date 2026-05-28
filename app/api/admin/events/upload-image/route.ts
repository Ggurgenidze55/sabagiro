import sharp from 'sharp';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { storeEventImage } from '@/lib/event-image-storage';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const formData = await request.formData();
    const file = formData.get('image');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Image file is required.' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Image is too large. Max upload size is 10MB.' },
        { status: 400 },
      );
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const outputBuffer = await sharp(inputBuffer)
      .rotate()
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 70, effort: 4 })
      .toBuffer();

    const stored = await storeEventImage(outputBuffer);

    return NextResponse.json({
      path: stored.path,
      sizeBytes: stored.sizeBytes,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to upload image';
    const status =
      message === 'UNAUTHORIZED'
        ? 401
        : message === 'FORBIDDEN'
          ? 403
          : message.includes('Vercel Blob')
            ? 503
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
