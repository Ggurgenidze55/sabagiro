import http2 from 'node:http2';
import { importPKCS8, SignJWT } from 'jose';
import { getAppleWalletConfig } from '@/lib/wallet/apple-config';

function decodeP8(value: string): string {
  const trimmed = value.trim();
  if (trimmed.includes('BEGIN')) return trimmed;
  return Buffer.from(trimmed, 'base64').toString('utf8');
}

export function isWalletPushConfigured(): boolean {
  return Boolean(
    process.env.APPLE_WALLET_APNS_KEY_ID?.trim() &&
      process.env.APPLE_WALLET_APNS_KEY?.trim() &&
      process.env.APPLE_WALLET_TEAM_ID?.trim(),
  );
}

export async function sendWalletPassPush(pushToken: string): Promise<boolean> {
  const keyId = process.env.APPLE_WALLET_APNS_KEY_ID?.trim();
  const keyRaw = process.env.APPLE_WALLET_APNS_KEY?.trim();
  if (!keyId || !keyRaw) return false;

  const { passTypeIdentifier, teamIdentifier } = getAppleWalletConfig();
  const topic = passTypeIdentifier.startsWith('pass.')
    ? passTypeIdentifier
    : `pass.${passTypeIdentifier}`;

  const privateKey = await importPKCS8(decodeP8(keyRaw), 'ES256');
  const authToken = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamIdentifier)
    .setIssuedAt()
    .sign(privateKey);

  const host =
    process.env.APPLE_WALLET_APNS_ENV === 'sandbox'
      ? 'api.sandbox.push.apple.com'
      : 'api.push.apple.com';

  return new Promise((resolve) => {
    const client = http2.connect(`https://${host}`);
    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${pushToken}`,
      authorization: `bearer ${authToken}`,
      'apns-topic': topic,
      'apns-push-type': 'background',
      'apns-priority': '5',
    });

    req.on('response', (headers) => {
      const status = Number(headers[':status'] ?? 0);
      client.close();
      resolve(status === 200);
    });

    req.on('error', () => {
      client.close();
      resolve(false);
    });

    req.end('{}');
  });
}
