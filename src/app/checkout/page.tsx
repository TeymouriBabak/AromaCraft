'use client';

import { Suspense, type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { useCart } from '@/components/cart-context';
import api from '@/lib/api-client';
import { z } from 'zod';
import SecureAuthForm from '@/components/secure-auth-form';
import OrderSummary from '@/components/checkout/OrderSummary';
import ShippingDetails from '@/components/checkout/ShippingDetails';
import PaymentMethod from '@/components/checkout/PaymentMethod';
import ErrorBoundary from '@/components/ErrorBoundary';
import Toast from '@/components/Toast';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import variants from '@/lib/motion-variants';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [fullName, setFullName] = useState<string>(
    user ? `${user.firstName} ${user.lastName}`.trim() : ''
  );
  const [email, setEmail] = useState<string>(user?.email ?? '');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    tone?: 'info' | 'error' | 'success';
  } | null>(null);

  const displayFullName =
    fullName || (user ? `${user.firstName} ${user.lastName}`.trim() : '');
  const displayEmail = email || (user?.email ?? '');

  const hasItems = items.length > 0;
  const reduceMotion = useReducedMotion();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusError(null);
    setStatusMessage(null);

    if (!hasItems) {
      setStatusError(
        'Your cart is empty. Add some coffee before placing an order.'
      );
      return;
    }

    if (!fullName.trim() || !email.trim() || !address.trim()) {
      setStatusError(
        'Please complete all required fields before placing your order.'
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatusError('Enter a valid email address.');
      return;
    }

    if (!isAuthenticated) {
      // If not authenticated, show the embedded auth form (user should sign in inline)
      setStatusError('Please sign in to place your order.');
      return;
    }

    // client-side validation using zod before sending
    const OrderPayload = z.object({
      fullName: z.string().min(1),
      email: z.string().email(),
      address: z.string().min(1),
      items: z
        .array(
          z.object({
            productId: z.number(),
            name: z.string(),
            price: z.number(),
            quantity: z.number().min(1),
          })
        )
        .min(1),
    });
    const parsed = OrderPayload.safeParse({
      fullName: fullName.trim(),
      email: email.trim(),
      address: address.trim(),
      items,
    });
    if (!parsed.success) {
      setStatusError(
        parsed.error.errors.map((e) => e.message).join(' ') ||
          'Validation failed.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/api/orders/create', {
        fullName: fullName.trim(),
        email: email.trim(),
        address: address.trim(),
        items,
      });
      clearCart();
      setStatusMessage(
        'Order placed successfully. Redirecting to thank you page...'
      );
      setToast({ message: 'Order placed successfully', tone: 'success' });
      router.push('/thank-you');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to place your order right now.';
      setStatusError(message);
      setToast({ message, tone: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          Loading checkout…
        </div>
      }
    >
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-4xl border border-[#d4a373]/20 bg-white/70 p-8 shadow-sm dark:bg-[#23110c]">
            <h1 className="font-serif text-3xl text-[#1a0f0a] dark:text-[#f6e5d1]">
              Checkout
            </h1>
            <p className="mt-4 text-sm text-[#6e4b33] dark:text-[#e8d8c0]">
              Complete your shipping details and place your order securely.
            </p>

            <div className="mt-6 grid gap-6">
              <AnimatePresence mode="wait">
                {!isAuthenticated ? (
                  <motion.div
                    key="auth"
                    initial={
                      reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }
                    }
                    animate={
                      reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
                    }
                    exit={{ opacity: 0 }}
                    variants={variants.fadeUp}
                  >
                    <p className="mb-4 text-sm text-[#6e4b33]">
                      Sign in to continue with checkout.
                    </p>
                    <SecureAuthForm
                      onAuthenticated={() => {
                        setStatusError(null);
                        setToast({
                          message: 'Signed in — continue your checkout',
                          tone: 'success',
                        });
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={
                      reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }
                    }
                    animate={
                      reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
                    }
                    exit={{ opacity: 0 }}
                    variants={variants.fadeUp}
                  >
                    <ErrorBoundary>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <ShippingDetails
                          fullName={displayFullName}
                          email={displayEmail}
                          address={address}
                          onChange={({
                            fullName: fn,
                            email: em,
                            address: addr,
                          }) => {
                            setFullName(fn);
                            setEmail(em);
                            setAddress(addr);
                          }}
                        />

                        <PaymentMethod onChange={() => {}} />

                        {statusError ? (
                          <div className="rounded-2xl border border-[#e76f51]/20 bg-[#fff1ef] p-4 text-sm text-[#b74930]">
                            {statusError}
                          </div>
                        ) : null}
                        {statusMessage ? (
                          <div className="rounded-2xl border border-[#4f772f]/20 bg-[#eef7e8] p-4 text-sm text-[#2f5b33]">
                            {statusMessage}
                          </div>
                        ) : null}

                        <button
                          type="submit"
                          disabled={!hasItems || isSubmitting}
                          className="mt-2 w-full rounded-full bg-[#e76f51] px-4 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmitting ? 'Placing order…' : 'Place Order'}
                        </button>
                      </form>
                    </ErrorBoundary>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <OrderSummary />
        </div>
        {toast ? (
          <Toast
            message={toast.message}
            tone={toast.tone}
            onClose={() => setToast(null)}
          />
        ) : null}
      </div>
    </Suspense>
  );
}
