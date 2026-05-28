export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = {
  sent: boolean;
  skipped?: boolean;
  error?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Sabagiro <tickets@sabagiro.ge>';

  if (!apiKey) {
    console.info('[email] RESEND_API_KEY not set — logged only', {
      to: input.to,
      subject: input.subject,
    });
    return { sent: false, skipped: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[email] Resend failed', res.status, text);
      return { sent: false, error: text };
    }

    return { sent: true };
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
