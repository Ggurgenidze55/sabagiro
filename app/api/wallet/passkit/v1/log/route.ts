export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Apple Wallet client error log — acknowledge silently. */
export async function POST() {
  return new Response(null, { status: 200 });
}
