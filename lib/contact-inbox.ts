/** Where contact form messages are delivered (Resend). */
export function getContactInboxEmail(): string {
  return (
    process.env.CONTACT_INBOX_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    'info@sabagiro.ge'
  );
}
