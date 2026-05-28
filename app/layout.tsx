import type { Metadata } from 'next';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sabagiro — Underground · Tbilisi',
  description: 'Sabagiro — brutalist underground club. Tickets, merch, events. Tbilisi, Georgia.',
  icons: {
    icon: '/club/sabagiro-logo-white.png',
    shortcut: '/club/sabagiro-logo-white.png',
    apple: '/club/sabagiro-logo-white.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
