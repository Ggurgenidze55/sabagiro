import { readFile, writeFile } from 'node:fs/promises';
import { createPrismaClient } from './prisma-client.ts';

const certDir = process.env.HOME + '/Desktop/sabagiro-wallet-certs';
process.env.APPLE_WALLET_PASS_TYPE_ID = 'pass.ge.sabagiro.ticket';
process.env.APPLE_WALLET_TEAM_ID = 'R85UAY2KY6';
for (const [name, file] of [
  ['APPLE_WALLET_SIGNER_CERT', 'signerCert.pem'],
  ['APPLE_WALLET_SIGNER_KEY', 'signerKey.pem'],
  ['APPLE_WALLET_WWDR_CERT', 'wwdr.pem'],
]) {
  const pem = await readFile(`${certDir}/${file}`, 'utf8');
  process.env[name] = Buffer.from(pem).toString('base64');
}

const { buildAppleWalletPass } = await import('../lib/wallet/apple-pass.ts');
const { prisma, pool } = createPrismaClient();

const ticket = await prisma.ticket.findFirst({
  where: { status: 'VALID' },
  orderBy: { createdAt: 'desc' },
});

if (!ticket) {
  console.error('No VALID ticket in DB');
  process.exit(1);
}

console.log('Ticket:', ticket.id, ticket.productName);

try {
  const buf = await buildAppleWalletPass(ticket);
  await writeFile('/tmp/sabagiro-test.pkpass', buf);
  console.log('OK — wrote /tmp/sabagiro-test.pkpass', buf.length, 'bytes');
} catch (e) {
  console.error('FAIL:', e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
  await pool.end();
}
