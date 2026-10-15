/**
 * E2E: registration, promo validate, checkout (guest + logged-in), test payment.
 * Requires: npm run dev, SABAGIRO_PAYMENTS_TEST_MODE=true, seed-checkout-test-event.mjs
 *
 * Run: dotenv -e .env.local -e .env -- node scripts/e2e-checkout-flow.mjs
 */
import { createPrismaClient } from './prisma-client.ts';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3001';
const SLUG = 'checkout-e2e-test';
const PROMO = 'E2ETEST15';
const PASSWORD = 'TestPass123!';
/** Valid Georgian IDs (DOB 2001-01-11 …) — must start 001… not 010… (yy=01 → 2001) */
const PERSONAL_IDS = {
  registerUv: '00101011234',
  registerV: '00101012234',
  guest: '00101013234',
  holderUv: '00101014234',
};

const emails = {
  guest: 'checkout.guest@example.com',
  unverified: 'checkout.unverified@example.com',
  verified: 'checkout.verified@example.com',
};

const { prisma, pool } = createPrismaClient();

let cookieJar = '';

function storeCookies(res) {
  const raw = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  const single = res.headers.get('set-cookie');
  const list = raw.length ? raw : single ? [single] : [];
  for (const line of list) {
    const part = line.split(';')[0];
    const name = part.split('=')[0];
    if (!name) continue;
    const rest = cookieJar
      .split('; ')
      .filter((c) => c && !c.startsWith(`${name}=`));
    rest.push(part);
    cookieJar = rest.join('; ');
  }
}

async function api(path, { method = 'GET', json, auth = true } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...(auth && cookieJar ? { Cookie: cookieJar } : {}),
    },
    body: json ? JSON.stringify(json) : undefined,
  });
  storeCookies(res);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function register(email, firstName, personalId) {
  return api('/api/auth/register', {
    method: 'POST',
    json: {
      email,
      phone: '+995555123456',
      password: PASSWORD,
      firstName,
      lastName: 'Tester',
      personalId,
      facebookUrl: 'https://facebook.com/sabagiro.test',
    },
  });
}

async function login(email) {
  cookieJar = '';
  return api('/api/auth/login', {
    method: 'POST',
    json: { email, password: PASSWORD },
  });
}

async function completeTestPayment(orderId) {
  return api('/api/payment/test-complete', {
    method: 'POST',
    json: { orderId, action: 'approve' },
  });
}

function holderPayload(email, personalId) {
  return {
    firstName: 'Test',
    lastName: 'Buyer',
    personalId,
    email,
    phone: '+995555999888',
    age: 25,
  };
}

async function guestCheckout(email, promo, personalId) {
  cookieJar = '';
  const body = {
    items: [{ slug: SLUG, qty: 1, holders: [holderPayload(email, personalId)] }],
    confirmAdult18: true,
    confirmIdAtDoor: true,
    ...(promo ? { promoCode: promo } : {}),
  };
  return api('/api/checkout', { method: 'POST', json: body, auth: false });
}

async function loggedInIdOnlyCheckout(promo) {
  const body = {
    items: [
      {
        slug: SLUG,
        qty: 1,
        holders: [holderPayload(emails.unverified, PERSONAL_IDS.holderUv)],
      },
    ],
    confirmAdult18: true,
    confirmIdAtDoor: true,
    ...(promo ? { promoCode: promo } : {}),
  };
  return api('/api/checkout', { method: 'POST', json: body });
}

async function verifiedInstantCheckout(promo) {
  const body = {
    items: [{ slug: SLUG, qty: 1, holders: [] }],
    ...(promo ? { promoCode: promo } : {}),
  };
  return api('/api/checkout', { method: 'POST', json: body });
}

function assert(name, ok, detail) {
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`${status}  ${name}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

async function main() {
  console.log(`E2E base: ${BASE} · event: ${SLUG}\n`);

  const health = await fetch(`${BASE}/events/${SLUG}`).catch(() => null);
  if (!health?.ok) {
    console.error('Start dev server: npm run dev (port 3001)');
    process.exit(1);
  }

  for (const email of Object.values(emails)) {
    await prisma.user.deleteMany({ where: { email } }).catch(() => {});
  }

  const results = [];

  // 1 — promo without login (guest / unverified path)
  cookieJar = '';
  const promoGuest = await api('/api/promo/validate', {
    method: 'POST',
    json: { code: PROMO, slug: SLUG },
    auth: false,
  });
  results.push(
    assert(
      'Promo validate (no login)',
      promoGuest.status === 200 && promoGuest.data.ok && promoGuest.data.percentOff === 15,
      JSON.stringify(promoGuest.data),
    ),
  );

  // 2 — guest checkout + promo + pay
  const g1 = await guestCheckout(emails.guest, PROMO, PERSONAL_IDS.guest);
  const g1ok = g1.status === 200 && g1.data.orderId;
  results.push(assert('Guest checkout + promo', g1ok, g1.data.error || g1.data.orderId));
  if (g1ok) {
    const pay = await completeTestPayment(g1.data.orderId);
    results.push(assert('Guest payment approve', pay.status === 200 && pay.data.ok, pay.data.error));
  }

  // 3 — register unverified + promo + id-only checkout
  const reg = await register(emails.unverified, 'Unverified', PERSONAL_IDS.registerUv);
  results.push(assert('Register (unverified)', reg.status === 200 && reg.data.ok, reg.data.error));
  const promoUv = await api('/api/promo/validate', {
    method: 'POST',
    json: { code: PROMO, slug: SLUG },
  });
  results.push(
    assert(
      'Promo validate (logged-in unverified)',
      promoUv.status === 200 && promoUv.data.ok,
      promoUv.data.error,
    ),
  );
  const uv = await loggedInIdOnlyCheckout(PROMO);
  const uvOk = uv.status === 200 && uv.data.orderId;
  results.push(assert('Unverified id-only checkout + promo', uvOk, uv.data.error || uv.data.code));
  if (uvOk) {
    const pay2 = await completeTestPayment(uv.data.orderId);
    results.push(assert('Unverified payment approve', pay2.status === 200, pay2.data.error));
  }

  // 4 — verified user instant checkout
  cookieJar = '';
  await register(emails.verified, 'Verified', PERSONAL_IDS.registerV);
  await prisma.user.update({
    where: { email: emails.verified },
    data: { verificationStatus: 'VERIFIED', verifiedAt: new Date() },
  });
  await login(emails.verified);
  const promoV = await api('/api/promo/validate', {
    method: 'POST',
    json: { code: PROMO, slug: SLUG },
  });
  results.push(assert('Promo validate (verified)', promoV.status === 200 && promoV.data.ok, promoV.data.error));
  const v = await verifiedInstantCheckout(null);
  const vOk = v.status === 200 && v.data.orderId;
  results.push(assert('Verified instant checkout (no promo)', vOk, v.data.error || v.data.code));
  if (vOk) {
    const pay3 = await completeTestPayment(v.data.orderId);
    results.push(assert('Verified payment approve', pay3.status === 200, pay3.data.error));
  }

  const ticketCounts = await prisma.ticket.groupBy({
    by: ['holderEmail'],
    where: { productSlug: SLUG, source: 'PURCHASE' },
    _count: { _all: true },
  });
  console.log('\nTickets created:', ticketCounts);

  const failed = results.filter((r) => !r).length;
  console.log(`\n${failed === 0 ? 'All tests passed' : `${failed} failed`} (${results.length} checks)`);
  console.log(`\nManual check: ${BASE}/events/${SLUG}`);
  console.log('Emails:', emails);

  process.exit(failed ? 1 : 0);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
