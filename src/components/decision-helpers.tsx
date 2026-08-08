"use client";

import type { Product } from "@/data/products-multi-brand";

export function DecisionHelper({ product }: { product: Product }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
      <div className="flex flex-col items-center rounded-lg bg-[#f9f6f0] p-2 dark:bg-[#1a0f0a]">
        <span className="text-[10px] text-[#9a7c6b]">Roast</span>
        <div className="mt-1 text-sm font-semibold text-[#1a0f0a]">{product.roast}</div>
      </div>
      <div className="flex flex-col items-center rounded-lg bg-[#f9f6f0] p-2 dark:bg-[#1a0f0a]">
        <span className="text-[10px] text-[#9a7c6b]">Body</span>
        <div className="mt-1 text-sm font-semibold text-[#1a0f0a]">{product.body}</div>
      </div>
      <div className="flex flex-col items-center rounded-lg bg-[#f9f6f0] p-2 dark:bg-[#1a0f0a]">
        <span className="text-[10px] text-[#9a7c6b]">Acidity</span>
        <div className="mt-1 text-sm font-semibold text-[#1a0f0a]">{product.acidity}</div>
      </div>
    </div>
  );
}
