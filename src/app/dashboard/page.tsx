'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth-context';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const isVerified = Boolean(user?.emailVerified);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      {!isVerified ? (
        <div className="mb-6 rounded-2xl border border-[#d4a373]/20 bg-[#fff9f3] px-4 py-3 text-sm text-[#6e4b33] dark:bg-[#22110c] dark:text-[#f6e5d1]">
          Your email is pending verification. Check your inbox for the secure
          verification code to unlock full dashboard access.
        </div>
      ) : (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-[#2f7d4a]/20 bg-[#f1fbf5] px-4 py-3 text-sm text-[#2f7d4a] dark:bg-[#122a1b] dark:text-[#bfe7c9]">
          <span className="font-semibold">✓</span> Account verified
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-4xl border border-[#d4a373]/20 bg-[#f9f6f0] p-8 shadow-[0_18px_50px_-24px_rgba(43,29,23,0.35)] dark:bg-[#23110c]"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#d4a373]/25 bg-white/70 px-3 py-1.5 text-sm font-medium text-[#b56e3b] dark:bg-[#2b1a13]">
              <ShieldCheck size={16} /> Secure dashboard
            </p>
            <h1 className="mt-4 font-serif text-4xl text-[#1a0f0a] dark:text-[#f6e5d1]">
              Welcome back, {user?.firstName || 'friend'}.
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-[#6e4b33] dark:text-[#e8d8c0]">
              Your account is verified and ready for a more personal AromaCraft
              experience.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full bg-[#1a0f0a] px-4 py-3 font-semibold text-white"
          >
            Explore roasts
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Verified account',
              text: 'Your email is secure and confirmed.',
            },
            {
              title: 'Saved favorites',
              text: 'Keep your go-to coffees close at hand.',
            },
            {
              title: 'Exclusive access',
              text: 'Member-only offers arrive here first.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[1.25rem] border border-[#d4a373]/20 bg-white/70 p-5 dark:bg-[#29130d]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a0f0a] text-[#f9f6f0]">
                <Sparkles size={16} />
              </div>
              <h2 className="mt-4 font-semibold text-[#1a0f0a] dark:text-[#f6e5d1]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm text-[#6e4b33] dark:text-[#e8d8c0]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
