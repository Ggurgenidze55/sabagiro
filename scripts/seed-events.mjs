import { createPrismaClient } from './prisma-client.ts';

const { prisma, pool } = createPrismaClient();

const events = [
  {
    slug: 'concrete-opening-31-may',
    title: 'CONCRETE OPENING',
    lineup: 'NDRX · KIAI · LOCAL CREW',
    tag: 'Upper deck · Main room',
    dayLabel: 'SAT',
    dateLabel: '31 MAY',
    eventDate: '2025-05-31',
    accent: '#f9c108',
    priceGel: 45,
    isFeatured: true,
    sortOrder: 0,
  },
  {
    slug: 'skyline-ritual-07-jun',
    title: 'SKYLINE RITUAL',
    lineup: 'VOID ECHO · MARTA K',
    tag: 'Spiral stairs · Live',
    dayLabel: 'FRI',
    dateLabel: '07 JUN',
    eventDate: '2025-06-07',
    accent: '#00f0ff',
    priceGel: 40,
    sortOrder: 1,
  },
  {
    slug: 'forest-echo-14-jun',
    title: 'FOREST ECHO',
    lineup: 'DARK MATTER · ZURAB LIVE',
    tag: 'Open air · All night',
    dayLabel: 'SAT',
    dateLabel: '14 JUN',
    eventDate: '2025-06-14',
    accent: '#ff0044',
    priceGel: 50,
    sortOrder: 2,
  },
  {
    slug: 'guest-night-21-jun',
    title: 'GUEST NIGHT',
    lineup: 'INTL B2B · SURPRISE SET',
    tag: 'Warehouse · Special',
    dayLabel: 'FRI',
    dateLabel: '21 JUN',
    eventDate: '2025-06-21',
    accent: '#fff4d6',
    priceGel: 55,
    sortOrder: 3,
  },
  {
    slug: 'acid-dawn-28-jun',
    title: 'ACID DAWN',
    lineup: 'TBILISI ALLIANCE',
    tag: 'Sunrise session · Terrace',
    dayLabel: 'SAT',
    dateLabel: '28 JUN',
    eventDate: '2025-06-28',
    accent: '#cc00ff',
    priceGel: 42,
    sortOrder: 4,
  },
  {
    slug: 'raw-frequency-04-jul',
    title: 'RAW FREQUENCY',
    lineup: 'INDUSTRIAL LINEUP TBA',
    tag: 'Basement · Heavy',
    dayLabel: 'FRI',
    dateLabel: '04 JUL',
    eventDate: '2025-07-04',
    accent: '#ff9900',
    priceGel: 48,
    sortOrder: 5,
  },
];

await prisma.siteSetting.upsert({
  where: { key: 'events_season' },
  create: { key: 'events_season', value: 'Summer 2025' },
  update: { value: 'Summer 2025' },
});

for (const ev of events) {
  await prisma.clubEvent.upsert({
    where: { slug: ev.slug },
    create: { ...ev, published: true },
    update: ev,
  });
}

console.log('Seeded', events.length, 'events');
await prisma.$disconnect();
await pool.end();
