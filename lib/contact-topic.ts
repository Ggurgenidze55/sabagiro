export const CONTACT_TOPICS = ['tickets', 'events', 'press', 'other'] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

const TOPIC_LABELS: Record<ContactTopic, string> = {
  tickets: 'Tickets & orders',
  events: 'Events & lineup',
  press: 'Press & partnerships',
  other: 'Other',
};

const LABEL_TO_TOPIC: Record<string, ContactTopic> = {
  tickets: 'tickets',
  'tickets & orders': 'tickets',
  events: 'events',
  'events & lineup': 'events',
  press: 'press',
  'press & partnerships': 'press',
  other: 'other',
};

/** Map form value or accidental label text to a valid topic id. */
export function normalizeContactTopic(raw: unknown): ContactTopic {
  const key = String(raw ?? '')
    .trim()
    .toLowerCase();
  return LABEL_TO_TOPIC[key] ?? 'other';
}

export function contactTopicLabel(topic: ContactTopic): string {
  return TOPIC_LABELS[topic];
}
