import { products } from "@/data/products-multi-brand";
import ProductDetailClient from "./ProductDetailClient";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const productId = Number(params.id);
  const product = products.find((item) => item.id === productId) ?? products[0];

  return <ProductDetailClient product={product} />;
}
