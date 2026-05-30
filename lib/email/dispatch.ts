import type { SendEmailResult } from '@/lib/email/client';

export type EmailDispatchMeta = {
  sent: boolean;
  skipped?: boolean;
  error?: string;
  id?: string;
};

export function toEmailDispatchMeta(result: SendEmailResult): EmailDispatchMeta {
  return {
    sent: result.sent,
    skipped: result.skipped,
    error: result.error,
    id: result.id,
  };
}

/** Log failures; optionally fail the HTTP handler when email is required. */
export async function dispatchEmail(
  context: string,
  send: () => Promise<SendEmailResult>,
  opts?: { required?: boolean },
): Promise<EmailDispatchMeta> {
  const result = await send();
  const meta = toEmailDispatchMeta(result);

  if (!meta.sent) {
    console.error(`[email] ${context}`, meta);
    if (opts?.required) {
      const err = new Error('EMAIL_NOT_SENT');
      (err as Error & { cause?: string }).cause = meta.error;
      throw err;
    }
  }

  return meta;
}
