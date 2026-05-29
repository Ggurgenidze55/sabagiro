import { redirect } from 'next/navigation';

type PageProps = { params: { slug: string } };

export default function ShopSlugRedirectPage({ params }: PageProps) {
  redirect(`/events/${encodeURIComponent(params.slug)}`);
}
