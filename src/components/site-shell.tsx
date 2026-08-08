"use client";

import Image from "next/image";
import Link from "next/link";
import Lottie from "lottie-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Menu,
  Search,
  Heart,
  ShoppingBag,
  MoonStar,
  SunMedium,
  ArrowRight,
  Sparkles,
  X,
  LayoutGrid,
  Settings,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { products } from "@/data/products";
import { useAuth } from "@/components/auth-context";
import { useCart } from "@/components/cart-context";
import { useWishlist } from "@/components/wishlist-context";
import { NewsletterSubscriptionForm } from "@/components/newsletter-subscription-form";
import telegramAnimation from "../../public/images/brand-assets/Telegram-logo.json";
import instagramAnimation from "../../public/images/brand-assets/Instagram-logo.json";
import xAnimation from "../../public/images/brand-assets/Twitter-X1.json";
import whatsappAnimation from "../../public/images/brand-assets/Whatsapp-Transparent.json";

const navItems = [
  { label: "Shop", href: "/shop" },
  { label: "Subscription", href: "/shop" },
  { label: "Our Story", href: "/about" },
  { label: "Coffee Finder", href: "/quiz" },
];

const announcements = [
  "Free shipping on first orders over $45",
  "New seasonal reserve now live",
  "15% off subscriptions for your first delivery",
];

const socialLinks = [
  { label: "Telegram", href: "https://t.me/", animationData: telegramAnimation },
  { label: "Instagram", href: "https://www.instagram.com/", animationData: instagramAnimation },
  { label: "X", href: "https://x.com/", animationData: xAnimation },
  { label: "WhatsApp", href: "https://wa.me/", animationData: whatsappAnimation },
];

function SocialAction({ label, href, animationData }: { label: string; href: string; animationData: unknown }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.1 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      className="group flex h-14 w-14 items-center justify-center rounded-full border border-[#d4a373]/35 bg-[#f9f2e6]/12 text-[#f6e5d1] shadow-[0_10px_24px_-16px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:-translate-y-0.5 hover:border-[#d4a373]/70 hover:bg-[#f9f2e6]/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a373]/50 sm:h-15 sm:w-15"
      aria-label={label}
    >
      <Lottie animationData={animationData} loop={!shouldReduceMotion} autoplay={!shouldReduceMotion} className="h-8 w-8 sm:h-9 sm:w-9" />
    </motion.a>
  );
}

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("aromacraft-theme") === "dark";
  });
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { count: wishlistCount, hasHydrated: wishlistHydrated } = useWishlist();
  const { items, itemCount, subtotal, total, shipping, isOpen, closeCart, openCart, updateQuantity, hasHydrated: cartHydrated } = useCart();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAnnouncementIndex((current) => (current + 1) % announcements.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("aromacraft-theme", next ? "dark" : "light");
  };

  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.origin} ${product.country}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-(--page-bg) text-(--text-primary) transition-colors duration-300">
      <div className="border-b border-[#3d2d24]/20 bg-[#1a0f0a] px-3 py-2 text-center text-[11px] uppercase tracking-[0.3em] text-[#f6e5d1]" aria-live="polite">
        {announcements[announcementIndex]}
      </div>

      <header className={`sticky top-0 z-50 border-b border-black/10 bg-[#f9f6f0]/80 backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-[#1a0f0a]/90 ${isScrolled ? "shadow-[0_10px_40px_-24px_rgba(43,29,23,0.35)]" : "shadow-none"}`}>
        <div className={`mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-300 lg:px-8 ${isScrolled ? "py-3" : "py-4"}`}>
          <Link href="/" className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: -8, scale: 1.04 }}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d4a373] bg-[#1a0f0a] text-[#f9f6f0]"
            >
              <Sparkles size={18} />
            </motion.div>
            <div>
              <p className="font-serif text-lg font-semibold tracking-wide">AromaCraft</p>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#7a5b45] dark:text-[#d8b59a]">
                Handcrafted Coffee
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="text-sm font-medium text-[#3d2d24] transition hover:text-[#d4a373] dark:text-[#f9f6f0]">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center rounded-full border border-[#d4a373]/40 bg-white/80 px-3 py-2 shadow-sm md:flex">
              <Search size={16} className="text-[#7a5b45]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search roasts"
                className="w-28 bg-transparent px-2 text-sm outline-none"
              />
            </div>
            <button onClick={toggleTheme} className="rounded-full border border-[#d4a373]/40 bg-white/70 p-2.5 transition hover:-translate-y-0.5" aria-label="Toggle color theme">
              {darkMode ? <SunMedium size={16} /> : <MoonStar size={16} />}
            </button>
            <button onClick={() => setMobileMenuOpen((open) => !open)} className="rounded-full border border-[#d4a373]/40 bg-white/70 p-2.5 lg:hidden" aria-label="Toggle navigation menu">
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
            <button
              type="button"
              onClick={() => router.push('/wishlist')}
              className="relative rounded-full border border-[#d4a373]/40 bg-white/70 p-2.5"
              aria-label="View wishlist"
            >
              <Heart size={16} />
              {wishlistHydrated && wishlistCount > 0 ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-[#e76f51] px-1.5 py-0.5 text-[10px] text-white">
                  {wishlistCount}
                </span>
              ) : null}
            </button>
            <AnimatePresence mode="wait">
              {isAuthenticated ? (
                <motion.div
                  key="profile-trigger"
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="relative"
                >
                  <button
                    onMouseEnter={() => setProfileOpen(true)}
                    onMouseLeave={() => setProfileOpen(false)}
                    onClick={() => setProfileOpen((open) => !open)}
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#d4a373]/40 bg-[#1a0f0a] text-sm font-semibold text-[#f9f6f0]"
                  >
                    {user?.avatarUrl ? (
                      <Image src={user.avatarUrl} alt={user.username} width={40} height={40} unoptimized className="h-full w-full object-cover" />
                    ) : (
                      user?.firstName?.[0]?.toUpperCase() || "U"
                    )}
                  </button>
                  <AnimatePresence>
                    {profileOpen ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        onMouseEnter={() => setProfileOpen(true)}
                        onMouseLeave={() => setProfileOpen(false)}
                        className="absolute right-0 mt-3 w-56 rounded-2xl border border-[#d4a373]/20 bg-white p-3 shadow-xl dark:bg-[#22110c]"
                      >
                        <div className="flex items-center gap-3 rounded-xl bg-[#f9f6f0] p-3 dark:bg-[#2b1a13]">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#1a0f0a] text-sm font-semibold text-[#f9f6f0]">
                            {user?.avatarUrl ? (
                              <Image src={user.avatarUrl} alt={user.username} width={40} height={40} unoptimized className="h-full w-full object-cover" />
                            ) : (
                              user?.firstName?.[0]?.toUpperCase() || "U"
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1a0f0a] dark:text-[#f6e5d1]">{user?.username}</p>
                            <p className="text-xs text-[#7a5b45]">{user?.email}</p>
                          </div>
                        </div>
                        <div className="mt-3 space-y-2 text-sm">
                          <Link href="/dashboard" className="flex items-center gap-2 rounded-xl px-3 py-2 text-[#3d2d24] transition hover:bg-[#f9f6f0] dark:text-[#f6e5d1] dark:hover:bg-[#2b1a13]">
                            <LayoutGrid size={14} /> Dashboard
                          </Link>
                          <Link href="/dashboard" className="flex items-center gap-2 rounded-xl px-3 py-2 text-[#3d2d24] transition hover:bg-[#f9f6f0] dark:text-[#f6e5d1] dark:hover:bg-[#2b1a13]">
                            <Settings size={14} /> Settings
                          </Link>
                          <button
                            onClick={() => {
                              logout();
                              setProfileOpen(false);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[#e76f51] transition hover:bg-[#fff4f1]"
                          >
                            <LogOut size={14} /> Logout
                          </button>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div
                  key="signin-trigger"
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href="/login"
                    className="rounded-full border border-[#d4a373]/40 bg-white/70 px-3 py-2 text-sm font-semibold text-[#3d2d24] transition hover:-translate-y-0.5 dark:text-[#f9f6f0]"
                  >
                    Sign Up / Login
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => openCart()}
              className="relative rounded-full border border-[#d4a373]/40 bg-[#1a0f0a] p-2.5 text-[#f9f6f0]"
            >
              <ShoppingBag size={16} />
              {cartHydrated && itemCount > 0 ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-[#d4a373] px-1.5 py-0.5 text-[10px] text-[#1a0f0a]">
                  {itemCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-[#d4a373]/20 bg-[#fffaf4] px-4 py-4 lg:hidden dark:bg-[#1f130d]"
            >
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link key={item.label} href={item.href} className="rounded-full px-3 py-2 text-sm font-medium text-[#3d2d24] transition hover:bg-[#f6e8dc] dark:text-[#f9f6f0] dark:hover:bg-[#2f1f16]" onClick={() => setMobileMenuOpen(false)}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {query && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-auto mb-4 max-w-7xl rounded-2xl border border-[#d4a373]/30 bg-white/90 p-4 shadow-lg dark:bg-[#29130d]"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#7a5b45] dark:text-[#f6e5d1]">Instant matches</p>
                <button onClick={() => setQuery("")} className="text-sm text-[#e76f51]">Clear</button>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {filteredProducts.slice(0, 4).map((product) => (
                  <Link key={product.id} href={`/shop/${product.id}`} className="flex items-center justify-between rounded-xl border border-[#f0e3d5] bg-[#f9f6f0] p-3 dark:border-[#4d3126] dark:bg-[#22110c]">
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-[#7a5b45]">{product.country}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[#d4a373]">
                      <ArrowRight size={16} />
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>{children}</main>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="fixed right-0 top-0 z-60 flex h-full w-full max-w-md flex-col border-l border-[#d4a373]/30 bg-[#f9f6f0] p-6 shadow-2xl dark:bg-[#1a0f0a]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-serif text-2xl">Your Cart</p>
                <p className="text-sm text-[#7a5b45]">{itemCount} items selected</p>
              </div>
              <button onClick={() => closeCart()} className="rounded-full border border-[#d4a373]/40 p-2">×</button>
            </div>

            <div className="mt-8 rounded-2xl border border-[#d4a373]/20 bg-white/70 p-4 dark:bg-[#29130d]">
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-[#efe2d2]">
                <div className="h-2 w-3/4 rounded-full bg-[#e76f51]" />
              </div>
              <p className="mt-2 text-sm text-[#7a5b45]">{subtotal >= 50 ? "Free shipping unlocked" : `$${(50 - subtotal).toFixed(0)} away from free shipping`}</p>
            </div>

            <div className="mt-6 flex-1 rounded-2xl border border-[#d4a373]/20 bg-white/70 p-4 dark:bg-[#29130d]">
              {items.length === 0 ? (
                <p className="text-sm text-[#7a5b45]">Your cart is empty. Add a roast to get started.</p>
              ) : (
                items.map((item) => (
                  <div key={item.productId} className="mb-3 rounded-xl bg-[#1a0f0a] p-3 text-[#f9f6f0]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm opacity-80">{item.size ?? "250g"} · ${item.price.toFixed(2)} each</p>
                        <p className="mt-1 text-xs text-[#d4a373]">Line total: ${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="h-7 w-7 rounded-full bg-white/20"
                          aria-label={`Decrease quantity of ${item.name}`}
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          className="h-7 w-7 rounded-full bg-white/20"
                          aria-label={`Increase quantity of ${item.name}`}
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-[#7a5b45]">
              <span>Shipping</span>
              <span>${shipping.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between font-semibold text-[#1a0f0a] dark:text-[#f6e5d1]">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <Link href="/checkout" onClick={() => closeCart()} className="mt-6 flex items-center justify-center rounded-full bg-[#e76f51] px-4 py-3 font-semibold text-white">
              Checkout Securely <ArrowRight className="ml-2" size={16} />
            </Link>
          </motion.aside>
        )}
      </AnimatePresence>

      <footer className="border-t border-black/10 bg-[#1a0f0a] text-[#f6e5d1]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-4 lg:px-8">
          <section aria-labelledby="footer-branding">
            <p id="footer-branding" className="font-serif text-2xl">AromaCraft</p>
            <p className="mt-4 text-sm leading-7 text-[#d9c2a9]">
              Specialty coffee with traceable sourcing, slow roasting, and a luxury ritual for your daily cup.
            </p>
          </section>
          <nav aria-labelledby="footer-shop" className="space-y-3">
            <p id="footer-shop" className="font-semibold uppercase tracking-[0.3em] text-[#d4a373]">Shop</p>
            <ul className="mt-4 space-y-2 text-sm text-[#e8d8c0]">
              <li><Link href="/shop">Single Origin</Link></li>
              <li><Link href="/shop">Blends</Link></li>
              <li><Link href="/shop">Espresso</Link></li>
              <li><Link href="/shop">Subscriptions</Link></li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-support" className="space-y-3">
            <p id="footer-support" className="font-semibold uppercase tracking-[0.3em] text-[#d4a373]">Support</p>
            <ul className="mt-4 space-y-2 text-sm text-[#e8d8c0]">
              <li><Link href="/about">FAQs</Link></li>
              <li><Link href="/about">Shipping & Returns</Link></li>
              <li><a href="mailto:hello@aromacraft.com">hello@aromacraft.com</a></li>
            </ul>
          </nav>
          <section aria-labelledby="footer-stay-connected" className="space-y-3">
            <p id="footer-stay-connected" className="font-semibold uppercase tracking-[0.3em] text-[#d4a373]">Stay connected</p>
            <div className="mt-4 rounded-3xl border border-[#d4a373]/40 bg-white/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <NewsletterSubscriptionForm showDescription={false} id="newsletter-email-footer" />
            </div>
            <p className="text-sm text-[#d9c2a9]">Private offers and new release drops.</p>
          </section>
        </div>
        <div className="border-t border-white/10 px-4 py-4 text-sm text-[#d9c2a9] lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-sm uppercase tracking-[0.24em] text-[#d4a373]">Follow the ritual</p>
              <div className="flex flex-wrap gap-3" role="group" aria-label="Social links">
                {socialLinks.map((social) => (
                  <SocialAction key={social.label} label={social.label} href={social.href} animationData={social.animationData} />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <p>© 2026 AromaCraft. All rights reserved.</p>
              <div className="flex gap-4">
                <Link href="/about">Privacy</Link>
                <Link href="/about">Terms</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
