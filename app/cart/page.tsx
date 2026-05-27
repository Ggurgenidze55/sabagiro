import { CartView } from '@/components/CartView';
import { SiteChrome } from '@/components/SiteChrome';

export const metadata = {
  title: 'Cart — Sabagiro',
};

export default function CartPage() {
  return (
    <SiteChrome current="cart">
      <h1 className="page-title">CART</h1>
      <p className="page-lead">Review before checkout</p>
      <CartView />
    </SiteChrome>
  );
}
