function readEnv(name: string): string {
  return process.env[name]?.trim() || '';
}

export function isAppleWalletConfigured(): boolean {
  return Boolean(
    readEnv('APPLE_WALLET_PASS_TYPE_ID') &&
      readEnv('APPLE_WALLET_TEAM_ID') &&
      readEnv('APPLE_WALLET_WWDR_CERT') &&
      readEnv('APPLE_WALLET_SIGNER_CERT') &&
      readEnv('APPLE_WALLET_SIGNER_KEY'),
  );
}

export function getAppleWalletConfig() {
  const passTypeIdentifier = readEnv('APPLE_WALLET_PASS_TYPE_ID');
  const teamIdentifier = readEnv('APPLE_WALLET_TEAM_ID');
  const wwdr = readEnv('APPLE_WALLET_WWDR_CERT');
  const signerCert = readEnv('APPLE_WALLET_SIGNER_CERT');
  const signerKey = readEnv('APPLE_WALLET_SIGNER_KEY');
  const signerKeyPassphrase = readEnv('APPLE_WALLET_SIGNER_KEY_PASSPHRASE');

  if (!passTypeIdentifier || !teamIdentifier || !wwdr || !signerCert || !signerKey) {
    throw new Error('APPLE_WALLET_NOT_CONFIGURED');
  }

  return {
    passTypeIdentifier,
    teamIdentifier,
    certificates: {
      wwdr: decodeCert(wwdr),
      signerCert: decodeCert(signerCert),
      signerKey: decodeCert(signerKey),
      signerKeyPassphrase: signerKeyPassphrase || undefined,
    },
  };
}

/** PEM string or base64-encoded PEM in Vercel env. */
function decodeCert(value: string): string | Buffer {
  const trimmed = value.trim();
  if (trimmed.includes('BEGIN')) return trimmed;
  return Buffer.from(trimmed, 'base64');
}
