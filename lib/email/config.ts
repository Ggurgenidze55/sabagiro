/** Resend sender — must match a verified domain in Resend dashboard. */
export function getEmailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || 'Sabagiro <tickets@sabagiro.ge>';
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
