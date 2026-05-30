import { NextResponse } from 'next/server';
import type { ContactTopic } from '@/lib/contact-topic';
import { contactTopicLabel } from '@/lib/contact-topic';
import { getContactInboxEmailsForTopic } from '@/lib/contact-inbox';
import { dispatchEmail } from '@/lib/email/dispatch';
import { isEmailConfigured } from '@/lib/email/config';
import { sendContactFormAck, sendContactFormNotification } from '@/lib/email/send';
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

    const topic = body.topic as ContactTopic;
    const inboxes = getContactInboxEmailsForTopic(topic);

    const notify = await dispatchEmail(
      `contact:notify:${topic}`,
      () =>
        sendContactFormNotification({
          name: body.name,
          email: body.email,
          topic,
          message: body.message,
        }),
      { required: true },
    );

    const ack = await dispatchEmail(`contact:ack:${topic}`, () =>
      sendContactFormAck({ to: body.email, name: body.name }),
    );

    return NextResponse.json({
      ok: true,
      topic,
      topicLabel: contactTopicLabel(topic),
      inboxes,
      notify,
      ack,
      hint: 'Check inbox and spam. A copy was sent to your email too.',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (message === 'EMAIL_NOT_SENT') {
      return NextResponse.json(
        {
          error:
            'Could not send message. Email info@sabagiro.ge or info.sabagiro@gmail.com directly.',
        },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: formatValidationError(e) }, { status: 400 });
  }
}
