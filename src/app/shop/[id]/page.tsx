import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';
import { getShopProduct } from '@/lib/shop-products';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  const product = Number.isInteger(productId)
    ? await getShopProduct(productId)
    : null;

  if (!product) notFound();

  return <ProductDetailClient product={product} />;
}
