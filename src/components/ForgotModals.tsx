'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api, { handleApiError } from '@/lib/api-client';

type ModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ForgotPasswordModal({ open, onClose }: ModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSend() {
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setMessage('If an account exists, a reset link has been dispatched.');
    } catch (error) {
      const normalized = handleApiError(error, 'Unexpected error. Please try again later.');
      setMessage(normalized.message);
    }
    setLoading(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="relative z-10 w-full max-w-md rounded-2xl bg-[#FBF8F3] p-6 shadow-xl"
      >
        <h3 className="text-xl font-semibold text-[#1A120B] mb-2">Forgot Password</h3>
        <p className="text-sm text-[#2C1D11] mb-4">Enter your account email and we&apos;ll send a password reset link.</p>
        <input
          className="w-full rounded-lg border border-[#E6E0D6] p-3 mb-3 bg-white"
          placeholder="you@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />
        <div className="flex gap-3">
          <button
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[#1A120B] px-4 py-2 text-white"
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
          <button className="rounded-lg px-4 py-2" onClick={onClose}>
            Cancel
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-[#2C1D11]">{message}</p>}
      </motion.div>
    </div>
  );
}

export function ForgotUsernameModal({ open, onClose }: ModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRecover() {
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/api/auth/forgot-username', { email });
      setMessage('If an account exists, recovery instructions have been sent.');
    } catch (error) {
      const normalized = handleApiError(error, 'Unexpected error. Please try again later.');
      setMessage(normalized.message);
    }
    setLoading(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="relative z-10 w-full max-w-md rounded-2xl bg-[#FBF8F3] p-6 shadow-xl"
      >
        <h3 className="text-xl font-semibold text-[#1A120B] mb-2">Forgot Username</h3>
        <p className="text-sm text-[#2C1D11] mb-4">Enter your email and we&apos;ll send your username.</p>
        <input
          className="w-full rounded-lg border border-[#E6E0D6] p-3 mb-3 bg-white"
          placeholder="you@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />
        <div className="flex gap-3">
          <button
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[#1A120B] px-4 py-2 text-white"
            onClick={handleRecover}
            disabled={loading}
          >
            {loading ? 'Sending…' : 'Recover Username'}
          </button>
          <button className="rounded-lg px-4 py-2" onClick={onClose}>
            Cancel
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-[#2C1D11]">{message}</p>}
      </motion.div>
    </div>
  );
}
