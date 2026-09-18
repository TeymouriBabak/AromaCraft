'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductFormValues } from '@/lib/validators/inventory';

export type ManagerProductFormProps = {
  defaultValues?: Partial<ProductFormValues>;
  mode?: 'create' | 'edit';
  productId?: number;
  onDeleted?: () => void;
};

const blankValues: ProductFormValues = {
  name: '',
  slug: '',
  brand: '',
  price: 0,
  inventory: 0,
  lowStockThreshold: 5,
  status: 'active',
  description: '',
  image: '',
  catalog: 'shop',
  inStock: true,
  roast: 'Not specified',
  process: 'Not specified',
  origin: 'Not specified',
  originRegion: 'Not specified',
  country: 'Not specified',
  coffeeType: 'Coffee',
  body: 'Balanced',
  acidity: 'Medium',
  sweetness: 'Medium',
  size: '250g',
  brewMethods: [],
  grindTypes: [],
  tastingNotes: [],
  specialTags: [],
};

export function ManagerProductForm({ defaultValues, mode = 'create', productId, onDeleted }: ManagerProductFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>({ ...blankValues, ...defaultValues });
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isActive = true;
    fetch('/api/manager/brands')
      .then(async (response) => {
        const body = await readResponse(response);
        if (!response.ok || body?.ok === false) {
          throw new Error(body?.error?.message || 'Unable to load brands.');
        }
        const items = Array.isArray(body?.data?.items) ? body.data.items : Array.isArray(body?.items) ? body.items : [];
        const nextBrands = items.map((brand: { name?: string }) => brand.name).filter(Boolean) as string[];
        if (isActive) {
          setBrandOptions(nextBrands);
          setValues((current) => ({ ...current, brand: current.brand || nextBrands[0] || '' }));
        }
      })
      .catch((reason: unknown) => {
        if (isActive) {
          setBrandOptions([]);
          setError(reason instanceof Error ? reason.message : 'Unable to load brands.');
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const submitLabel = useMemo(() => (mode === 'edit' ? 'Save changes' : 'Create product'), [mode]);

  async function readResponse(response: Response) {
    const text = await response.text();
    try {
      return JSON.parse(text) as { ok?: boolean; data?: { message?: string; items?: Array<{ name?: string }> }; items?: Array<{ name?: string }>; error?: { message?: string } };
    } catch {
      throw new Error('The server returned an invalid response. Please retry.');
    }
  }

  function updateField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!values.name.trim() || !values.brand || values.price <= 0 || values.inventory < 0) {
        setError('Enter a name, existing brand, price greater than 0, and non-negative inventory.');
        return;
      }
      const payload = {
        ...values,
        slug: values.slug || values.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      };

      const response = await fetch(mode === 'edit' ? `/api/manager/products/${productId}` : '/api/manager/products', {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await readResponse(response);
      if (!response.ok || body?.ok === false) {
        throw new Error(body?.error?.message || 'Unable to save product.');
      }

      setSuccess(mode === 'edit' ? 'Product updated.' : 'Product created.');
      if (mode === 'create') {
        router.push('/dashboard/manager/product-list');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save product.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!productId || !window.confirm('Delete or archive this product?')) return;
    setError('');
    const response = await fetch(`/api/manager/products/${productId}`, { method: 'DELETE' });
    const body = await readResponse(response);
    if (!response.ok || body?.ok === false) {
      setError(body?.error?.message || 'Unable to delete product.');
      return;
    }
    setSuccess(body.data?.message || 'Product deleted.');
    onDeleted?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">{error}</div>}
      {success && <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200" aria-live="polite">{success}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate-300">
          Product name
          <input value={values.name} onChange={(event) => updateField('name', event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-sky-400" />
        </label>

        <label className="text-sm text-slate-300">
          Slug
          <input value={values.slug || ''} onChange={(event) => updateField('slug', event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-sky-400" />
        </label>

        <label className="text-sm text-slate-300">
          Brand
          <select value={values.brand} onChange={(event) => updateField('brand', event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-sky-400">
            <option value="">Select brand</option>
            {brandOptions.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-300">
          Status
          <select value={values.status} onChange={(event) => updateField('status', event.target.value as ProductFormValues['status'])} className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-sky-400">
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <label className="text-sm text-slate-300">
          Price
          <input type="number" min="0" step="0.01" value={values.price} onChange={(event) => updateField('price', Number(event.target.value))} className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-sky-400" />
        </label>

        <label className="text-sm text-slate-300">
          Inventory
          <input type="number" min="0" value={values.inventory} onChange={(event) => updateField('inventory', Number(event.target.value))} className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-sky-400" />
        </label>

        <label className="text-sm text-slate-300">
          Low stock threshold
          <input type="number" min="0" value={values.lowStockThreshold} onChange={(event) => updateField('lowStockThreshold', Number(event.target.value))} className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-sky-400" />
        </label>

        <label className="text-sm text-slate-300">
          Image URL
          <input value={values.image || ''} onChange={(event) => updateField('image', event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-sky-400" />
        </label>
      </div>

      <label className="block text-sm text-slate-300">
        Description
        <textarea value={values.description} onChange={(event) => updateField('description', event.target.value)} rows={4} className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:border-sky-400" />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm text-slate-300">Roast<input value={values.roast} onChange={(event) => updateField('roast', event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" /></label>
        <label className="text-sm text-slate-300">Origin<input value={values.origin} onChange={(event) => updateField('origin', event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" /></label>
        <label className="text-sm text-slate-300">Country<input value={values.country} onChange={(event) => updateField('country', event.target.value)} className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100" /></label>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push('/dashboard/manager/product-list')} className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200">Cancel</button>
        {mode === 'edit' && <button type="button" onClick={() => void handleDelete()} className="rounded-md border border-red-500/50 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10">Delete product</button>}
        <button type="submit" disabled={submitting} className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
