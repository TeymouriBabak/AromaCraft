'use client';

export interface LowStockItem {
  id: number;
  name: string;
  brand: string;
  inventory: number;
}

export function LowStockGrid({ items }: { items: LowStockItem[] }) {
  return (
    <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between border border-slate-700 p-3"
        >
          <div>
            <div className="font-medium">{item.name}</div>
            <div className="text-xs text-slate-400">{item.brand}</div>
          </div>
          <div
            className={`text-sm font-semibold ${
              item.inventory <= 5 ? 'text-red-400' : 'text-amber-400'
            }`}
          >
            {item.inventory}
          </div>
        </div>
      ))}
    </div>
  );
}
