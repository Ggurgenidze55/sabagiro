import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import type { Ticket, TicketSource, User } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { getProduct } from '@/lib/products';
import type { SendEmailResult } from '@/lib/email/client';
import { sendTicketEmail } from '@/lib/email/index';
import { qrDataUrl, scanUrl } from '@/lib/qr';
import { getVerifiedMemberFreeLimit } from '@/lib/free-entry-access';

export { scanUrl, qrDataUrl };

function invalidateAccountPage() {
  revalidatePath('/account');
}

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

  const emailResult = await sendTicketEmail({
    to: holder.email,
    ticket,
    scanLink: scanUrl(ticket.qrToken),
  });

  if (!emailResult.sent) {
    console.error('[ticket] email not sent', {
      ticketId: ticket.id,
      to: holder.email,
      error: emailResult.error,
      skipped: emailResult.skipped,
    });
  }

  invalidateAccountPage();
  return { ticket, email: emailResult };
}

export async function createFreeTicketForVerifiedUser(opts: {
  owner: User;
  productSlug: string;
  holder: Holder;
}) {
  const product = await getProduct(opts.productSlug);
  if (!product || product.type !== 'ticket') {
    throw new Error('INVALID_PRODUCT');
  }

  const isAllVerifiedFree =
    Boolean(product.isFreeEntry) && product.freeEntryAccess === 'ALL_VERIFIED';

  if (!isAllVerifiedFree && !opts.owner.freeTicketsEnabled) {
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

    const limit = isAllVerifiedFree
      ? getVerifiedMemberFreeLimit(opts.owner)
      : opts.owner.freeTicketsQuota;
    if (usedForEvent >= limit) {
      throw new Error('NO_FREE_TICKETS');
    }

    if (!isAllVerifiedFree) {
      await tx.user.update({
        where: {
          id: opts.owner.id,
        },
        data: { freeTicketsUsed: { increment: 1 } },
      });
    }

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

    invalidateAccountPage();
    return ticket;
  });
}

export async function deliverTicketEmail(ticket: Ticket): Promise<SendEmailResult> {
  const result = await sendTicketEmail({
    to: ticket.holderEmail,
    ticket,
    scanLink: scanUrl(ticket.qrToken),
  });
  if (!result.sent) {
    console.error('[ticket] deliver email failed', {
      ticketId: ticket.id,
      to: ticket.holderEmail,
      error: result.error,
    });
  }
  return result;
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
