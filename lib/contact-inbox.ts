import type { ContactTopic } from '@/lib/contact-topic';

/** Inboxes that receive contact form submissions (comma-separated in env). */
export function getContactInboxEmails(): string[] {
  const raw =
    process.env.CONTACT_INBOX_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    'info@sabagiro.ge,info.sabagiro@gmail.com';

  const emails = raw
    .split(/[,;]/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.includes('@'));

  return [...new Set(emails)];
}

export function getContactInboxEmail(): string {
  return getContactInboxEmails()[0] ?? 'info@sabagiro.ge';
}

const TOPIC_INBOX_ENV: Record<ContactTopic, string> = {
  tickets: 'CONTACT_INBOX_TICKETS',
  events: 'CONTACT_INBOX_EVENTS',
  press: 'CONTACT_INBOX_PRESS',
  other: 'CONTACT_INBOX_OTHER',
};

/** Per-topic override (optional); always falls back to shared inbox list. */
export function getContactInboxEmailsForTopic(topic: ContactTopic): string[] {
  const envKey = TOPIC_INBOX_ENV[topic];
  const specific = process.env[envKey]?.trim();
  if (specific) {
    const parsed = specific
      .split(/[,;]/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.includes('@'));
    if (parsed.length) return [...new Set(parsed)];
  }
  return getContactInboxEmails();
}
