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
