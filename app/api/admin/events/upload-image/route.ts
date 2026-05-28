import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

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

    const fileName = `event-${randomUUID()}.webp`;
    const relativePath = `/uploads/events/${fileName}`;
    const outputDir = path.join(process.cwd(), 'public', 'uploads', 'events');
    const outputPath = path.join(outputDir, fileName);

    await mkdir(outputDir, { recursive: true });
    await writeFile(outputPath, outputBuffer);

    return NextResponse.json({
      path: relativePath,
      sizeBytes: outputBuffer.byteLength,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to upload image';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
