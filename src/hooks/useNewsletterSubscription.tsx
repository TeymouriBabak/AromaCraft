'use client';

import { useCallback, useMemo, useState } from 'react';
import api from '@/lib/api-client';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubscriptionStatus = 'idle' | 'pending' | 'success' | 'error';

export function useNewsletterSubscription() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<SubscriptionStatus>('idle');
  const [message, setMessage] = useState('');

  const isEmailValid = useMemo(() => EMAIL_PATTERN.test(email.trim()), [email]);

  const subscribe = useCallback(async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setMessage('Please enter an email address.');
      setStatus('error');
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setMessage('Enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('pending');
    setMessage('');

    try {
      await api.post<{ email: string; message: string }>(
        '/api/newsletter/subscribe',
        { email: normalizedEmail }
      );
      setMessage(`Subscribed with ${normalizedEmail}.`);
      setStatus('success');
      setEmail('');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to subscribe at the moment.';
      setMessage(errorMessage);
      setStatus('error');
    }
  }, [email]);

  return {
    email,
    setEmail,
    status,
    message,
    isEmailValid,
    subscribe,
  } as const;
}
