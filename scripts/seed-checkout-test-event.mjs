/**
 * Paid test event + promo for checkout E2E (local / staging).
 * Run: dotenv -e .env.local -e .env -- node scripts/seed-checkout-test-event.mjs
 */
import { createPrismaClient } from './prisma-client.ts';

const SLUG = 'checkout-e2e-test';
const PROMO_CODE = 'E2ETEST15';

const { prisma, pool } = createPrismaClient();

async function main() {
  const eventDate = '2026-11-20';
  const event = await prisma.clubEvent.upsert({
    where: { slug: SLUG },
    create: {
      slug: SLUG,
      title: 'CHECKOUT E2E TEST',
      about: 'Internal QA — paid tiers, promo codes, guest + registered checkout.',
      lineup: 'QA ONLY',
      tag: 'Test',
      dayLabel: 'FRI',
      dateLabel: '20 NOV',
      eventDate,
      accent: '#f9c108',
      priceGel: 25,
      allowUnverifiedIdPurchase: true,
      published: true,
      sortOrder: -1,
      ticketTiers: {
        create: [{ sortOrder: 0, label: 'Test tier', quantity: 100, priceGel: 25 }],
      },
    },
    update: {
      title: 'CHECKOUT E2E TEST',
      eventDate,
      priceGel: 25,
      allowUnverifiedIdPurchase: true,
      published: true,
    },
    include: { ticketTiers: true },
  });

  if (event.ticketTiers.length === 0) {
    await prisma.eventTicketTier.create({
      data: { eventId: event.id, sortOrder: 0, label: 'Test tier', quantity: 100, priceGel: 25 },
    });
  }

  await prisma.promoCode.upsert({
    where: { code: PROMO_CODE },
    create: {
      code: PROMO_CODE,
      percentOff: 15,
      eventSlug: SLUG,
      active: true,
    },
    update: {
      percentOff: 15,
      eventSlug: SLUG,
      active: true,
    },
  });

  console.log(JSON.stringify({ ok: true, slug: SLUG, promoCode: PROMO_CODE, eventUrl: `/events/${SLUG}` }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
