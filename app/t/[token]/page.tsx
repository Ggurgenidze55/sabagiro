import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteChrome } from '@/components/SiteChrome';
import { prisma } from '@/lib/db';
import { siteUrl } from '@/lib/site-url';
import { canAccessTicketQr, loadTicketQrContext } from '@/lib/ticket-qr-access';
import { ticketShareUrl } from '@/lib/ticket-share';

type PageProps = { params: { token: string } };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const ticket = await prisma.ticket.findFirst({
    where: { qrToken: params.token, status: { not: 'CANCELLED' } },
    select: { productName: true, holderFirstName: true, holderLastName: true },
  });

  const title = ticket
    ? `${ticket.productName} — Sabagiro ticket`
    : 'Sabagiro ticket';
  const description = ticket
    ? `Guest ticket for ${ticket.holderFirstName} ${ticket.holderLastName}`
    : 'Sabagiro guest ticket';
  const image = siteUrl(`/api/scan/${encodeURIComponent(params.token)}/qr?download=1&inline=1`);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: ticketShareUrl(params.token),
      images: [{ url: image, width: 720, height: 1100, alt: title }],
    },
    robots: { index: false, follow: false },
  };
}

export default async function PublicTicketPage({ params }: PageProps) {
  const ticket = await prisma.ticket.findFirst({
    where: { qrToken: params.token },
    select: {
      id: true,
      qrToken: true,
      productName: true,
      productSlug: true,
      holderFirstName: true,
      holderLastName: true,
      status: true,
      eventDate: true,
      createdAt: true,
    },
  });

  if (!ticket || ticket.status === 'CANCELLED') {
    return (
      <SiteChrome>
        <h1 className="page-title">TICKET</h1>
        <p className="page-lead">This ticket is unavailable.</p>
        <Link href="/" className="btn btn--ghost">
          Home
        </Link>
      </SiteChrome>
    );
  }

  const ctx = await loadTicketQrContext(ticket, async (slug) => {
    const event = await prisma.clubEvent.findFirst({
      where: { slug },
      select: { eventDate: true },
    });
    return event?.eventDate;
  });
  const available = canAccessTicketQr(ctx, false);

  if (!available) {
    return (
      <SiteChrome>
        <h1 className="page-title">TICKET</h1>
        <p className="page-lead">
          {ticket.productName}
          <br />
          This ticket is no longer available.
        </p>
        <Link href="/" className="btn btn--ghost">
          Home
        </Link>
      </SiteChrome>
    );
  }

  const passSrc = `/api/scan/${encodeURIComponent(ticket.qrToken)}/qr?download=1&inline=1`;

  return (
    <SiteChrome>
      <h1 className="page-title">TICKET</h1>
      <p className="page-lead">
        {ticket.productName}
        <br />
        {ticket.holderFirstName} {ticket.holderLastName}
      </p>
      <figure className="public-ticket">
        <img
          src={passSrc}
          alt={`${ticket.productName} ticket`}
          className="public-ticket__img"
          width={720}
          height={1100}
        />
        <figcaption className="public-ticket__caption">
          Long-press the image to save · Show this QR at the door
        </figcaption>
      </figure>
      <div className="cart-actions" style={{ marginTop: '1.25rem' }}>
        <a href={passSrc} className="btn" download={`sabagiro-ticket-${ticket.id.slice(-8)}.png`}>
          Download ticket
        </a>
        <Link href="/" className="btn btn--ghost">
          Home
        </Link>
      </div>
    </SiteChrome>
  );
}
