function readEnv(name: string): string {
  return process.env[name]?.trim() || '';
}

function decodePrivateKey(value: string): string {
  const trimmed = value.trim();
  if (trimmed.includes('BEGIN')) {
    return trimmed.replace(/\\n/g, '\n');
  }
  return Buffer.from(trimmed, 'base64').toString('utf8').replace(/\\n/g, '\n');
}

function parseServiceAccountJson(raw: string): { clientEmail: string; privateKey: string } {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith('{') ? trimmed : Buffer.from(trimmed, 'base64').toString('utf8');
  const parsed = JSON.parse(jsonText) as { client_email?: string; private_key?: string };
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_INVALID');
  }
  return {
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key.replace(/\\n/g, '\n'),
  };
}

export function isGoogleWalletConfigured(): boolean {
  const issuerId = readEnv('GOOGLE_WALLET_ISSUER_ID');
  if (!issuerId) return false;

  if (readEnv('GOOGLE_WALLET_SERVICE_ACCOUNT_JSON')) return true;

  return Boolean(
    readEnv('GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL') && readEnv('GOOGLE_WALLET_SERVICE_ACCOUNT_KEY'),
  );
}

export function getGoogleWalletConfig() {
  const issuerId = readEnv('GOOGLE_WALLET_ISSUER_ID');
  if (!issuerId) {
    throw new Error('GOOGLE_WALLET_NOT_CONFIGURED');
  }

  let clientEmail: string;
  let privateKey: string;

  const jsonEnv = readEnv('GOOGLE_WALLET_SERVICE_ACCOUNT_JSON');
  if (jsonEnv) {
    ({ clientEmail, privateKey } = parseServiceAccountJson(jsonEnv));
  } else {
    clientEmail = readEnv('GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL');
    privateKey = decodePrivateKey(readEnv('GOOGLE_WALLET_SERVICE_ACCOUNT_KEY'));
    if (!clientEmail || !privateKey) {
      throw new Error('GOOGLE_WALLET_NOT_CONFIGURED');
    }
  }

  const reviewStatus = readEnv('GOOGLE_WALLET_REVIEW_STATUS') || 'UNDER_REVIEW';

  return {
    issuerId,
    clientEmail,
    privateKey,
    reviewStatus: reviewStatus === 'APPROVED' ? 'APPROVED' : 'UNDER_REVIEW',
    classSuffix: readEnv('GOOGLE_WALLET_CLASS_SUFFIX') || 'sabagiro-ticket',
  };
}
