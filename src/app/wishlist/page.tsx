"use client";

import Link from "next/link";
import { useMemo } from "react";
import { X } from "lucide-react";
import { useWishlist } from "@/components/wishlist-context";
import { products } from "@/data/products-multi-brand";

export default function WishlistPage() {
  const { itemIds, removeFromWishlist } = useWishlist();
  const wishlistItems = useMemo(
    () => products.filter((product) => itemIds.includes(product.id)),
    [itemIds],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 rounded-4xl border border-[#d4a373]/20 bg-[#f9f6f0] p-8 shadow-sm dark:bg-[#23110c]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-[#b56e3b]">Wishlist</p>
            <h1 className="mt-2 font-serif text-3xl text-[#1a0f0a] dark:text-[#f6e5d1]">Saved roasts for later</h1>
          </div>
          <Link href="/shop" className="inline-flex items-center rounded-full border border-[#d6b07a]/35 bg-[#fbf7f2]/90 px-4 py-2 text-sm font-semibold text-[#2b1d17] transition hover:-translate-y-0.5 hover:border-[#b56e3b] hover:bg-[#fffaf3] dark:bg-[#1f130d] dark:text-[#f6e5d1]">
            Browse roasts
          </Link>
        </div>
        <p className="text-sm text-[#6e4b33] dark:text-[#e8d8c0]">Keep your favorites in one place and add them to your cart when you are ready to brew.</p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="rounded-4xl border border-[#d4a373]/20 bg-[#fffaf3] p-8 text-center text-[#6e4b33] shadow-sm dark:bg-[#23110c] dark:text-[#e8d8c0]">
          <p className="text-lg font-semibold text-[#1a0f0a] dark:text-[#f6e5d1]">Your wishlist is empty.</p>
          <p className="mt-3">Save roasts while you shop and they will appear here for easy access.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {wishlistItems.map((product) => (
            <div key={product.id} className="rounded-[1.75rem] border border-[#d6b07a]/25 bg-[#fbf7f2]/90 p-5 shadow-sm dark:bg-[#23110c]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[#b56e3b]">{product.brand}</p>
                  <h2 className="mt-2 text-xl font-semibold text-[#1a0f0a] dark:text-[#f6e5d1]">{product.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromWishlist(product.id)}
                  className="rounded-full border border-[#d4a373]/30 bg-white/90 p-2 text-[#1a0f0a] transition hover:bg-[#efe2d2]"
                  aria-label={`Remove ${product.name} from wishlist`}
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm leading-7 text-[#6e4b33] dark:text-[#e8d8c0]">{product.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm text-[#6e4b33] dark:text-[#e8d8c0]">
                <span>${product.price.toFixed(2)}</span>
                <Link href={`/shop/${product.id}`} className="rounded-full bg-[#e76f51] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#c9854d]">
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
