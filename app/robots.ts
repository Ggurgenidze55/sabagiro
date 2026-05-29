import type { MetadataRoute } from 'next';
import { getSiteBaseUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  const base = getSiteBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/events', '/contact', '/location'],
        disallow: [
          '/admin',
          '/account',
          '/api',
          '/cart',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/payment',
          '/scan',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
