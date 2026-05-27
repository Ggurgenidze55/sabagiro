import type { Ticket } from '@prisma/client';

type TicketEmailPayload = {
  to: string;
  ticket: Ticket;
  scanLink: string;
  qrImageDataUrl: string;
};

export async function sendTicketEmail(payload: TicketEmailPayload) {
  const { ticket, scanLink, qrImageDataUrl, to } = payload;
  const subject = `Sabagiro ticket — ${ticket.productName}`;
  const html = `
    <div style="font-family:monospace;background:#0a0a0a;color:#d4ccc4;padding:24px">
      <h1 style="color:#c8ff00;letter-spacing:0.2em">SABAGIRO</h1>
      <p>Your ticket for <strong>${ticket.productName}</strong> is ready.</p>
      <p>${ticket.holderFirstName} ${ticket.holderLastName} · ID ${ticket.holderPersonalId}</p>
      <p><a href="${scanLink}" style="color:#c8ff00">Open scan link</a></p>
      <img src="${qrImageDataUrl}" alt="Ticket QR" width="280" height="280" />
      <p style="opacity:0.6;font-size:12px">Show this QR at the door.</p>
    </div>
  `;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Sabagiro <tickets@sabagiro.ge>';

  if (apiKey) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[email] Resend failed', text);
    }
    return;
  }

  console.info('[email] RESEND_API_KEY not set — ticket email logged only');
  console.info({ to, subject, scanLink });
}
