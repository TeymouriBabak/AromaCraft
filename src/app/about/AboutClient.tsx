'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Bean,
  Coffee,
  HeartHandshake,
  Leaf,
  Sparkles,
  Star,
} from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import type { Product } from '@/lib/shop-products';

const freshnessSignals = [
  {
    icon: Leaf,
    title: 'Direct Trade Sourcing',
    description:
      'We build lasting partnerships with growers to secure exceptional lots and transparent pricing.',
  },
  {
    icon: Coffee,
    title: 'Small Batch Roasting',
    description:
      'Each roast is tuned with care so the cup arrives vivid, balanced, and deeply aromatic.',
  },
  {
    icon: Sparkles,
    title: 'Roasted-to-Order Freshness',
    description:
      'Your coffee is roasted and packed the moment your order is placed for peak flavor.',
  },
];

const testimonials = [
  {
    quote:
      'The storytelling, the freshness, and the flavor all feel elevated. My mornings feel calmer now.',
    author: 'Mina R.',
    role: 'Subscriber • 6 months',
  },
  {
    quote:
      'Every bag feels beautifully considered. The roast is rich, balanced, and consistently excellent.',
    author: 'Daniel T.',
    role: 'Espresso lover',
  },
  {
    quote:
      'I ordered once and immediately subscribed. The experience feels premium from the first sip.',
    author: 'Sophie L.',
    role: 'Founding member',
  },
];

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm uppercase tracking-[0.3em] text-[#b56e3b]">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-serif text-3xl leading-tight text-[#2b1d17] sm:text-4xl dark:text-[#f6e5d1]">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-[#5f473d] dark:text-[#e8d8c0]">
        {description}
      </p>
    </div>
  );
}

export default function AboutClient({
  shopProducts,
}: {
  shopProducts: Product[];
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="overflow-hidden bg-[radial-gradient(circle_at_top,rgba(214,176,122,0.16),transparent_34%)]">
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-10">
        <motion.header
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-4xl border border-[#d6b07a]/25 bg-[#2b1d17] shadow-[0_30px_90px_-28px_rgba(43,29,23,0.45)]"
        >
          <Image
            src="/images/product/starbucks-2.png"
            alt="Coffee cherries drying in the sun during processing"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 80vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,13,8,0.86)_8%,rgba(24,13,8,0.42)_55%,rgba(24,13,8,0.28)_100%)]" />
          <div className="relative flex min-h-[70vh] flex-col justify-end px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-sm uppercase tracking-[0.28em] text-[#f8e7d0] backdrop-blur">
                <Bean size={15} />
                Our story, reimagined
              </p>
              <h1 className="mt-6 font-serif text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
                Our Journey from Soil to Sip
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#f2e4d2] sm:text-lg">
                Every cup begins with intention: traceable sourcing, patient
                roasting, and a ritual designed to feel as calm as it is
                unforgettable.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center rounded-full bg-[#c9854d] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#b56e3b]"
                >
                  Discover the collection{' '}
                  <ArrowRight className="ml-2" size={16} />
                </Link>
                <a
                  href="#best-sellers"
                  className="rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-[#f8e7d0] backdrop-blur transition hover:bg-white/20"
                >
                  Explore featured roasts
                </a>
              </div>
            </div>
          </div>
        </motion.header>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-4xl border border-[#d6b07a]/25 bg-[#fbf7f2]/90 p-6 shadow-[0_20px_60px_-24px_rgba(43,29,23,0.26)] sm:p-8 lg:p-10"
        >
          <SectionIntro
            eyebrow="Quality & freshness"
            title="The quiet confidence behind every cup"
            description="We believe luxury should feel effortless, which is why every roast is selected, roasted, and delivered with intention."
          />
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {freshnessSignals.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.title}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                  animate={
                    shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
                  }
                  transition={{ delay: index * 0.08, duration: 0.45 }}
                  className="rounded-[1.4rem] border border-[#d6b07a]/20 bg-white/80 p-6 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4e3cf] text-[#b56e3b]">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-5 font-serif text-2xl text-[#2b1d17]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#5f473d]">
                    {item.description}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: -16 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="overflow-hidden rounded-4xl border border-[#d6b07a]/20 bg-[#2b1d17]"
          >
            <Image
              src="/images/product/mccafe-1.png"
              alt="Coffee roasting setup with rich warm lighting"
              width={1000}
              height={700}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-full min-h-70 w-full object-cover"
            />
          </motion.div>
          <motion.article
            initial={shouldReduceMotion ? false : { opacity: 0, x: 16 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="rounded-4xl border border-[#d6b07a]/20 bg-[#fffaf3] p-6 shadow-[0_20px_60px_-26px_rgba(43,29,23,0.25)] sm:p-8 lg:p-10"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-[#b56e3b]">
              Meet the roasters
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#2b1d17] sm:text-4xl">
              We roast for people who value calm, craft, and consistency.
            </h2>
            <p className="mt-5 text-base leading-8 text-[#5f473d]">
              Founded by a small team of coffee obsessives, AromaCraft blends
              hospitality, precision, and sensory storytelling into every batch.
              We want your ritual to feel intimate, elevated, and deeply
              personal.
            </p>
            <div className="mt-8 rounded-3xl border border-[#d6b07a]/20 bg-[#f7ebdb] p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2b1d17] text-sm font-semibold text-[#f8e7d0]">
                  AR
                </div>
                <div>
                  <p className="font-semibold text-[#2b1d17]">
                    Ari & Rina, Founders
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#6f5647]">
                    “We source with care, roast with restraint, and build every
                    subscription around the feeling of a perfect morning.”
                  </p>
                </div>
              </div>
            </div>
          </motion.article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="rounded-4xl border border-[#d6b07a]/20 bg-[#fbf7f2]/90 p-6 shadow-[0_20px_60px_-24px_rgba(43,29,23,0.24)] sm:p-8 lg:p-10"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <SectionIntro
              eyebrow="Community love"
              title="What our community says"
              description="New to AromaCraft? Let the voices of our subscribers guide your first pour."
            />
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d6b07a]/20 bg-white/70 px-3 py-2 text-sm text-[#6f5647]">
              <HeartHandshake size={16} className="text-[#b56e3b]" />
              Trusted by curious coffee lovers
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {testimonials.map((item, index) => (
              <motion.blockquote
                key={item.author}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                animate={
                  shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
                }
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className={`rounded-[1.4rem] border border-[#d6b07a]/20 bg-white/80 p-6 shadow-sm ${index === 1 ? 'lg:-translate-y-2' : ''}`}
              >
                <div className="flex gap-1 text-[#c9854d]">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={starIndex} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="mt-4 text-base leading-8 text-[#3f2d22]">
                  “{item.quote}”
                </p>
                <footer className="mt-5">
                  <p className="font-semibold text-[#2b1d17]">{item.author}</p>
                  <p className="text-sm text-[#8a6f5a]">{item.role}</p>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </motion.div>
      </section>

      <section
        id="best-sellers"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionIntro
            eyebrow="Best sellers"
            title="Bring the story home with three signature roasts"
            description="These favorites bridge the gap between storytelling and conversion, giving shoppers a beautiful first step into the collection."
          />
          <Link
            href="/shop"
            className="inline-flex items-center rounded-full border border-[#d6b07a]/25 bg-[#fbf7f2] px-4 py-2 text-sm font-semibold text-[#2b1d17] transition hover:-translate-y-0.5 hover:bg-[#fffaf3]"
          >
            Shop all roasts <ArrowRight className="ml-2" size={16} />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {shopProducts.slice(0, 3).map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
