import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="font-serif text-4xl">Thank you for your order</h1>
      <p className="mt-4 text-lg">
        We have received your order and will email updates shortly.
      </p>
      <div className="mt-8">
        <Link
          href="/dashboard/customer"
          className="rounded-full bg-[#e76f51] px-4 py-2 text-white"
        >
          Go to your dashboard
        </Link>
      </div>
    </div>
  );
}
