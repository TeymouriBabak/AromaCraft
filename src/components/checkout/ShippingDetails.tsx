"use client";

export default function ShippingDetails({ fullName, email, address, onChange }: { fullName: string; email: string; address: string; onChange: (next: { fullName: string; email: string; address: string }) => void; }) {
  return (
    <div className="space-y-4">
      <label className="block text-sm">
        <span className="sr-only">Full name</span>
        <span className="mb-1 block text-xs">Full name</span>
        <input aria-label="Full name" className="w-full rounded-full border px-3 py-2" value={fullName} onChange={(e) => onChange({ fullName: e.target.value, email, address })} />
      </label>
      <label className="block text-sm">
        <span className="sr-only">Email</span>
        <span className="mb-1 block text-xs">Email</span>
        <input aria-label="Email" type="email" className="w-full rounded-full border px-3 py-2" value={email} onChange={(e) => onChange({ fullName, email: e.target.value, address })} />
      </label>
      <label className="block text-sm">
        <span className="sr-only">Shipping address</span>
        <span className="mb-1 block text-xs">Shipping address</span>
        <textarea aria-label="Shipping address" className="w-full rounded-2xl border px-3 py-2" value={address} onChange={(e) => onChange({ fullName, email, address: e.target.value })} rows={4} />
      </label>
    </div>
  );
}
