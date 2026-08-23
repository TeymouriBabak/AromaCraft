'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Star, Heart, Eye, TrendingUp, Flame } from 'lucide-react';
import type { Product } from '@/lib/shop-products';
import { COFFEE_BRANDS } from '@/data/coffee-brands';
import { useState } from 'react';
import { DecisionHelper } from './decision-helpers';
import variants from '@/lib/motion-variants';
import { formatCurrency } from '@/lib/currency';

interface ProductCardProps {
  product: Product;
  index?: number;
  onQuickView?: (product: Product) => void;
  onWishlist?: (productId: number) => void;
  isWishlisted?: boolean;
}

export function ProductCard({
  product,
  index = 0,
  onQuickView,
  onWishlist,
  isWishlisted = false,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const reduceMotion = useReducedMotion();

  const brandInfo = COFFEE_BRANDS.find((b) => b.id === product.brand);
  const hasVariants = product.grindTypes.length > 1;
  const isBestSeller = product.specialTags.includes('Best Seller');
  const isNewArrival = product.specialTags.includes('New Arrival');
  const discountPercent = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const handleWishlist = () => {
    onWishlist?.(product.id);
  };

  return (
    <motion.article
      initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      whileInView={reduceMotion ? undefined : 'visible'}
      viewport={{ once: true }}
      animate={reduceMotion ? undefined : 'visible'}
      variants={variants.fadeUp}
      custom={index}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={reduceMotion ? undefined : variants.cardHover.hover}
      whileTap={variants.cardHover.tap}
      style={{ transformOrigin: 'center' }}
      className={`group overflow-hidden rounded-[1.75rem] border border-[#d4a373]/20 bg-white/80 shadow-sm transition-all duration-300 dark:bg-[#23110c] ${isHovered ? 'glow-edge' : ''}`}
    >
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden bg-linear-to-br from-[#efe2d2] to-[#e0d0c0]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,163,115,0.35),transparent_60%)]" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {isBestSeller && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="flex items-center gap-1 rounded-full bg-[#e76f51]/90 px-3 py-1 text-xs font-bold text-white badge-shimmer"
            >
              <TrendingUp size={12} />
              Best Seller
            </motion.div>
          )}
          {isNewArrival && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-full bg-[#f4a261]/90 px-3 py-1 text-xs font-bold text-white"
            >
              New Arrival
            </motion.div>
          )}
          {discountPercent > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="rounded-full bg-[#d4a373] px-3 py-1 text-xs font-bold text-white badge-shimmer"
            >
              -{discountPercent}%
            </motion.div>
          )}
        </div>

        {/* Brand Badge (logo + name) */}
        {brandInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute right-3 top-3 flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-semibold text-white shadow-lg"
            style={{ backgroundColor: brandInfo.color }}
            aria-hidden
          >
            {brandInfo.logo ? (
              <Image
                src={brandInfo.logo}
                alt=""
                width={20}
                height={20}
                unoptimized
                className="h-5 w-5 rounded-sm object-contain"
              />
            ) : null}
            <span className="sr-only">Brand:</span>
            <span aria-hidden>{brandInfo.displayName}</span>
          </motion.div>
        )}

        {/* Stock Indicator */}
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <span className="text-sm font-semibold text-white">
              Out of Stock
            </span>
          </div>
        )}

        {/* Product Image Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={
              reduceMotion
                ? undefined
                : isHovered
                  ? { scale: 1.05, rotate: 2 }
                  : { scale: 1, rotate: 0 }
            }
            transition={{ duration: 0.36 }}
            className="h-36 w-28 rounded-[1.2rem] border border-[#8c5e3d] bg-[#1a0f0a] text-center text-[#f6e5d1] shadow-2xl overflow-hidden"
          >
            <div className="flex h-full flex-col items-center justify-center">
              <Flame size={24} className="mb-2 text-[#d4a373]" />
              <div className="text-xs uppercase tracking-[0.2em]">
                {product.country}
              </div>
              <div className="mt-2 font-serif text-xs">{product.roast}</div>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={
            reduceMotion
              ? undefined
              : isHovered
                ? { opacity: 1 }
                : { opacity: 0 }
          }
          transition={{ duration: 0.18 }}
          className="absolute inset-0 flex items-end justify-center gap-2 bg-linear-to-t from-black/50 to-transparent p-4"
        >
          <button
            onClick={() => onQuickView?.(product)}
            className="rounded-full bg-white/90 p-2 text-[#1a0f0a] transition hover:bg-white hover:shadow-lg"
            aria-label="Quick view"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={handleWishlist}
            className={`rounded-full p-2 transition ${
              isWishlisted
                ? 'bg-[#e76f51] text-white'
                : 'bg-white/90 text-[#1a0f0a] hover:bg-white hover:shadow-lg'
            }`}
            aria-label={
              isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
            }
          >
            <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Brand + Coffee Type */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {brandInfo && (
              <span
                className="text-xs font-bold uppercase tracking-[0.35em] text-white"
                style={{
                  backgroundColor: brandInfo.color,
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {brandInfo.displayName}
              </span>
            )}
            <span className="text-xs uppercase tracking-[0.35em] text-[#d4a373]">
              {product.coffeeType}
            </span>
          </div>
          <span className="rounded-full bg-[#f9f6f0] px-2 py-1 text-xs font-medium text-[#6e4b33] dark:bg-[#1a0f0a] dark:text-[#e8d8c0]">
            {product.roast}
          </span>
        </div>

        {/* Product Name */}
        <h3 className="mb-1 font-serif text-lg font-semibold text-[#1a0f0a] dark:text-[#f6e5d1] line-clamp-2">
          {product.name}
        </h3>

        {/* Origin + Size */}
        <p className="mb-3 text-xs text-[#9a7c6b] dark:text-[#b5988a]">
          {product.origin} • {product.size}
        </p>

        {/* Flavor Notes */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {product.tastingNotes.slice(0, 2).map((note) => (
            <span
              key={note}
              className="rounded-full bg-[#f9f6f0] px-2 py-1 text-xs text-[#6e4b33] dark:bg-[#1a0f0a] dark:text-[#e8d8c0]"
            >
              {note}
            </span>
          ))}
        </div>

        {/* Body/Acidity/Sweetness Indicators */}
        <DecisionHelper product={product} />

        {/* Rating */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-[#d4a373] text-[#d4a373]" />
            <span className="font-semibold text-[#1a0f0a] dark:text-[#f6e5d1]">
              {product.rating.toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-[#9a7c6b] dark:text-[#b5988a]">
            ({product.reviews} reviews)
          </span>
        </div>

        {/* Price & Subscription */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-semibold text-[#1a0f0a] dark:text-[#f6e5d1]">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-[#9a7c6b] line-through dark:text-[#b5988a]">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
          {product.subscriptionEligible && product.subscriptionSavings && (
            <p className="mt-1 text-xs text-[#d4a373]">
              Save {formatCurrency(product.subscriptionSavings)}/month with
              subscription
            </p>
          )}
        </div>

        {/* CTA Button */}
        <Link href={`/shop/${product.id}`} className="block w-full">
          <motion.div
            className="flex items-center justify-center rounded-full bg-[#1a0f0a] px-4 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-[#e76f51] hover:shadow-lg dark:text-[#f6e5d1]"
            role="link"
            aria-label={hasVariants ? 'Choose options' : 'Add to cart'}
          >
            <span>{hasVariants ? 'Choose Options' : 'Add to Cart'}</span>
            <motion.span
              animate={{ x: isHovered ? 8 : 0 }}
              transition={{ duration: 0.18 }}
              className="ml-2"
            >
              →
            </motion.span>
          </motion.div>
        </Link>
      </div>
    </motion.article>
  );
}
