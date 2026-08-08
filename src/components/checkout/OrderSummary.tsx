"use client";

import { useCart } from "@/components/cart-context";

export default function OrderSummary() {
  const { items, subtotal, shipping, total } = useCart();

  return (
    <aside className="sticky top-20 rounded-4xl border border-[#d4a373]/20 bg-[#f9f6f0] p-6 shadow-sm dark:bg-[#23110c]">
      <h2 className="font-serif text-2xl text-[#1a0f0a] dark:text-[#f6e5d1]">Order summary</h2>
      <div className="mt-4 space-y-3 text-sm text-[#6e4b33] dark:text-[#e8d8c0]">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-xs opacity-80">{item.quantity} × ${item.price.toFixed(2)}</div>
            </div>
            <div className="font-semibold">${(item.price * item.quantity).toFixed(2)}</div>
          </div>
        ))}
        <div className="border-t pt-3">
          <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>${shipping.toFixed(2)}</span></div>
          <div className="mt-2 flex justify-between font-semibold text-[#1a0f0a] dark:text-[#f6e5d1]"><span>Total</span><span>${total.toFixed(2)}</span></div>
        </div>
      </div>
      <p className="mt-4 text-sm text-[#7a5b45] dark:text-[#d9c2a4]">{items.length ? `${items.length} item${items.length === 1 ? "" : "s"} in your cart.` : "Add products from the shop to proceed."}</p>
    </aside>
  );
}
