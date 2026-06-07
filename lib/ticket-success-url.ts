export function ticketSuccessUrl(opts: {
  source: 'free' | 'purchase';
  slug?: string;
  orderId?: string;
}) {
  const params = new URLSearchParams({ source: opts.source });
  if (opts.slug) params.set('slug', opts.slug);
  if (opts.orderId) params.set('orderId', opts.orderId);
  return `/account/ticket-success?${params.toString()}`;
}
