import type { MetadataRoute } from 'next';
import { listProducts } from '@/lib/products';
import { getSiteBaseUrl } from '@/lib/site-url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteBaseUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/events`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/location`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  try {
    const products = await listProducts();
    const eventPages = products
      .filter((p) => p.type === 'ticket')
      .map((p) => ({
        url: `${base}/events/${p.slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
      }));
    return [...staticPages, ...eventPages];
  } catch {
    return staticPages;
  }
}
