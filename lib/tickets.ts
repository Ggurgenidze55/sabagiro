import { randomBytes } from 'node:crypto';
import type { TicketSource, User } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getProduct } from '@/lib/products';
import { sendTicketEmail } from '@/lib/email/index';
import { qrDataUrl, scanUrl } from '@/lib/qr';

export { scanUrl, qrDataUrl };

function newQrToken() {
  return randomBytes(16).toString('hex');
}

type Holder = {
  firstName: string;
  lastName: string;
  personalId: string;
  email: string;
  phone: string;
};

export async function createTicketForUser(opts: {
  user: User;
  productSlug: string;
  source: TicketSource;
  holder?: Holder;
  priceGel?: number;
  tierLabel?: string;
  createdByUserId?: string;
}) {
  const product = await getProduct(opts.productSlug);
  if (!product || product.type !== 'ticket') {
    throw new Error('INVALID_PRODUCT');
  }

  const holder = opts.holder ?? {
    firstName: opts.user.firstName,
    lastName: opts.user.lastName,
    personalId: opts.user.personalId,
    email: opts.user.email,
    phone: opts.user.phone,
  };

  const ticket = await prisma.ticket.create({
    data: {
      qrToken: newQrToken(),
      userId: opts.user.id,
      createdByUserId: opts.createdByUserId ?? opts.user.id,
      productSlug: product.slug,
      productName: product.name,
      eventDate: product.eventDate ?? null,
      priceGel: opts.priceGel ?? product.priceGel,
      tierLabel: opts.tierLabel ?? '',
      holderFirstName: holder.firstName,
      holderLastName: holder.lastName,
      holderPersonalId: holder.personalId,
      holderEmail: holder.email,
      holderPhone: holder.phone,
      source: opts.source,
    },
  });

  const qrImage = await qrDataUrl(ticket.qrToken);
  await sendTicketEmail({
    to: holder.email,
    ticket,
    scanLink: scanUrl(ticket.qrToken),
    qrImageDataUrl: qrImage,
  });

  return ticket;
}

export async function createFreeTicketForVerifiedUser(opts: {
  owner: User;
  productSlug: string;
  holder: Holder;
}) {
  if (!opts.owner.freeTicketsEnabled) {
    throw new Error('NO_FREE_TICKETS');
  }

  return prisma.$transaction(async (tx) => {
    const usedForEvent = await tx.ticket.count({
      where: {
        userId: opts.owner.id,
        productSlug: opts.productSlug,
        source: 'FREE',
        status: { not: 'CANCELLED' },
      },
    });

    if (usedForEvent >= opts.owner.freeTicketsQuota) {
      throw new Error('NO_FREE_TICKETS');
    }

    await tx.user.update({
      where: {
        id: opts.owner.id,
      },
      data: { freeTicketsUsed: { increment: 1 } },
    });

    const product = await getProduct(opts.productSlug);
    if (!product || product.type !== 'ticket') throw new Error('INVALID_PRODUCT');

    const ticket = await tx.ticket.create({
      data: {
        qrToken: newQrToken(),
        userId: opts.owner.id,
        createdByUserId: opts.owner.id,
        productSlug: product.slug,
        productName: product.name,
        eventDate: product.eventDate ?? null,
        priceGel: 0,
        tierLabel: 'Free',
        holderFirstName: opts.holder.firstName,
        holderLastName: opts.holder.lastName,
        holderPersonalId: opts.holder.personalId,
        holderEmail: opts.holder.email,
        holderPhone: opts.holder.phone,
        source: 'FREE',
      },
    });

    const qrImage = await qrDataUrl(ticket.qrToken);
    await sendTicketEmail({
      to: opts.holder.email,
      ticket,
      scanLink: scanUrl(ticket.qrToken),
      qrImageDataUrl: qrImage,
    });

    return ticket;
  });
}

export async function findOrCreateUserForAdmin(input: Holder & { role?: 'USER' }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) return existing;

  const { hashPassword } = await import('@/lib/auth');
  const tempPassword = randomBytes(12).toString('base64url');
  return prisma.user.create({
    data: {
      email: input.email,
      phone: input.phone,
      firstName: input.firstName,
      lastName: input.lastName,
      personalId: input.personalId,
      passwordHash: await hashPassword(tempPassword),
      role: 'USER',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      facebookUrl: '',
      instagramUrl: '',
    },
  });
}
