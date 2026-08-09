"use client";

import { motion } from "framer-motion";
import { useRef } from "react";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
};

const OTP_LENGTH = 6;

export default function OtpInput({ value, onChange, disabled = false, error = false }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? "");

  const updateValue = (index: number, nextDigit: string) => {
    const nextValue = value.split("");
    nextValue[index] = nextDigit;
    const cleaned = nextValue.join("").slice(0, OTP_LENGTH);
    onChange(cleaned);
  };

  const handleChange = (index: number, raw: string) => {
    const next = raw.replace(/\D/g, "").slice(-1);
    if (!next) {
      updateValue(index, "");
      return;
    }

    updateValue(index, next);
    if (index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = (event.clipboardData.getData('text') ?? '').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    const nextValue = Array.from({ length: OTP_LENGTH }, (_, digitIndex) => {
      const char = pasted[digitIndex] ?? '';
      return digitIndex < value.length ? value[digitIndex] : char;
    });

    const digitsToApply = pasted.split('').slice(0, OTP_LENGTH);
    const merged = Array.from({ length: OTP_LENGTH }, (_, digitIndex) => digitsToApply[digitIndex] ?? '');
    onChange(merged.join(''));

    const nextIndex = Math.min(merged.filter(Boolean).length, OTP_LENGTH - 1);
    refs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "Backspace" && value[index]) {
      updateValue(index, "");
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  return (
    <motion.div
      animate={error ? { x: [0, -6, 6, -4, 4, 0], scale: [1, 1.02, 1] } : { scale: 1 }}
      transition={{ duration: 0.28 }}
      className="flex justify-center gap-2 sm:gap-3"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          value={digit}
          maxLength={1}
          inputMode="numeric"
          pattern="[0-9]*"
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          className={`h-12 w-12 rounded-2xl border text-center text-lg font-semibold outline-none transition-all sm:h-14 sm:w-14 ${
            error
              ? "border-[#e76f51] bg-[#fff7f5] shadow-[0_0_0_2px_rgba(231,111,81,0.15)]"
              : "border-[#d4a373]/25 bg-[#f9f6f0] text-[#1a0f0a] focus:border-[#c9854d] focus:ring-2 focus:ring-[#d4a373]/25 dark:bg-[#23110c] dark:text-[#f6e5d1]"
          }`}
        />
      ))}
    </motion.div>
  );
}
