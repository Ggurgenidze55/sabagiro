import type { Role, VerificationStatus } from '@prisma/client';
import { canPurchaseTickets } from '@/lib/verification';

export type TicketAccessUser = {
  role: Role;
  verificationStatus: VerificationStatus;
} | null;

export type TicketAccessNotice = {
  message: string;
  hint?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function showCartInNav(user: TicketAccessUser): boolean {
  if (!user) return false;
  return canPurchaseTickets(user);
}

export function getTicketAccessNotice(user: TicketAccessUser): TicketAccessNotice | null {
  if (!user) {
    return {
      message: 'ბილეთის ყიდვისთვის საჭიროა რეგისტრაცია და შესვლა.',
      hint: 'შექმენი ანგარიში, შემდეგ გაიარე ადმინისტრაციის ვერიფიკაცია.',
      primaryHref: '/register',
      primaryLabel: 'რეგისტრაცია',
      secondaryHref: '/login',
      secondaryLabel: 'შესვლა',
    };
  }

  if (!canPurchaseTickets(user)) {
    if (user.verificationStatus === 'REJECTED') {
      return {
        message: 'ბილეთის ყიდვა შეუძლებელია — ანგარიში ვერ დადასტურდა.',
        hint: 'განაახლე Facebook და Instagram ბმულები, შემდეგ დაგვიკავშირდი.',
        primaryHref: '/account/settings',
        primaryLabel: 'პარამეტრები',
        secondaryHref: '/contact',
        secondaryLabel: 'კონტაქტი',
      };
    }

    return {
      message: 'ბილეთის ყიდვისთვის საჭიროა ვერიფიკაცია.',
      hint: 'შენ უკვე შეხვედი სისტემაში — ველოდებით ადმინისტრატორის დადასტურებას.',
      primaryHref: '/account',
      primaryLabel: 'ანგარიში',
      secondaryHref: '/account/settings',
      secondaryLabel: 'პარამეტრები',
    };
  }

  return null;
}

export function getAddToCartLabel(user: TicketAccessUser): string | undefined {
  if (!user) return 'საჭიროა რეგისტრაცია';
  if (!canPurchaseTickets(user)) return 'საჭიროა ვერიფიკაცია';
  return undefined;
}
