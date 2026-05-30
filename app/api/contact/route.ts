import { NextResponse } from 'next/server';
import { isEmailConfigured } from '@/lib/email/config';
import { sendContactFormAck, sendContactFormNotification } from '@/lib/email/send';
import { getContactInboxEmails } from '@/lib/contact-inbox';
import { contactFormSchema, formatValidationError } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const body = contactFormSchema.parse(await request.json());

    if (body.company?.trim()) {
      return NextResponse.json({ ok: true });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        {
          error:
            'Contact form is temporarily unavailable. Email us directly at info@sabagiro.ge',
        },
        { status: 503 },
      );
    }

    const result = await sendContactFormNotification({
      name: body.name,
      email: body.email,
      topic: body.topic,
      message: body.message,
    });

    if (!result.sent) {
      console.error('[contact] Resend failed', result.error);
      return NextResponse.json(
        {
          error:
            result.error ||
            'Could not send message. Email info@sabagiro.ge or info.sabagiro@gmail.com directly.',
        },
        { status: 502 },
      );
    }

    void sendContactFormAck({ to: body.email, name: body.name }).then((ack) => {
      if (!ack.sent) {
        console.warn('[contact] auto-reply failed', ack.error);
      }
    });

    const inboxes = getContactInboxEmails();
    return NextResponse.json({
      ok: true,
      inboxes,
      id: result.id,
      hint: 'Check inbox and spam. A copy was sent to your email too.',
    });
  } catch (e) {
    return NextResponse.json({ error: formatValidationError(e) }, { status: 400 });
  }
}
