'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Bean,
  ChevronDown,
  Coffee,
  Clock3,
  Leaf,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { products } from '@/data/products';
import { NewsletterSubscriptionForm } from '@/components/newsletter-subscription-form';

const brandLogos = [
  {
    name: 'Costa',
    src: '/images/brands/costa-logo.png',
    alt: 'Costa-inspired coffee culture reference',
    cardClass: 'bg-[#f8e6c3] dark:bg-[#34261d]',
    surfaceClass: 'bg-[#fff8eb] dark:bg-[#473326]',
    labelClass: 'text-[#8c5126] dark:text-[#f2d3a8]',
  },
  {
    name: "Dunkin'",
    src: '/images/brands/dunkin-logo.png',
    alt: 'Dunkin-inspired coffee culture reference',
    cardClass: 'bg-[#fde4d4] dark:bg-[#34261d]',
    surfaceClass: 'bg-[#fff6ee] dark:bg-[#4a3024]',
    labelClass: 'text-[#9b4d2d] dark:text-[#f2c79e]',
  },
  {
    name: "Gloria Jean's",
    src: '/images/brands/gloriajeans-logo.png',
    alt: "Gloria Jean's-inspired coffee culture reference",
    cardClass: 'bg-[#f7ebdb] dark:bg-[#2f2219]',
    surfaceClass: 'bg-[#fef8f0] dark:bg-[#4a3327]',
    labelClass: 'text-[#8a5b35] dark:text-[#f3d1aa]',
  },
  {
    name: 'Jacobs',
    src: '/images/brands/jacobs-logo.png',
    alt: 'Jacobs-inspired coffee culture reference',
    cardClass: 'bg-[#efe0ca] dark:bg-[#311f17]',
    surfaceClass: 'bg-[#faf2e7] dark:bg-[#482d21]',
    labelClass: 'text-[#7d4a2a] dark:text-[#efc79a]',
  },
  {
    name: 'McCafé',
    src: '/images/brands/mccafe-logo.png',
    alt: 'McCafe-inspired coffee culture reference',
    cardClass: 'bg-[#f2e5d0] dark:bg-[#32251c]',
    surfaceClass: 'bg-[#fdf8ef] dark:bg-[#4e3527]',
    labelClass: 'text-[#8a5a2c] dark:text-[#f3d3ac]',
  },
  {
    name: 'Starbucks',
    src: '/images/brands/starbucks-logo.png',
    alt: 'Starbucks-inspired coffee culture reference',
    cardClass: 'bg-[#f6e0c1] dark:bg-[#34261d]',
    surfaceClass: 'bg-[#fff8ec] dark:bg-[#493327]',
    labelClass: 'text-[#935f2d] dark:text-[#f2d0a5]',
  },
  {
    name: 'Tim Hortons',
    src: '/images/brands/timhortons-logo.png',
    alt: 'Tim Hortons-inspired coffee culture reference',
    cardClass: 'bg-[#f3e3d2] dark:bg-[#30231a]',
    surfaceClass: 'bg-[#fffaf2] dark:bg-[#473324]',
    labelClass: 'text-[#8b5a2b] dark:text-[#f0d0a8]',
  },
];

const highlights = [
  {
    title: 'Traceable sourcing',
    description:
      'Single-origin lots selected with care and delivered fresh from the producer.',
  },
  {
    title: 'Roasted to order',
    description:
      'We roast in small batches so your cup arrives vibrant, aromatic, and full of life.',
  },
  {
    title: 'Tailored for your ritual',
    description:
      'From pour-over to espresso, every selection fits your daily brewing routine.',
  },
];

const trustPoints = [
  {
    icon: ShieldCheck,
    title: 'Secure checkout',
    description:
      'Protected payments and fast delivery from our roasting studio.',
  },
  {
    icon: Truck,
    title: 'Free shipping',
    description:
      'Complimentary delivery on orders over $50 and flexible subscriptions.',
  },
  {
    icon: Clock3,
    title: 'Freshly packed',
    description: 'Ships within 24 hours so the flavor stays at its peak.',
  },
];

const categories = [
  {
    title: 'Single origins',
    description: 'Bright, characterful coffees with origin-led stories.',
    badge: 'Signature',
  },
  {
    title: 'Signature blends',
    description: 'Balanced house roasts designed for everyday comfort.',
    badge: 'Most loved',
  },
  {
    title: 'Espresso picks',
    description: 'Rich, silky options for milk drinks and low-volume brewing.',
    badge: 'Barista',
  },
];

const brewMethods = [
  {
    title: 'Pour-over',
    description: 'A clean, elegant cup with layered aromatics.',
    accent: 'V60 + Kalita',
  },
  {
    title: 'French press',
    description: 'A fuller body with plush texture and depth.',
    accent: 'Full body',
  },
  {
    title: 'Espresso',
    description: 'Velvety crema and bold character in every shot.',
    accent: 'Morning ritual',
  },
];

const faqs = [
  {
    question: 'How fresh is your coffee?',
    answer:
      'Every order is roasted in small batches and dispatched within 24 hours so the flavor stays vivid and aromatic.',
  },
  {
    question: 'Do you offer subscriptions?',
    answer:
      'Yes. Choose a cadence that suits you and enjoy flexible delivery, exclusive blends, and easy pause or skip controls.',
  },
  {
    question: 'Can I find a roast for my brewing setup?',
    answer:
      'Absolutely. Our quiz and brew-method guides make it simple to match a coffee to your equipment and flavor preferences.',
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
      <div className="max-w-2xl">
        <p className="text-sm uppercase tracking-[0.24em] text-[#b56e3b]">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-serif text-3xl leading-tight text-[#2b1d17] dark:text-[#f6e5d1]">
          {title}
        </h2>
        <p className="mt-3 text-base leading-7 text-[#5f473d] dark:text-[#e8d8c0]">
          {description}
        </p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="overflow-hidden">
      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-8 pt-10 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col justify-center"
        >
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d6b07a]/40 bg-[#fbf7f2]/90 px-3.5 py-2 text-sm text-[#6b5142] shadow-sm backdrop-blur dark:bg-[#23110c]/80 dark:text-[#e8d8c0]">
            <Sparkles size={15} className="text-[#c9854d]" />
            <span>New seasonal reserve now available</span>
          </div>
          <p className="mt-5 text-sm uppercase tracking-[0.28em] text-[#b56e3b]">
            AromaCraft
          </p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-[1.03] text-[#2b1d17] sm:text-5xl lg:text-6xl dark:text-[#f6e5d1]">
            Specialty coffee for the quiet luxury of your morning.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#5f473d] dark:text-[#e8d8c0]">
            Discover traceable single origins, elegant subscriptions, and
            tasting-led roasts shaped for your home ritual.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center rounded-full bg-[#c9854d] px-6 py-3 font-semibold text-white shadow-[0_14px_40px_-18px_rgba(201,133,77,0.65)] transition hover:-translate-y-0.5 hover:bg-[#b56e3b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9854d]/50"
            >
              Shop roasts <ArrowRight className="ml-2" size={16} />
            </Link>
            <Link
              href="/quiz"
              className="rounded-full border border-[#d6b07a]/50 bg-[#fbf7f2]/90 px-6 py-3 font-semibold text-[#2b1d17] transition hover:-translate-y-0.5 hover:border-[#b56e3b] hover:bg-[#fffaf3] dark:bg-[#23110c]/90 dark:text-[#f6e5d1]"
            >
              Take the coffee quiz
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-2.5 text-sm text-[#6f5647] dark:text-[#e8d8c0]">
            {[
              'Free shipping over $50',
              'Roasted weekly',
              'Rated 4.8/5 by coffee lovers',
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#d6b07a]/35 bg-[#fbf7f2] px-3 py-2 shadow-sm dark:bg-[#1f130d]"
              >
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: 18 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-4xl border border-[#d6b07a]/25 bg-[radial-gradient(circle_at_top_left,rgba(214,176,122,0.28),transparent_48%),linear-gradient(135deg,#f7f1e8,#efe3d2)] p-4 shadow-[0_24px_80px_-26px_rgba(43,29,23,0.3)] dark:bg-[radial-gradient(circle_at_top_left,rgba(214,176,122,0.24),transparent_65%),linear-gradient(135deg,#23110c,#1a0f0a)]"
        >
          <div className="absolute inset-0 rounded-4xl bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.33),transparent_40%)]" />
          <div className="relative rounded-3xl border border-[#d6b07a]/25 bg-[#2b1d17] p-6 text-[#f6e5d1] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-8">
            <div className="flex items-center justify-between text-sm uppercase tracking-[0.26em] text-[#d6b07a]">
              <span>Spring edition</span>
              <span>Limited reserve</span>
            </div>
            <div className="mt-8 flex h-64 items-center justify-center rounded-3xl border border-[#d6b07a]/20 bg-[linear-gradient(135deg,rgba(214,176,122,0.18),rgba(201,133,77,0.1))]">
              <div className="h-48 w-32 rounded-3xl border border-[#f6e5d1]/15 bg-[#fbf7f2] p-5 text-[#2b1d17] shadow-[0_18px_44px_-16px_rgba(0,0,0,0.35)]">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#b56e3b]">
                  AromaCraft
                </p>
                <p className="mt-8 font-serif text-2xl">Golden Hour</p>
                <p className="mt-3 text-sm leading-6 text-[#6b5142]">
                  Bright citrus · honeyed finish
                </p>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-between gap-4 text-sm">
              <div>
                <p className="font-semibold">Freshly roasted weekly</p>
                <p className="mt-1 text-[#d8bda4]">Ships within 24 hours</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d6b07a] text-[#d6b07a]">
                <Bean />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-4 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={
            shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
          }
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-[1.8rem] border border-[#d6b07a]/25 bg-[#fbf7f2]/90 p-5 shadow-[0_10px_40px_-24px_rgba(43,29,23,0.25)] backdrop-blur md:p-6"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#8a6f5a]">
                AromaCraft in the world of coffee
              </p>
              <p className="mt-2 text-sm text-[#6b5142]">
                A tailored ribbon of iconic coffee culture, reimagined as a
                calm, luxurious editorial rhythm.
              </p>
            </div>
            <div className="rounded-full border border-[#d6b07a]/25 bg-white/70 px-3 py-2 text-sm text-[#6b5142] shadow-sm">
              Seamless loop · continuous motion
            </div>
          </div>
          <div className="mt-5 overflow-hidden rounded-[1.35rem] border border-[#d6b07a]/20 bg-white/70 p-3 sm:p-4">
            <div className="logo-marquee-track flex w-max items-stretch gap-3 sm:gap-4">
              {[...brandLogos, ...brandLogos].map((logo, index) => (
                <div
                  key={`${logo.name}-${index}`}
                  aria-hidden={index >= brandLogos.length}
                  className={`brand-logo-card group flex min-h-55 min-w-44.5 shrink-0 flex-col justify-between rounded-[1.35rem] border border-[#d6b07a]/20 px-4 py-4 shadow-[0_12px_38px_-20px_rgba(43,29,23,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_-20px_rgba(43,29,23,0.35)] sm:min-h-60 sm:min-w-52.5 ${logo.cardClass}`}
                >
                  <div
                    className={`flex h-24 items-center justify-center rounded-[1.05rem] border border-black/5 px-3 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ${logo.surfaceClass}`}
                  >
                    <Image
                      src={logo.src}
                      alt={logo.alt}
                      width={140}
                      height={72}
                      className="h-12 w-auto max-w-30.5 object-contain opacity-95"
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <p
                      className={`text-[0.8rem] font-semibold uppercase tracking-[0.2em] ${logo.labelClass}`}
                    >
                      {logo.name}
                    </p>
                    <span className="rounded-full border border-black/10 bg-white/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[#7b5a41] dark:border-white/10 dark:bg-white/10 dark:text-[#f0d7b9]">
                      Iconic
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-4 rounded-[1.75rem] border border-[#d6b07a]/25 bg-[#fbf7f2]/90 p-4 shadow-[0_10px_45px_-22px_rgba(43,29,23,0.25)] md:grid-cols-3 dark:bg-[#23110c]/80">
          {highlights.map((item, index) => (
            <motion.div
              key={item.title}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={
                shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
              }
              viewport={{ once: true, amount: 0.25 }}
              transition={{
                delay: index * 0.08,
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="rounded-[1.25rem] border border-[#d6b07a]/20 bg-[#fffaf3] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:bg-[#1f130d]"
            >
              <p className="text-sm uppercase tracking-[0.24em] text-[#b56e3b]">
                0{index + 1}
              </p>
              <h3 className="mt-3 font-serif text-2xl text-[#2b1d17] dark:text-[#f6e5d1]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#5f473d] dark:text-[#e8d8c0]">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <SectionHeading
          eyebrow="Curated collection"
          title="Roasts built to feel as refined as your ritual"
          description="From bright florals to rich, velvety espresso blends, each bag is designed to be delicious, expressive, and easy to love."
          action={
            <Link
              href="/shop"
              className="inline-flex items-center rounded-full border border-[#d6b07a]/35 bg-[#fbf7f2] px-4 py-2 text-sm font-semibold text-[#2b1d17] transition hover:-translate-y-0.5 hover:border-[#b56e3b] hover:bg-[#fffaf3] dark:bg-[#1f130d] dark:text-[#f6e5d1]"
            >
              View all roasts <ArrowRight className="ml-2" size={15} />
            </Link>
          }
        />

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product, index) => {
            const widthMap: Record<string, string> = {
              Light: 'w-1/3',
              Medium: 'w-2/3',
              Dark: 'w-full',
            };
            const barWidth = widthMap[product.roast] || 'w-2/3';
            return (
              <motion.article
                key={product.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={
                  shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
                }
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.05 }}
                whileHover={
                  shouldReduceMotion ? undefined : { y: -6, scale: 1.01 }
                }
                className="group rounded-[1.75rem] border border-[#d6b07a]/25 bg-[#fbf7f2]/90 p-5 shadow-[0_16px_54px_-28px_rgba(43,29,23,0.35)] transition hover:shadow-[0_22px_64px_-24px_rgba(43,29,23,0.45)] dark:bg-[#23110c]"
              >
                <div className="rounded-[1.25rem] border border-[#d6b07a]/20 bg-[linear-gradient(135deg,#efe3d2,#f8efe6)] p-4 text-center shadow-inner">
                  <div className="mx-auto flex h-24 w-20 items-center justify-center rounded-2xl border border-white/10 bg-[#2b1d17] text-[#f6e5d1] shadow-[0_10px_30px_-16px_rgba(0,0,0,0.45)]">
                    <p className="text-center text-[11px] uppercase tracking-[0.3em]">
                      {product.country}
                    </p>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#b56e3b]">
                      {product.badge}
                    </p>
                    <span className="rounded-full border border-[#d6b07a]/25 bg-[#fffaf3] px-2.5 py-1 text-[11px] font-medium text-[#6f5647] dark:bg-[#1f130d] dark:text-[#e8d8c0]">
                      {product.roast}
                    </span>
                  </div>
                  <h3 className="mt-3 font-serif text-xl text-[#2b1d17] dark:text-[#f6e5d1]">
                    {product.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#5f473d] dark:text-[#e8d8c0]">
                    {product.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.tastingNotes.map((note) => (
                      <span
                        key={note}
                        className="rounded-full bg-[#f4e6d8] px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-[#7a6452] dark:bg-[#2f1f16] dark:text-[#f6e5d1]"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-[#6b5142] dark:text-[#e8d8c0]">
                    <div className="flex items-center gap-1">
                      <Star
                        size={14}
                        className="fill-[#c9854d] text-[#c9854d]"
                      />
                      <span>{product.rating}</span>
                    </div>
                    <span className="rounded-full border border-[#d6b07a]/25 px-2.5 py-1">
                      250g
                    </span>
                  </div>
                  <div className="mt-4 h-1.5 rounded-full bg-[#e9d9c5]">
                    <div
                      className={`h-1.5 rounded-full bg-linear-to-r from-[#d6b07a] to-[#c9854d] ${barWidth}`}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="font-serif text-2xl text-[#2b1d17] dark:text-[#f6e5d1]">
                        ${product.price}
                      </p>
                      <p className="text-sm text-[#6f5647] dark:text-[#e8d8c0]">
                        {product.grindTypes.join(' · ')}
                      </p>
                    </div>
                    <Link
                      href={`/shop/${product.id}`}
                      className="rounded-full bg-[#2b1d17] px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-[#c9854d]"
                    >
                      Add to cart
                    </Link>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-6 rounded-4xl border border-[#d6b07a]/25 bg-[#f7f1e8] p-6 shadow-[0_10px_44px_-24px_rgba(43,29,23,0.25)] lg:grid-cols-[0.9fr_1.1fr] lg:p-8 dark:bg-[#23110c]">
          <div className="flex flex-col justify-center">
            <p className="text-sm uppercase tracking-[0.24em] text-[#b56e3b]">
              Shop by category
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#2b1d17] dark:text-[#f6e5d1]">
              A curated path for every kind of coffee lover.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#5f473d] dark:text-[#e8d8c0]">
              Choose a mood, a brewing method, or a flavor profile and let the
              collection guide you toward your next favorite roast.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.title}
                href="/shop"
                className="group rounded-[1.25rem] border border-[#d6b07a]/20 bg-[#fbf7f2] p-4 transition hover:-translate-y-1 hover:border-[#b56e3b] hover:shadow-[0_16px_40px_-24px_rgba(43,29,23,0.35)] dark:bg-[#1f130d]"
              >
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#b56e3b]">
                  {category.badge}
                </p>
                <h3 className="mt-3 font-serif text-xl text-[#2b1d17] dark:text-[#f6e5d1]">
                  {category.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#5f473d] dark:text-[#e8d8c0]">
                  {category.description}
                </p>
                <span className="mt-4 inline-flex items-center text-sm font-semibold text-[#2b1d17] transition group-hover:text-[#c9854d] dark:text-[#f6e5d1]">
                  Explore <ArrowRight className="ml-2" size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-4xl border border-[#d6b07a]/25 bg-[#fbf7f2] p-8 shadow-[0_10px_44px_-24px_rgba(43,29,23,0.25)] dark:bg-[#23110c]">
            <SectionHeading
              eyebrow="Coffee quiz"
              title="Let us match you with the right roast"
              description="Answer a few quick flavor questions and we’ll suggest a coffee that fits your brewing style, palate, and pace."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/quiz"
                className="inline-flex items-center rounded-full bg-[#2b1d17] px-5 py-3 font-semibold text-white transition hover:bg-[#c9854d]"
              >
                Start the quiz <ArrowRight className="ml-2" size={16} />
              </Link>
              <Link
                href="/shop"
                className="rounded-full border border-[#d6b07a]/35 px-5 py-3 font-semibold text-[#2b1d17] transition hover:border-[#b56e3b] dark:text-[#f6e5d1]"
              >
                Browse favorites
              </Link>
            </div>
          </div>
          <div className="rounded-4xl border border-[#d6b07a]/25 bg-[#2b1d17] p-8 text-[#f6e5d1] shadow-[0_10px_44px_-24px_rgba(43,29,23,0.3)]">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-[#d6b07a]/30 p-2 text-[#d6b07a]">
                <Coffee size={18} />
              </div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#d6b07a]">
                Brew methods
              </p>
            </div>
            <div className="mt-5 space-y-4">
              {brewMethods.map((method) => (
                <div
                  key={method.title}
                  className="rounded-[1.2rem] border border-[#d6b07a]/20 bg-white/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-serif text-xl">{method.title}</h3>
                    <span className="text-sm text-[#d8bda4]">
                      {method.accent}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#e8d8c0]">
                    {method.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-8 rounded-4xl border border-[#d6b07a]/25 bg-[#f7f1e8] p-8 shadow-[0_10px_44px_-24px_rgba(43,29,23,0.25)] lg:grid-cols-[0.95fr_1.05fr] dark:bg-[#23110c]">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[#b56e3b]">
              Subscription
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#2b1d17] dark:text-[#f6e5d1]">
              A premium delivery plan that feels effortless.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#5f473d] dark:text-[#e8d8c0]">
              Set your cadence, receive a rotating selection of exceptional
              roasts, and enjoy thoughtful extras that make each delivery feel
              like an occasion.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center rounded-full bg-[#c9854d] px-5 py-3 font-semibold text-white transition hover:bg-[#b56e3b]"
              >
                Subscribe & save 15% <ArrowRight className="ml-2" size={16} />
              </Link>
              <span className="rounded-full border border-[#d6b07a]/30 bg-[#fbf7f2] px-4 py-3 text-sm text-[#6f5647] dark:bg-[#1f130d] dark:text-[#e8d8c0]">
                Pause or skip anytime
              </span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                'Flexible cadence',
                'Curated tasting notes',
                'Priority roasting',
              ].map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-2xl border border-[#d6b07a]/20 bg-[#fbf7f2] px-4 py-3 text-sm text-[#6f5647] dark:bg-[#1f130d] dark:text-[#e8d8c0]"
                >
                  {benefit}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-[#d6b07a]/20 bg-white/10 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                '/images/product/starbucks-1.png',
                '/images/product/costa-1.png',
                '/images/product/gloriajeans-2.png',
                '/images/product/jacobs-1.png',
              ].map((src, index) => (
                <Image
                  key={src}
                  src={src}
                  alt={`Coffee setup ${index + 1}`}
                  width={600}
                  height={320}
                  className="h-40 w-full rounded-2xl object-cover shadow-sm"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-4xl border border-[#d6b07a]/25 bg-[#fbf7f2] p-8 shadow-[0_10px_44px_-24px_rgba(43,29,23,0.25)] dark:bg-[#23110c]">
            <p className="text-sm uppercase tracking-[0.24em] text-[#b56e3b]">
              Why choose us
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[#2b1d17] dark:text-[#f6e5d1]">
              A thoughtful partner for your daily cup.
            </h2>
            <div className="mt-6 space-y-4">
              {trustPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <div
                    key={point.title}
                    className="flex gap-3 rounded-[1.1rem] border border-[#d6b07a]/20 bg-[#fffaf3] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:bg-[#1f130d]"
                  >
                    <div className="mt-1 rounded-full bg-[#f3e5d3] p-2 text-[#b56e3b] dark:bg-[#2f1f16]">
                      <Icon size={16} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2b1d17] dark:text-[#f6e5d1]">
                        {point.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[#5f473d] dark:text-[#e8d8c0]">
                        {point.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-4xl border border-[#d6b07a]/25 bg-[#2b1d17] p-8 text-[#f6e5d1] shadow-[0_10px_44px_-24px_rgba(43,29,23,0.3)]">
            <p className="text-sm uppercase tracking-[0.24em] text-[#d6b07a]">
              Our story
            </p>
            <h2 className="mt-3 font-serif text-3xl">
              From a single source to your everyday ritual.
            </h2>
            <p className="mt-4 text-base leading-8 text-[#e8d8c0]">
              We began by searching for coffees that balance elegance, clarity,
              and comfort — then built a small-batch roasting studio around that
              exact feeling. The result is a collection that feels calm,
              considered, and deeply personal.
            </p>
            <div className="mt-8 rounded-3xl border border-[#d6b07a]/20 bg-white/10 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-[#d6b07a]">
                <Leaf size={15} />
                <span>Direct trade partnerships</span>
              </div>
              <p className="mt-3 text-lg leading-8 text-[#f6e5d1]">
                AromaCraft works directly with growers to support quality,
                sustainability, and long-term relationships at origin.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 lg:px-8">
        <SectionHeading
          eyebrow="Loved by coffee lovers"
          title="A calm, confident experience from first sip to first refill"
          description="Thoughtful service, beautiful packaging, and remarkable flavor continue to make AromaCraft a favorite for home brewers."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
          {[
            {
              name: 'Mina R.',
              title: 'Elegant and complex',
              quote:
                'The flavor is vibrant and the packaging feels luxurious in every detail.',
              featured: true,
            },
            {
              name: 'Daniel T.',
              title: 'Balanced and rich',
              quote:
                'The house blend is now my everyday favorite — it works beautifully in both espresso and drip.',
              featured: false,
            },
            {
              name: 'Sophie L.',
              title: 'My favorite subscription',
              quote:
                'The delivery cadence is effortless and the coffees always feel fresh and beautifully roasted.',
              featured: false,
            },
          ].map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={
                shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
              }
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.08 }}
              whileHover={
                shouldReduceMotion ? undefined : { y: -4, scale: 1.01 }
              }
              className={`rounded-[1.75rem] border border-[#d6b07a]/25 bg-[#fbf7f2]/90 p-6 shadow-[0_16px_54px_-28px_rgba(43,29,23,0.35)] dark:bg-[#23110c] ${testimonial.featured ? 'lg:translate-y-2' : ''}`}
            >
              <div className="flex items-center gap-1 text-[#c9854d]">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Star key={starIndex} size={14} className="fill-[#c9854d]" />
                ))}
              </div>
              <h3 className="mt-4 font-serif text-xl text-[#2b1d17] dark:text-[#f6e5d1]">
                {testimonial.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#5f473d] dark:text-[#e8d8c0]">
                “{testimonial.quote}”
              </p>
              <p className="mt-5 text-sm font-semibold text-[#2b1d17] dark:text-[#f6e5d1]">
                {testimonial.name}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="rounded-4xl border border-[#d6b07a]/25 bg-[#fbf7f2] p-8 shadow-[0_10px_44px_-24px_rgba(43,29,23,0.25)] dark:bg-[#23110c]">
          <SectionHeading
            eyebrow="Frequently asked questions"
            title="Everything you need to know before your first order"
            description="A few of the most common questions about freshness, subscriptions, and how to select your perfect roast."
          />
          <div className="mt-8 space-y-3">
            {faqs.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <motion.div
                  key={item.question}
                  layout
                  className={`rounded-[1.15rem] border border-[#d6b07a]/25 bg-[#fffaf3] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition dark:bg-[#1f130d] ${isOpen ? 'border-[#b56e3b]/45 bg-[#fff8f0]' : ''}`}
                >
                  <button
                    className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9854d]/45"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                  >
                    <span className="font-semibold text-[#2b1d17] dark:text-[#f6e5d1]">
                      {item.question}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d6b07a]/25 bg-[#fbf7f2] text-[#b56e3b] dark:bg-[#23110c]"
                    >
                      <ChevronDown size={16} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.24,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="overflow-hidden"
                      >
                        <p className="mt-3 text-sm leading-7 text-[#5f473d] dark:text-[#e8d8c0]">
                          {item.answer}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
        <div className="rounded-4xl border border-[#d6b07a]/25 bg-[#2b1d17] p-8 text-[#f6e5d1] shadow-[0_12px_48px_-24px_rgba(43,29,23,0.4)] lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#d6b07a]">
                Stay in the loop
              </p>
              <h2 className="mt-3 font-serif text-3xl">
                Join the AromaCraft newsletter for release drops and brewing
                notes.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-[#e8d8c0]">
                Receive seasonal roasts, tasting reflections, and
                subscriber-only offers direct to your inbox.
              </p>
            </div>
            <div className="rounded-3xl border border-[#d6b07a]/25 bg-white/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <NewsletterSubscriptionForm id="newsletter-email-main" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
