import QuizClient from './QuizClient';
import { getShopProducts } from '@/lib/shop-products';

export const dynamic = 'force-dynamic';

export default async function QuizPage() {
  const products = await getShopProducts();
  return <QuizClient products={products} />;
}
