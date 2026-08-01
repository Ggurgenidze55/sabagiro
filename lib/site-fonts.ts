import localFont from 'next/font/local';

/** Eurostile — display / headings (Extended feel via CSS tracking). */
export const eurostile = localFont({
  src: [
    { path: '../public/fonts/Eurostile.otf', weight: '400', style: 'normal' },
    { path: '../public/fonts/Eurostile-Demi.otf', weight: '500', style: 'normal' },
    { path: '../public/fonts/Eurostile-Bold.otf', weight: '700', style: 'normal' },
  ],
  variable: '--font-display',
  display: 'swap',
  preload: true,
  adjustFontFallback: 'Arial',
  fallback: ['Eurostile Extended', 'Eurostile', 'system-ui', 'Segoe UI', 'sans-serif'],
});

/** BankGothic Medium — body / UI. */
export const bankGothic = localFont({
  src: [
    { path: '../public/fonts/BankGothic-Light.ttf', weight: '300', style: 'normal' },
    { path: '../public/fonts/BankGothic-Md.ttf', weight: '400', style: 'normal' },
  ],
  variable: '--font-mono',
  display: 'swap',
  preload: true,
  adjustFontFallback: 'Arial',
  fallback: ['BankGothic Md BT', 'Bank Gothic', 'ui-monospace', 'monospace'],
});

/** @deprecated Use eurostile — kept for any stray imports. */
export const bebasNeue = eurostile;
/** @deprecated Use bankGothic — kept for any stray imports. */
export const shareTechMono = bankGothic;
