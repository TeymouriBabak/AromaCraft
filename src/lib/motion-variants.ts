import { Variants } from 'framer-motion';

// Central motion system used across the app.
// Keep transitions conservative for accessibility and performance.
export const baseTransition = { duration: 0.36 };

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: baseTransition },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: baseTransition },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: baseTransition },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -18 },
  visible: { opacity: 1, x: 0, transition: baseTransition },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 18 },
  visible: { opacity: 1, x: 0, transition: baseTransition },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: baseTransition },
};

export const cardHover = {
  hover: {
    y: -8,
    scale: 1.02,
    boxShadow: '0 22px 48px rgba(16,12,10,0.22)',
    transition: { duration: 0.24 },
  },
  tap: { scale: 0.985, transition: { duration: 0.12 } },
};

export const imageScale = {
  hover: { scale: 1.05, transition: { duration: 0.36 } },
  rest: { scale: 1, transition: { duration: 0.36 } },
};

export const floating: Variants = {
  float: {
    y: [0, -6, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'linear' },
  },
};

export const softGlow: Variants = {
  pulse: {
    boxShadow: [
      '0 0 0 rgba(0,0,0,0)',
      '0 0 20px rgba(212,163,115,0.18)',
      '0 0 0 rgba(0,0,0,0)',
    ],
    transition: { duration: 2, repeat: Infinity },
  },
};

export const shimmer: Variants = {
  animate: {
    backgroundPosition: ['0% 50%', '100% 50%'],
    transition: { duration: 1.6, repeat: Infinity, ease: 'linear' },
  },
};

const variants = {
  baseTransition,
  staggerContainer,
  staggerItem,
  fadeUp,
  fadeIn,
  slideInLeft,
  slideInRight,
  scaleIn,
  cardHover,
  imageScale,
  floating,
  softGlow,
  shimmer,
};

export default variants;
