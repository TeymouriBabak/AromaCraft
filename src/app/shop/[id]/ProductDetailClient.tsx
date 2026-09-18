'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bean, Droplets, Star, ChevronLeft } from 'lucide-react';
import type { Product } from '@/lib/shop-products';
import { useCart } from '@/components/cart-context';

interface ProductDetailClientProps {
  product: Product;
}

const SIZES = ['250g', '500g', '1kg'] as const;
const GRIND_OPTIONS = [
  'Whole Bean',
  'Cafetiere',
  'Filter',
  'Espresso',
] as const;
const FREQUENCIES = ['2 weeks', '4 weeks', '6 weeks'] as const;

export default function ProductDetailClient({
  product,
}: ProductDetailClientProps) {
  const [databaseReviews, setDatabaseReviews] = useState<Array<{ id: string; rating: number; content: string; author: string }>>([]);
  const [selectedSize, setSelectedSize] = useState<string>(product.size);
  const [selectedGrind, setSelectedGrind] = useState<string>(
    product.grindTypes[0] ?? 'Whole Bean'
  );
  const [selectedFrequency, setSelectedFrequency] = useState<string>(
    FREQUENCIES[0]
  );
  const { addItem, openCart } = useCart();

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/reviews?productId=${product.id}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok || body.ok === false) throw new Error('Unable to load product reviews');
        setDatabaseReviews(body.data?.reviews ?? []);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') setDatabaseReviews([]);
      });
    return () => controller.abort();
  }, [product.id]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <div className="mb-8 flex items-center gap-4 text-sm text-[#6e4b33]">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-full border border-[#d4a373]/20 bg-[#f9f6f0] px-4 py-2 text-[#1a0f0a] transition hover:bg-[#efe2d2]"
        >
          <ChevronLeft size={16} /> Back to shop
        </Link>
        <span className="rounded-full bg-[#f1e5d1] px-3 py-1">
          {product.brand}
        </span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-4xl border border-[#d4a373]/20 bg-[#f9f6f0] p-6 shadow-sm dark:bg-[#23110c]">
          <div className="rounded-3xl border border-[#d4a373]/20 bg-[#efe2d2] p-8 text-center">
            <div className="mx-auto flex h-72 w-48 items-center justify-center rounded-3xl border border-[#8c5e3d] bg-[#1a0f0a] text-[#f6e5d1] shadow-2xl">
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.3em]">
                  {product.country}
                </p>
                <p className="mt-3 font-serif text-2xl">{product.origin}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-[#d4a373]">
            {product.badge}
          </p>
          <h1 className="mt-3 font-serif text-4xl text-[#1a0f0a] dark:text-[#f6e5d1]">
            {product.name}
          </h1>
          <p className="mt-3 text-lg text-[#6e4b33] dark:text-[#e8d8c0]">
            {product.description}
          </p>
          <div className="mt-5 flex items-center gap-3 text-sm text-[#7a5b45]">
            <Star size={16} className="fill-[#d4a373] text-[#d4a373]" />
            <span>
              {product.rating} · {product.reviews} reviews
            </span>
          </div>
          <div className="mt-6 rounded-3xl border border-[#d4a373]/20 bg-white/70 p-5 dark:bg-[#23110c]">
            <div className="flex items-baseline justify-between">
              <p className="text-sm uppercase tracking-[0.3em] text-[#d4a373]">
                Price
              </p>
              <p className="font-serif text-3xl text-[#1a0f0a] dark:text-[#f6e5d1]">
                ${product.price}
              </p>
            </div>

            <div className="mt-6">
              <p className="font-semibold">Bag size</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-full border px-4 py-2 text-sm ${
                      selectedSize === size
                        ? 'border-[#e76f51] bg-[#e76f51] text-white'
                        : 'border-[#d4a373]/30 bg-[#f9f6f0] text-[#1a0f0a] dark:bg-[#1a0f0a]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="font-semibold">Grind</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {GRIND_OPTIONS.map((grind) => (
                  <button
                    key={grind}
                    type="button"
                    onClick={() => setSelectedGrind(grind)}
                    className={`rounded-full border px-4 py-2 text-sm ${
                      selectedGrind === grind
                        ? 'border-[#e76f51] bg-[#e76f51] text-white'
                        : 'border-[#d4a373]/30 bg-[#f9f6f0] text-[#1a0f0a] dark:bg-[#1a0f0a]'
                    }`}
                  >
                    {grind}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[1.25rem] border border-[#d4a373]/20 bg-[#f9f6f0] p-4 dark:bg-[#1a0f0a]">
              <div className="flex items-center justify-between">
                <label className="font-semibold">Subscribe & Save 15%</label>
                <input type="checkbox" className="h-4 w-4 accent-[#e76f51]" />
              </div>
              <div className="mt-3 flex gap-2">
                {FREQUENCIES.map((frequency) => (
                  <button
                    key={frequency}
                    type="button"
                    onClick={() => setSelectedFrequency(frequency)}
                    className={`rounded-full px-3 py-2 text-sm ${
                      selectedFrequency === frequency
                        ? 'bg-[#1a0f0a] text-white dark:bg-[#d4a373] dark:text-[#1a0f0a]'
                        : 'bg-white/70 text-[#1a0f0a] dark:bg-[#23110c]'
                    }`}
                  >
                    {frequency}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="mt-6 flex w-full items-center justify-center rounded-full bg-[#e76f51] px-4 py-3 font-semibold text-white"
              onClick={() => {
                addItem({
                  productId: product.id,
                  quantity: 1,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                  grindType: selectedGrind,
                  size: selectedSize,
                });
                openCart();
              }}
            >
              Add to Cart <ArrowRight className="ml-2" size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-4xl border border-[#d4a373]/20 bg-white/70 p-6 shadow-sm dark:bg-[#23110c]">
          <div className="flex items-center gap-2 text-[#1a0f0a] dark:text-[#f6e5d1]">
            <Bean size={18} />
            <h2 className="font-semibold">Tasting Notes</h2>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {product.tastingNotes.map((note) => (
              <span
                key={note}
                className="rounded-full border border-[#d4a373]/30 bg-[#f9f6f0] px-3 py-2 text-sm dark:bg-[#1a0f0a]"
              >
                {note}
              </span>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-2 text-[#1a0f0a] dark:text-[#f6e5d1]">
            <Droplets size={16} />
            <h2 className="font-semibold">Brewing Guide</h2>
          </div>
          <ol className="mt-4 space-y-3 text-sm text-[#6e4b33] dark:text-[#e8d8c0]">
            <li>1. Heat water to 92°C and use a 1:16 ratio.</li>
            <li>2. Bloom for 30 seconds, then pour in stages.</li>
            <li>
              3. Finish around 2:30–3:00 minutes for clarity and sweetness.
            </li>
          </ol>
        </div>

        <div className="rounded-4xl border border-[#d4a373]/20 bg-[#f9f6f0] p-6 shadow-sm dark:bg-[#23110c]">
          <h2 className="font-serif text-2xl text-[#1a0f0a] dark:text-[#f6e5d1]">
            Reviews
          </h2>
          <div className="mt-5 space-y-4">
            {databaseReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-[1.25rem] border border-[#d4a373]/20 bg-white/80 p-4 dark:bg-[#1a0f0a]"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{review.author}</p>
                  <div className="flex gap-1 text-[#d4a373]">
                    {Array.from({ length: review.rating }).map((_, idx) => (
                      <Star key={idx} size={14} fill="currentColor" />
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-sm text-[#6e4b33] dark:text-[#e8d8c0]">
                  {review.content}
                </p>
              </div>
            ))}
            {databaseReviews.length === 0 && (
              <p className="text-sm text-[#6e4b33] dark:text-[#e8d8c0]">No approved reviews yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
