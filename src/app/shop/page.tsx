import { Suspense } from 'react';
import ShopClient from './ShopClient';
import { getShopProducts } from '@/lib/shop-products';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const products = await getShopProducts();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-8 text-center text-sm text-[#6e4b33]">
          Loading shop…
        </div>
      }
    >
      <ShopClient products={products} />
    </Suspense>
  );
}
