import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sabagiro — Underground · Tbilisi',
  description: 'Sabagiro — brutalist underground club. Tickets, merch, events. Tbilisi, Georgia.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
