import {
  COMPANY_BRAND,
  COMPANY_EMAIL,
  COMPANY_LEGAL_NAME_EN,
  COMPANY_LEGAL_NAME_KA,
  getCompanyIdentificationCode,
  getCompanyLegalAddress,
  getCompanyPhone,
} from '@/lib/company';

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export function buildTermsSections(): LegalSection[] {
  const idCode = getCompanyIdentificationCode();
  const phone = getCompanyPhone();
  const address = getCompanyLegalAddress();

  return [
    {
      title: '1. Operator',
      paragraphs: [
        `${COMPANY_BRAND} online ticket sales and related services on sabagiro.ge are operated by ${COMPANY_LEGAL_NAME_KA} (${COMPANY_LEGAL_NAME_EN}).`,
        idCode
          ? `Identification code (საიდენტიფიკაციო კოდი): ${idCode}.`
          : 'Identification code (საიდენტიფიკაციო კოდი): published on the Contact page / merchant profile once issued.',
        `Registered / service address: ${address}.`,
        `Email: ${COMPANY_EMAIL}.${phone ? ` Phone: ${phone}.` : ''}`,
      ],
    },
    {
      title: '2. Products',
      paragraphs: [
        'The products offered on this website are digital event tickets (and, where shown, related digital passes) priced in Georgian Lari (GEL / ₾).',
        'Each event page lists the event name, description, date/time information where available, and the ticket price in GEL before you pay.',
      ],
    },
    {
      title: '3. Delivery of the product',
      paragraphs: [
        'Tickets are digital goods. After successful payment you receive:',
      ],
      bullets: [
        'Immediate access to your ticket(s) in your Sabagiro account (QR / ticket pass).',
        'A confirmation email to the address on your account (and holder email where applicable), including ticket details and QR where configured.',
        'Optional wallet passes (Apple Wallet / Google Wallet) when enabled for your device.',
      ],
    },
    {
      title: '4. Payment',
      paragraphs: [
        'Card payments are processed by Flitt (Visa / Mastercard and other methods enabled for the merchant). Prices are charged in GEL.',
        'Tickets are issued only after the payment provider confirms a successful live charge.',
      ],
    },
    {
      title: '5. Refunds and cancellation',
      paragraphs: [
        'Digital tickets are generally non-refundable once issued, except where required by Georgian law or where Sabagiro cancels or materially relocates the event.',
        'If an event is cancelled by Sabagiro, we will offer a refund of the ticket price paid (to the original payment method where possible) or an alternative remedy communicated by email.',
        'Chargebacks and payment disputes are handled with the payment provider and your bank. Contact us first at the email below so we can help.',
        `Refund and ticket support: ${COMPANY_EMAIL}. Response within 1–3 business days.`,
      ],
    },
    {
      title: '6. Entry and use',
      paragraphs: [
        'A valid Sabagiro ticket (QR) is required for entry. Tickets are personal where holder details are collected and may be checked at the door.',
        'Club house rules (/rules) also apply on site. Sabagiro may refuse entry for safety or policy reasons without affecting statutory consumer rights where they apply.',
      ],
    },
    {
      title: '7. Contact',
      paragraphs: [
        `Questions about orders, delivery, or refunds: ${COMPANY_EMAIL}${phone ? ` · ${phone}` : ''}.`,
        `Address: ${address}.`,
      ],
    },
  ];
}
