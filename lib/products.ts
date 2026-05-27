export type ProductType = 'ticket' | 'merch';

export type Product = {
  slug: string;
  name: string;
  description: string;
  priceGel: number;
  type: ProductType;
  accent: string;
  tag?: string;
  eventDate?: string;
};

export const products: Product[] = [
  {
    slug: 'concrete-opening-31-may',
    name: 'CONCRETE OPENING',
    description: 'NDRX · KIAI · LOCAL CREW — Upper deck · Main room',
    priceGel: 45,
    type: 'ticket',
    accent: '#c8ff00',
    tag: '31 MAY · SAT',
    eventDate: '2025-05-31',
  },
  {
    slug: 'skyline-ritual-07-jun',
    name: 'SKYLINE RITUAL',
    description: 'VOID ECHO · MARTA K — Spiral stairs · Live',
    priceGel: 40,
    type: 'ticket',
    accent: '#00f0ff',
    tag: '07 JUN · FRI',
    eventDate: '2025-06-07',
  },
  {
    slug: 'forest-echo-14-jun',
    name: 'FOREST ECHO',
    description: 'DARK MATTER · ZURAB LIVE — Open air · All night',
    priceGel: 50,
    type: 'ticket',
    accent: '#ff0044',
    tag: '14 JUN · SAT',
    eventDate: '2025-06-14',
  },
  {
    slug: 'guest-night-21-jun',
    name: 'GUEST NIGHT',
    description: 'INTL B2B · SURPRISE SET — Warehouse · Special',
    priceGel: 55,
    type: 'ticket',
    accent: '#f5ffe8',
    tag: '21 JUN · FRI',
    eventDate: '2025-06-21',
  },
  {
    slug: 'acid-dawn-28-jun',
    name: 'ACID DAWN',
    description: 'TBILISI ALLIANCE — Sunrise session · Terrace',
    priceGel: 42,
    type: 'ticket',
    accent: '#cc00ff',
    tag: '28 JUN · SAT',
    eventDate: '2025-06-28',
  },
  {
    slug: 'raw-frequency-04-jul',
    name: 'RAW FREQUENCY',
    description: 'INDUSTRIAL LINEUP TBA — Basement · Heavy',
    priceGel: 48,
    type: 'ticket',
    accent: '#ff9900',
    tag: '04 JUL · FRI',
    eventDate: '2025-07-04',
  },
  {
    slug: 'sabagiro-tee-black',
    name: 'SABAGIRO TEE',
    description: 'Heavy cotton · Screen print logo · Unisex',
    priceGel: 65,
    type: 'merch',
    accent: '#c8ff00',
    tag: 'MERCH',
  },
  {
    slug: 'concrete-tote',
    name: 'CONCRETE TOTE',
    description: 'Canvas tote · Acid green print',
    priceGel: 35,
    type: 'merch',
    accent: '#00f0ff',
    tag: 'MERCH',
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function formatGel(amount: number): string {
  return `${amount.toFixed(0)} ₾`;
}
