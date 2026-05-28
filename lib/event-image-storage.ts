import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';

function getBlobToken(): string | undefined {
  const token =
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    process.env.sabagiro_READ_WRITE_TOKEN?.trim() ||
    process.env.SABAGIRO_READ_WRITE_TOKEN?.trim();

  return token || undefined;
}

function isVercelRuntime(): boolean {
  return Boolean(process.env.VERCEL);
}

export async function storeEventImage(buffer: Buffer): Promise<{ path: string; sizeBytes: number }> {
  const fileName = `event-${randomUUID()}.webp`;
  const sizeBytes = buffer.byteLength;
  const token = getBlobToken();
  const onVercel = isVercelRuntime();

  if (token) {
    try {
      const blob = await put(`events/${fileName}`, buffer, {
        access: 'public',
        contentType: 'image/webp',
        token,
      });
      return { path: blob.url, sizeBytes };
    } catch (e) {
      const detail = e instanceof Error ? e.message : 'unknown error';
      throw new Error(`Blob upload failed: ${detail}`);
    }
  }

  if (onVercel) {
    throw new Error(
      'Server cannot see BLOB_READ_WRITE_TOKEN. In Vercel → sabagiro → Settings → Environment Variables: confirm the token exists for Production, then Redeploy (not just rebuild cache).',
    );
  }

  const outputDir = path.join(process.cwd(), 'public', 'uploads', 'events');
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, fileName), buffer);

  return { path: `/uploads/events/${fileName}`, sizeBytes };
}
