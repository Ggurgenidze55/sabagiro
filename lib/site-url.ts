function readEnv(name: string, fallback = ''): string {
  const v = process.env[name];
  return v !== undefined && v !== '' ? v : fallback;
}

export function getSiteBaseUrl(): string {
  const fromEnv =
    readEnv('SABAGIRO_PUBLIC_URL') ||
    readEnv('APP_URL') ||
    readEnv('NEXT_PUBLIC_APP_URL') ||
    readEnv('VERCEL_URL', '');
  if (!fromEnv) return 'http://localhost:3001';
  if (fromEnv.startsWith('http')) return fromEnv.replace(/\/$/, '');
  return `https://${fromEnv.replace(/\/$/, '')}`;
}

export function siteUrl(path: string): string {
  const base = getSiteBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
