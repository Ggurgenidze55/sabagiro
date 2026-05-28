import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';

export async function storeEventImage(buffer: Buffer): Promise<{ path: string; sizeBytes: number }> {
  const fileName = `event-${randomUUID()}.webp`;
  const sizeBytes = buffer.byteLength;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`events/${fileName}`, buffer, {
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false,
    });
    return { path: blob.url, sizeBytes };
  }

  if (process.env.VERCEL) {
    throw new Error(
      'Image upload needs Vercel Blob. In Vercel: Project → Storage → Create Blob Store → connect to this project.',
    );
  }

  const outputDir = path.join(process.cwd(), 'public', 'uploads', 'events');
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, fileName), buffer);

  return { path: `/uploads/events/${fileName}`, sizeBytes };
}
