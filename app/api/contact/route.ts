import { NextResponse } from 'next/server';
import { isEmailConfigured } from '@/lib/email/config';
import { sendContactFormNotification } from '@/lib/email/send';
import { getContactInboxEmail } from '@/lib/contact-inbox';
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
      return NextResponse.json(
        { error: result.error || 'Could not send message. Try info@sabagiro.ge' },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, inbox: getContactInboxEmail() });
  } catch (e) {
    return NextResponse.json({ error: formatValidationError(e) }, { status: 400 });
  }
}
