export type CartLine = {
  slug: string;
  name: string;
  priceGel: number;
  qty: number;
  accent: string;
  type: 'ticket' | 'merch';
};

export const CART_STORAGE_KEY = 'sabagiro-cart-v1';

export function readCart(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sabagiro-cart-change'));
  }
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.priceGel * line.qty, 0);
}
