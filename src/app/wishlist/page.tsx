import WishlistClient from './WishlistClient';
import { getShopProducts } from '@/lib/shop-products';

export const dynamic = 'force-dynamic';

export default async function WishlistPage() {
  const products = await getShopProducts();
  return <WishlistClient products={products} />;
}
