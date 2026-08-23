import AboutClient from './AboutClient';
import { getShopProducts } from '@/lib/shop-products';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const shopProducts = await getShopProducts();
  return <AboutClient shopProducts={shopProducts} />;
}
