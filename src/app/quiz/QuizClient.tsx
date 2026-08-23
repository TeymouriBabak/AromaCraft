'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, Bean, Sparkles, CheckCircle2 } from 'lucide-react';
import type { Product } from '@/lib/shop-products';
import { ProductCard } from '@/components/product-card';

type QuizOption = {
  id: string;
  label: string;
  profile: string;
  tags: string[];
};

type QuizQuestion = {
  id: string;
  prompt: string;
  description: string;
  options: QuizOption[];
};

const quizQuestions: QuizQuestion[] = [
  {
    id: 'brew',
    prompt: 'How do you usually brew your coffee?',
    description:
      'Your ritual matters. The best match depends on how you like to make it.',
    options: [
      {
        id: 'espresso',
        label: 'Espresso or milk-based drinks',
        profile: 'bold',
        tags: ['espresso', 'dark', 'rich'],
      },
      {
        id: 'pour-over',
        label: 'Pour-over or drip',
        profile: 'bright',
        tags: ['light', 'clean', 'aromatic'],
      },
      {
        id: 'french-press',
        label: 'French press',
        profile: 'full-bodied',
        tags: ['medium', 'body', 'depth'],
      },
      {
        id: 'cold-brew',
        label: 'Cold brew or iced',
        profile: 'smooth',
        tags: ['smooth', 'sweet', 'refreshing'],
      },
    ],
  },
  {
    id: 'roast',
    prompt: 'Which roast profile feels right to you?',
    description: 'The roast level changes sweetness, body, and intensity.',
    options: [
      {
        id: 'light',
        label: 'Light and vibrant',
        profile: 'bright',
        tags: ['light', 'bright', 'floral'],
      },
      {
        id: 'medium',
        label: 'Balanced and easygoing',
        profile: 'balanced',
        tags: ['medium', 'balanced', 'versatile'],
      },
      {
        id: 'dark',
        label: 'Bold and dramatic',
        profile: 'bold',
        tags: ['dark', 'bold', 'intense'],
      },
    ],
  },
  {
    id: 'strength',
    prompt: 'How strong do you want your coffee to feel?',
    description:
      'Some mornings call for a gentle lift, others a full wake-up signal.',
    options: [
      {
        id: 'gentle',
        label: 'Gentle and mellow',
        profile: 'soft',
        tags: ['soft', 'gentle', 'smooth'],
      },
      {
        id: 'balanced',
        label: 'Balanced and energizing',
        profile: 'balanced',
        tags: ['balanced', 'steady', 'daily'],
      },
      {
        id: 'strong',
        label: 'Bold and wake-up strong',
        profile: 'bold',
        tags: ['bold', 'strong', 'powerful'],
      },
    ],
  },
  {
    id: 'flavor',
    prompt: 'Which flavor direction sounds most appealing?',
    description: 'Flavor is the clearest guide to the right cup.',
    options: [
      {
        id: 'sweet',
        label: 'Sweet, caramel, and creamy',
        profile: 'sweet',
        tags: ['sweet', 'caramel', 'creamy'],
      },
      {
        id: 'fruity',
        label: 'Fruity, floral, and citrusy',
        profile: 'bright',
        tags: ['fruity', 'floral', 'citrus'],
      },
      {
        id: 'chocolate',
        label: 'Chocolate, nutty, and deep',
        profile: 'rich',
        tags: ['chocolate', 'nutty', 'deep'],
      },
    ],
  },
  {
    id: 'acidity',
    prompt: 'Do you enjoy acidity or prefer a smoother finish?',
    description:
      'Acidity gives lift; a softer finish feels rounder and gentler.',
    options: [
      {
        id: 'bright',
        label: 'I like bright, vivid acidity',
        profile: 'bright',
        tags: ['bright', 'lively', 'acidic'],
      },
      {
        id: 'balanced',
        label: 'I like a balanced middle ground',
        profile: 'balanced',
        tags: ['balanced', 'rounded', 'smooth'],
      },
      {
        id: 'smooth',
        label: 'I prefer smooth and low-acid',
        profile: 'smooth',
        tags: ['smooth', 'soft', 'mellow'],
      },
    ],
  },
  {
    id: 'format',
    prompt: 'What format do you usually enjoy most?',
    description: 'The right format can change the entire experience.',
    options: [
      {
        id: 'whole-bean',
        label: 'Whole bean for freshness',
        profile: 'fresh',
        tags: ['whole bean', 'fresh', 'premium'],
      },
      {
        id: 'ground',
        label: 'Ground for convenience',
        profile: 'convenient',
        tags: ['ground', 'convenient', 'easy'],
      },
      {
        id: 'capsules',
        label: 'Capsules or quick brew',
        profile: 'easy',
        tags: ['capsules', 'quick', 'effortless'],
      },
    ],
  },
  {
    id: 'occasion',
    prompt: 'Is this coffee mainly for daily drinking or a special ritual?',
    description:
      'Daily drivers and special-occasion roasts are often very different.',
    options: [
      {
        id: 'daily',
        label: 'Daily driver for everyday rituals',
        profile: 'daily',
        tags: ['daily', 'reliable', 'balanced'],
      },
      {
        id: 'occasion',
        label: 'A special treat for slow mornings',
        profile: 'occasion',
        tags: ['special', 'luxury', 'treat'],
      },
    ],
  },
];

const getRecommendation = (answers: QuizOption[]) => {
  const scores = answers.reduce<Record<string, number>>((acc, answer) => {
    answer.tags.forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});

  const topProfile =
    Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'balanced';

  if (
    topProfile.includes('espresso') ||
    topProfile.includes('dark') ||
    topProfile.includes('bold')
  ) {
    return {
      title: 'Bold Espresso-Lover Profile',
      headline: 'You’re built for rich, intense coffee.',
      description:
        'Your answers point toward a bold cup with depth, structure, and serious character. A darker roast or espresso-style profile will feel most rewarding, especially if you enjoy strong flavor and a fuller finish.',
      accent: 'dark',
    };
  }

  if (
    topProfile.includes('bright') ||
    topProfile.includes('floral') ||
    topProfile.includes('citrus') ||
    topProfile.includes('fruity')
  ) {
    return {
      title: 'Bright & Floral Profile',
      headline: 'You’re drawn to clarity and lift.',
      description:
        'You seem to enjoy a lively cup with elegant acidity, delicate aromatics, and vibrant flavor. Light or medium roasts with fruit-forward notes will feel especially satisfying.',
      accent: 'bright',
    };
  }

  if (
    topProfile.includes('smooth') ||
    topProfile.includes('sweet') ||
    topProfile.includes('caramel') ||
    topProfile.includes('creamy')
  ) {
    return {
      title: 'Smooth & Sweet Profile',
      headline: 'You prefer comfort with elegance.',
      description:
        'Your taste leans toward a softer, sweeter cup with gentle body and a rounded finish. A medium roast with caramel, cocoa, or vanilla notes will likely become your daily favorite.',
      accent: 'sweet',
    };
  }

  return {
    title: 'Balanced Daily Driver Profile',
    headline: 'You’ll love a versatile, dependable cup.',
    description:
      'You seem to want something that can work beautifully every day: balanced, flavorful, and easy to love. A medium roast with approachable sweetness and a polished finish is the best fit.',
    accent: 'balanced',
  };
};

const getMatchingProducts = (answers: QuizOption[], products: Product[]) => {
  const profile = getRecommendation(answers).accent;

  return products
    .filter((product) => {
      const text =
        `${product.name} ${product.description} ${product.tastingNotes.join(' ')} ${product.roast} ${product.coffeeType}`.toLowerCase();

      if (profile === 'dark') {
        return (
          text.includes('espresso') ||
          text.includes('dark') ||
          text.includes('chocolate') ||
          product.roast === 'Dark'
        );
      }

      if (profile === 'bright') {
        return (
          text.includes('citrus') ||
          text.includes('floral') ||
          text.includes('berry') ||
          product.roast === 'Light'
        );
      }

      if (profile === 'sweet') {
        return (
          text.includes('caramel') ||
          text.includes('vanilla') ||
          text.includes('toffee') ||
          text.includes('sweet') ||
          product.roast === 'Medium'
        );
      }

      return (
        product.roast === 'Medium' ||
        text.includes('blend') ||
        text.includes('balanced')
      );
    })
    .slice(0, 3);
};

export default function QuizClient({ products }: { products: Product[] }) {
  const shouldReduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentQuestion = quizQuestions[step];

  const recommendation = useMemo(() => getRecommendation(answers), [answers]);
  const matchingProducts = useMemo(
    () => getMatchingProducts(answers, products),
    [answers, products]
  );

  const handleSelect = (option: QuizOption) => {
    setSelectedOption(option.id);
  };

  const handleContinue = () => {
    if (!selectedOption) return;

    const chosenOption = currentQuestion.options.find(
      (option) => option.id === selectedOption
    );
    if (!chosenOption) return;

    const nextAnswers = [...answers, chosenOption];
    setAnswers(nextAnswers);

    if (step < quizQuestions.length - 1) {
      setStep(step + 1);
      setSelectedOption(null);
    } else {
      setIsLoading(true);
      window.setTimeout(() => {
        setIsLoading(false);
        setIsComplete(true);
      }, 1000);
    }
  };

  const progress = ((step + 1) / quizQuestions.length) * 100;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-4xl border border-[#d4a373]/20 bg-[#f9f6f0] p-6 shadow-sm sm:p-8 lg:p-10 dark:bg-[#23110c]"
      >
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.35em] text-[#d4a373]">
            Coffee Finder
          </p>
          <h1 className="mt-3 font-serif text-4xl text-[#1a0f0a] dark:text-[#f6e5d1] sm:text-5xl">
            Find your perfect cup with a luxury coffee quiz
          </h1>
          <p className="mt-4 text-lg leading-8 text-[#6e4b33] dark:text-[#e8d8c0]">
            Answer a few thoughtful questions and we’ll match you with a roast
            profile and products that feel tailored to your taste.
          </p>
        </div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="mt-8 rounded-[1.75rem] border border-[#d4a373]/20 bg-white/80 p-5 shadow-sm sm:p-8 dark:bg-[#1a0f0a]"
        >
          {!isComplete ? (
            <>
              <div className="flex items-center justify-between text-sm text-[#7a5b45]">
                <span>
                  Step {step + 1} of {quizQuestions.length}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-[#efe2d2]">
                <div
                  className="h-2 rounded-full bg-[#e76f51] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                  animate={
                    shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
                  }
                  exit={
                    shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }
                  }
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-8"
                >
                  <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-[#b56e3b]">
                    <Bean size={15} />
                    Recommendation quiz
                  </div>
                  <h2 className="mt-3 font-serif text-2xl text-[#1a0f0a] dark:text-[#f6e5d1] sm:text-3xl">
                    {currentQuestion.prompt}
                  </h2>
                  <p className="mt-3 text-base leading-7 text-[#6e4b33] dark:text-[#e8d8c0]">
                    {currentQuestion.description}
                  </p>

                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    {currentQuestion.options.map((option) => {
                      const isSelected = selectedOption === option.id;
                      return (
                        <motion.button
                          key={option.id}
                          type="button"
                          onClick={() => handleSelect(option)}
                          whileHover={
                            shouldReduceMotion
                              ? undefined
                              : { y: -3, scale: 1.01 }
                          }
                          whileTap={
                            shouldReduceMotion ? undefined : { scale: 0.98 }
                          }
                          className={`rounded-[1.15rem] border px-4 py-4 text-left transition-all ${
                            isSelected
                              ? 'border-[#c9854d] bg-[#f7ebdb] shadow-[0_10px_25px_-16px_rgba(43,29,23,0.35)]'
                              : 'border-[#d4a373]/30 bg-[#f9f6f0] hover:border-[#c9854d] dark:bg-[#23110c]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-sm font-semibold text-[#1a0f0a] dark:text-[#f6e5d1]">
                              {option.label}
                            </span>
                            {isSelected ? (
                              <CheckCircle2
                                size={18}
                                className="text-[#c9854d]"
                              />
                            ) : null}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 flex items-center justify-between gap-3">
                <p className="text-sm text-[#7a5b45] dark:text-[#e8d8c0]">
                  Choose the option that feels most like you.
                </p>
                <motion.button
                  type="button"
                  onClick={handleContinue}
                  disabled={!selectedOption}
                  whileHover={
                    shouldReduceMotion || !selectedOption
                      ? undefined
                      : { y: -2, scale: 1.01 }
                  }
                  whileTap={
                    shouldReduceMotion || !selectedOption
                      ? undefined
                      : { scale: 0.98 }
                  }
                  className="inline-flex items-center rounded-full bg-[#1a0f0a] px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[#c7b39a]"
                >
                  {step === quizQuestions.length - 1
                    ? 'See my match'
                    : 'Continue'}
                  <ArrowRight className="ml-2" size={16} />
                </motion.button>
              </div>
            </>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="rounded-full border-4 border-[#d4a373] border-t-transparent p-6"
              >
                <Sparkles size={24} className="text-[#e76f51]" />
              </motion.div>
              <p className="mt-6 text-lg text-[#6e4b33] dark:text-[#e8d8c0]">
                Curating your perfect coffee pairing…
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={
                  shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
                }
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-3xl border border-[#d4a373]/20 bg-[#f9f6f0] p-6 dark:bg-[#23110c]"
              >
                <p className="text-sm uppercase tracking-[0.3em] text-[#b56e3b]">
                  Your recommendation
                </p>
                <h2 className="mt-3 font-serif text-3xl text-[#1a0f0a] dark:text-[#f6e5d1]">
                  {recommendation.title}
                </h2>
                <p className="mt-3 text-lg font-semibold text-[#1a0f0a] dark:text-[#f6e5d1]">
                  {recommendation.headline}
                </p>
                <p className="mt-3 text-base leading-8 text-[#5f473d] dark:text-[#e8d8c0]">
                  {recommendation.description}
                </p>
              </motion.div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-serif text-2xl text-[#1a0f0a] dark:text-[#f6e5d1]">
                    Matching products
                  </h3>
                  <Link
                    href="/shop"
                    className="text-sm font-semibold text-[#b56e3b]"
                  >
                    Visit shop
                  </Link>
                </div>
                <div className="mt-5 grid gap-6 lg:grid-cols-3">
                  {matchingProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={
                        shouldReduceMotion ? false : { opacity: 0, y: 12 }
                      }
                      animate={
                        shouldReduceMotion
                          ? { opacity: 1 }
                          : { opacity: 1, y: 0 }
                      }
                      transition={{
                        duration: 0.45,
                        delay: index * 0.08,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="h-full"
                    >
                      <ProductCard product={product} index={0} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
