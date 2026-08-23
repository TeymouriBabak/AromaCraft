'use client';

import { useNewsletterSubscription } from '@/hooks/useNewsletterSubscription';

interface NewsletterSubscriptionFormProps {
  buttonLabel?: string;
  placeholder?: string;
  className?: string;
  showDescription?: boolean;
  id?: string;
}

export function NewsletterSubscriptionForm({
  buttonLabel = 'Subscribe',
  placeholder = 'Email address',
  className,
  showDescription = true,
  id = 'newsletter-email',
}: NewsletterSubscriptionFormProps) {
  const { email, setEmail, status, message, subscribe } =
    useNewsletterSubscription();

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={id} className="sr-only">
          Email address
        </label>
        <input
          id={id}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-full border border-[#d4a373]/25 bg-[#fbf7f2] px-4 py-3 text-[#2b1d17] outline-none transition focus:border-[#c9854d] focus:ring-2 focus:ring-[#c9854d]/25"
        />
        <button
          type="button"
          onClick={subscribe}
          disabled={status === 'pending'}
          className="rounded-full bg-[#c9854d] px-5 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#b56e3b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'pending' ? 'Subscribing...' : buttonLabel}
        </button>
      </div>
      {message ? (
        <p
          className={`text-sm ${status === 'error' ? 'text-[#e76f51]' : 'text-[#6e4b33]'}`}
        >
          {message}
        </p>
      ) : null}
      {showDescription ? (
        <p className="mt-3 text-sm text-[#d8bda4]">
          No spam, just thoughtful notes and early access.
        </p>
      ) : null}
    </div>
  );
}
