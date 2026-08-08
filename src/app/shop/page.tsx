import { Suspense } from "react";
import ShopClient from "./ShopClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8 text-center text-sm text-[#6e4b33]">Loading shop…</div>}>
      <ShopClient />
    </Suspense>
  );
}
