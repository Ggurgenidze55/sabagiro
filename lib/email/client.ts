import { Resend } from 'resend';
import { getEmailFrom, isEmailConfigured } from '@/lib/email/config';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
    inlineContentId?: string;
  }>;
};

export type SendEmailResult = {
  sent: boolean;
  skipped?: boolean;
  id?: string;
  error?: string;
};

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const client = getResend();
  const from = getEmailFrom();

  if (!client) {
    console.info('[email] RESEND_API_KEY not set — logged only', {
      to: input.to,
      subject: input.subject,
    });
    return { sent: false, skipped: true };
  }

  try {
    const { data, error } = await client.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: input.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
        inlineContentId: a.inlineContentId,
      })),
    });

    if (error) {
      console.error('[email] Resend failed', error);
      return { sent: false, error: error.message || 'Send failed' };
    }

    return { sent: true, id: data?.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Send failed';
    console.error('[email]', message);
    return { sent: false, error: message };
  }
}

/** Fire-and-forget — never block HTTP handlers on email. */
export function sendEmailAsync(input: SendEmailInput): void {
  void sendEmail(input).catch((e) => {
    console.error('[email] async send failed', e);
  });
}

export { getEmailFrom, isEmailConfigured };
