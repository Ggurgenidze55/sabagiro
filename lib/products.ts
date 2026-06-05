import { eventToProduct } from '@/lib/events';
import { getPublishedEventBySlug, listPublishedEvents } from '@/lib/events';
import { getEventTierAvailability, type TierAvailability } from '@/lib/ticket-tiers';

export type ProductType = 'ticket' | 'merch';

export type Product = {
  slug: string;
  name: string;
  description: string;
  about?: string;
  imagePath?: string;
  priceGel: number;
  type: ProductType;
  accent: string;
  tag?: string;
  lineup?: string;
  venueTag?: string;
  eventDate?: string;
  isFreeEntry?: boolean;
  tiers?: TierAvailability[];
  ticketsRemaining?: number;
  priceFromGel?: number;
};

const merchProducts: Product[] = [
  {
    slug: 'sabagiro-tee-black',
    name: 'SABAGIRO TEE',
    description: 'Heavy cotton · Screen print logo · Unisex',
    priceGel: 65,
    type: 'merch',
    accent: '#f9c108',
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

async function eventToProductWithTiers(slug: string) {
  const event = await getPublishedEventBySlug(slug);
  if (!event) return undefined;

  const base = eventToProduct(event);
  if (event.isFreeEntry) {
    return {
      ...base,
      priceGel: 0,
      priceFromGel: 0,
      ticketsRemaining: undefined,
    };
  }

  const avail = await getEventTierAvailability(slug);
  return {
    ...base,
    priceGel: avail?.currentTierPrice ?? base.priceGel,
    priceFromGel: avail?.tiers[0]?.priceGel ?? base.priceGel,
    tiers: avail?.tiers,
    ticketsRemaining: avail?.totalRemaining ?? 0,
  };
}

export async function listProducts(): Promise<Product[]> {
  const events = await listPublishedEvents();
  const ticketProducts = await Promise.all(events.map((e) => eventToProductWithTiers(e.slug)));
  return [...ticketProducts.filter(Boolean), ...merchProducts] as Product[];
}

export async function listTicketProducts(): Promise<Product[]> {
  const events = await listPublishedEvents();
  const ticketProducts = await Promise.all(events.map((e) => eventToProductWithTiers(e.slug)));
  return ticketProducts.filter(Boolean) as Product[];
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const ticket = await eventToProductWithTiers(slug);
  if (ticket) return ticket;
  return merchProducts.find((p) => p.slug === slug);
}

export const merchCatalog = merchProducts;

export function formatGel(amount: number): string {
  return `${amount.toFixed(0)} ₾`;
}
