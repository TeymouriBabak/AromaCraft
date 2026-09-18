'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Fields = { fullName: string; email: string; phone: string; password: string };
type Errors = Partial<Record<keyof Fields, string>>;
const input = 'mt-1.5 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30';

export default function ManagerCustomerRegistration() {
  const router = useRouter();
  const [fields, setFields] = useState<Fields>({ fullName: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setMessage('');
  }
  function validate() {
    const next: Errors = {};
    if (fields.fullName.trim().length < 2) next.fullName = 'Enter the customer’s full name.';
    if (!/^\S+@\S+\.\S+$/.test(fields.email)) next.email = 'Enter a valid email address.';
    if (fields.password.length < 8 || !/[A-Z]/.test(fields.password) || !/[a-z]/.test(fields.password) || !/[0-9]/.test(fields.password)) next.password = 'Use at least 8 characters with uppercase, lowercase, and a number.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/manager/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
      const text = await response.text();
      let body: { ok?: boolean; data?: { customer?: { name?: string } }; error?: { message?: string; details?: { fieldErrors?: Record<string, string[]> } } };
      try { body = JSON.parse(text); } catch { throw new Error('The server returned an invalid response. Please retry.'); }
      if (!response.ok || body.ok === false) {
        const fieldErrors = body.error?.details?.fieldErrors ?? {};
        setErrors({ fullName: fieldErrors.fullName?.[0], email: fieldErrors.email?.[0], phone: fieldErrors.phone?.[0], password: fieldErrors.password?.[0] });
        throw new Error(body.error?.message ?? 'Unable to register customer.');
      }
      const name = body.data?.customer?.name ?? fields.fullName;
      setFields({ fullName: '', email: '', phone: '', password: '' });
      setMessage(`${name} was registered successfully.`);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to register customer.');
    } finally { setSubmitting(false); }
  }
  function field(id: keyof Fields, label: string, type: string) {
    const error = errors[id];
    return <div><label htmlFor={id} className="text-sm text-slate-300">{label}</label><input id={id} name={id} type={type} value={fields[id]} onChange={(event) => update(id, event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={input} />{error && <p id={`${id}-error`} className="mt-1 text-xs text-red-400">{error}</p>}</div>;
  }
  return <div><div className="mb-6"><p className="text-xs uppercase tracking-[0.16em] text-sky-400">Register Customer</p><h1 className="mt-1 text-2xl font-bold">Customer registration form</h1><p className="mt-2 text-sm text-slate-400">Create a customer account with a temporary password.</p></div><form onSubmit={submit} noValidate className="max-w-2xl space-y-4 border border-slate-700 bg-slate-800 p-5" aria-live="polite">{field('fullName', 'Full name', 'text')}{field('email', 'Email', 'email')}{field('phone', 'Phone (optional)', 'tel')}{field('password', 'Temporary password', 'password')}{message && <p className={`${message.includes('successfully') ? 'text-emerald-300' : 'text-red-300'} text-sm`} role="status" aria-live="polite">{message}</p>}<div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={() => router.push('/dashboard/manager/customers/all-customers')} className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400">View customers</button><button type="submit" disabled={submitting} aria-disabled={submitting} className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50">{submitting ? 'Registering...' : 'Register customer'}</button></div></form></div>;
}
