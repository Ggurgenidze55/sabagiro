import localFont from 'next/font/local';

/** Self-hosted — same files as /public/fonts/ (homepage + app). */
export const bebasNeue = localFont({
  src: '../public/fonts/BebasNeue-Regular.ttf',
  weight: '400',
  variable: '--font-display',
  display: 'swap',
  preload: true,
  adjustFontFallback: 'Arial',
  fallback: ['system-ui', 'Segoe UI', 'sans-serif'],
});

export const shareTechMono = localFont({
  src: '../public/fonts/ShareTechMono-Regular.ttf',
  weight: '400',
  variable: '--font-mono',
  display: 'swap',
  preload: true,
  adjustFontFallback: 'Arial',
  fallback: ['ui-monospace', 'SFMono-Regular', 'monospace'],
});
