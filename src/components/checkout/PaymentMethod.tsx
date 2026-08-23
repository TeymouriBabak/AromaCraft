'use client';

import { useState } from 'react';

export default function PaymentMethod({
  onChange,
}: {
  onChange: (method: {
    cardNumber: string;
    expiry: string;
    cvc: string;
  }) => void;
}) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handle = (next: {
    cardNumber?: string;
    expiry?: string;
    cvc?: string;
  }) => {
    const nextState = {
      cardNumber: next.cardNumber ?? cardNumber,
      expiry: next.expiry ?? expiry,
      cvc: next.cvc ?? cvc,
    };
    onChange(nextState);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block text-xs">Card number</span>
        <input
          aria-label="Card number"
          inputMode="numeric"
          className="w-full rounded-full border px-3 py-2"
          value={cardNumber}
          onChange={(e) => {
            setCardNumber(e.target.value);
            handle({ cardNumber: e.target.value });
          }}
          placeholder="4242 4242 4242 4242"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block text-xs">Expiry</span>
          <input
            aria-label="Card expiry"
            className="w-full rounded-full border px-3 py-2"
            value={expiry}
            onChange={(e) => {
              setExpiry(e.target.value);
              handle({ expiry: e.target.value });
            }}
            placeholder="MM/YY"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs">CVC</span>
          <input
            aria-label="Card CVC"
            inputMode="numeric"
            className="w-full rounded-full border px-3 py-2"
            value={cvc}
            onChange={(e) => {
              setCvc(e.target.value);
              handle({ cvc: e.target.value });
            }}
            placeholder="123"
          />
        </label>
      </div>
    </div>
  );
}
