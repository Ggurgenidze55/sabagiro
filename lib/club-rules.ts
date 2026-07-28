export type ClubRule = {
  title: string;
  body: string;
};

export const CLUB_RULES: readonly ClubRule[] = [
  {
    title: 'Respect',
    body: 'Respect people, nature, art, and the space itself. Harassment, discrimination, and aggressive behavior have no place here.',
  },
  {
    title: 'Community',
    body: 'This space is built by and for its community. Look after one another, be kind, and contribute positively to the atmosphere.',
  },
  {
    title: 'Expression',
    body: 'Creativity, individuality, and self-expression are encouraged. Respect the freedom of others to express themselves as well.',
  },
  {
    title: 'Responsibility',
    body: 'Take responsibility for your actions. Leave the space better than you found it and help preserve it for future visitors.',
  },
  {
    title: 'Leave No Trace',
    body: 'Dispose of waste properly, respect the environment, and minimize your impact on the surrounding nature.',
  },
  {
    title: 'Safety',
    body: 'Your safety and the safety of others matter. Act responsibly and help create a secure environment for everyone.',
  },
  {
    title: 'Respect the Art',
    body: 'Art is an essential part of this space. Do not damage, remove, or alter artworks without permission.',
  },
  {
    title: 'Inclusivity',
    body: 'Everyone is welcome. We celebrate diversity and maintain a zero-tolerance policy toward hate, discrimination, or exclusion.',
  },
  {
    title: 'Freedom with Respect',
    body: 'Enjoy the freedom to be yourself, while respecting the rights, boundaries, and experiences of others.',
  },
] as const;

/** Shown to verified members — email + rules page. */
export const VERIFICATION_REVOCATION_NOTICE =
  'SABAGIRO RESERVES THE RIGHT TO REVOKE YOUR VERIFICATION WITHOUT EXPLANATION IF YOU ARE FOUND IN VIOLATION OF ANY OF THESE RULES.';

export const CLUB_RULES_ENFORCEMENT =
  'The management of the space reserves the right to take appropriate action in response to any violation of these guidelines. Such actions may include immediate removal from the premises, permanent exclusion from future events and activities, and, where applicable, referral to the relevant authorities.';
