import { eventToProduct, getPublishedEventBySlug, listPublishedEvents } from '@/lib/events';
import { prisma } from '@/lib/db';

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

const merchProducts: Product[] = [
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

export async function listProducts(): Promise<Product[]> {
  const events = await listPublishedEvents();
  return [...events.map(eventToProduct), ...merchProducts];
}

export async function listTicketProducts(): Promise<Product[]> {
  const events = await listPublishedEvents();
  return events.map(eventToProduct);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const event = await getPublishedEventBySlug(slug);
  if (event) return eventToProduct(event);
  return merchProducts.find((p) => p.slug === slug);
}

/** Static merch + sync access for client cart metadata */
export const merchCatalog = merchProducts;

export function formatGel(amount: number): string {
  return `${amount.toFixed(0)} ₾`;
}
