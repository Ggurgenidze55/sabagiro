import { redirect } from 'next/navigation';
import { TicketSuccessView } from '@/components/TicketSuccessView';
import { SiteChrome } from '@/components/SiteChrome';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getProduct } from '@/lib/products';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Ticket ready — Sabagiro' };

type PageProps = {
  searchParams: {
    source?: string;
    slug?: string;
    orderId?: string;
  };
};

export default async function TicketSuccessPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  if (!user) {
    const params = new URLSearchParams();
    if (searchParams.source) params.set('source', searchParams.source);
    if (searchParams.slug) params.set('slug', searchParams.slug);
    if (searchParams.orderId) params.set('orderId', searchParams.orderId);
    const next = params.toString()
      ? `/account/ticket-success?${params.toString()}`
      : '/account/ticket-success';
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const source = searchParams.source === 'free' ? 'free' : 'purchase';
  let eventName = '';

  if (source === 'purchase' && searchParams.orderId) {
    const order = await prisma.order.findFirst({
      where: { id: searchParams.orderId, userId: user.id, status: 'PAID' },
      include: { items: { take: 1 } },
    });
    if (!order) redirect('/account');
    eventName = order.items[0]?.productName ?? '';
  } else if (searchParams.slug) {
    const product = await getProduct(searchParams.slug);
    eventName = product?.name ?? '';
  }

  return (
    <SiteChrome current="account">
      <TicketSuccessView source={source} eventName={eventName} />
    </SiteChrome>
  );
}
