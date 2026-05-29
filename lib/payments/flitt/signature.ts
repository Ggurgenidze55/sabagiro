import { createHash } from 'node:crypto';

type SigValue = string | number | boolean | null | undefined;

/** Flitt SHA1 signature — https://docs.flitt.com/api/building-signature/ */
export function buildFlittSignature(
  secretKey: string,
  params: Record<string, SigValue>,
): string {
  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (key === 'signature' || key === 'response_signature_string') continue;
    if (value === null || value === undefined || value === '') continue;
    filtered[key] = String(value);
  }

  const sortedKeys = Object.keys(filtered).sort();
  const parts = [secretKey, ...sortedKeys.map((k) => filtered[k])];
  return createHash('sha1').update(parts.join('|'), 'utf8').digest('hex');
}

export function verifyFlittSignature(
  secretKey: string,
  params: Record<string, SigValue>,
): boolean {
  const given = params.signature;
  if (!given || typeof given !== 'string') return false;
  const expected = buildFlittSignature(secretKey, params);
  return expected === given;
}
