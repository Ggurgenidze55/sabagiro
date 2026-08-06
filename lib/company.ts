/** Legal entity + public contact (Flitt / card-scheme compliance). */

export const COMPANY_LEGAL_NAME_KA = 'შპს საბაგირო ჯგუფი';
export const COMPANY_LEGAL_NAME_EN = 'Sabagiro Group LLC';
export const COMPANY_BRAND = 'Sabagiro';

/** Georgian identification code — set COMPANY_IDENTIFICATION_CODE on Vercel if different. */
export function getCompanyIdentificationCode(): string {
  return (
    process.env.COMPANY_IDENTIFICATION_CODE?.trim() ||
    process.env.NEXT_PUBLIC_COMPANY_IDENTIFICATION_CODE?.trim() ||
    ''
  );
}

export function getCompanyPhone(): string {
  return (
    process.env.COMPANY_PHONE?.trim() ||
    process.env.NEXT_PUBLIC_COMPANY_PHONE?.trim() ||
    ''
  );
}

export function getCompanyPhoneHref(): string | null {
  const phone = getCompanyPhone();
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
}

export const COMPANY_EMAIL = 'info@sabagiro.ge';

/** Venue / service address (cable car station, Lisi). */
export const COMPANY_VENUE_ADDRESS_KA =
  'ლეო კვაჭაძის ქუჩა, ლისი, საბურთალოს რაიონი, თბილისი 0176, საქართველო';
export const COMPANY_VENUE_ADDRESS_EN =
  'Leo Kvachadze St, Lisi, Saburtalo, Tbilisi 0176, Georgia';

/** Legal / correspondence address — same as venue unless COMPANY_LEGAL_ADDRESS is set. */
export function getCompanyLegalAddress(): string {
  return (
    process.env.COMPANY_LEGAL_ADDRESS?.trim() ||
    process.env.NEXT_PUBLIC_COMPANY_LEGAL_ADDRESS?.trim() ||
    COMPANY_VENUE_ADDRESS_EN
  );
}

export function getCompanyLegalAddressKa(): string {
  return (
    process.env.COMPANY_LEGAL_ADDRESS_KA?.trim() ||
    COMPANY_VENUE_ADDRESS_KA
  );
}
