import { parsePhoneNumber } from 'libphonenumber-js';
import { z } from 'zod';

export type LoginMode = 'email' | 'username';
export type LoginRole = 'customer' | 'manager' | 'admin';

export type LoginFormValues = {
  loginMode: LoginMode;
  role: LoginRole;
  identifier: string;
  password: string;
};

export type SignupFormValues = {
  firstName: string;
  lastName: string;
  gender: string;
  username: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
  avatarUrl?: string;
};

export const loginSchema = z.object({
  loginMode: z.enum(['email', 'username']),
  role: z.enum(['customer', 'manager', 'admin']),
  identifier: z.string().trim().min(1, 'Please enter your email or username.'),
  password: z.string().trim().min(1, 'Please enter your password.'),
});

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required.'),
    lastName: z.string().trim().min(1, 'Last name is required.'),
    gender: z.string().trim().min(1, 'Choose a gender option.'),
    username: z
      .string()
      .trim()
      .min(4, 'Username must be at least 4 characters.')
      .regex(/(?=.*[A-Z])/, 'Username needs at least one uppercase letter.')
      .regex(/(?=.*[a-z])/, 'Username needs at least one lowercase letter.')
      .regex(/(?=.*\d)/, 'Username needs at least one digit.'),
    mobile: z.string().trim().min(1, 'Mobile number is required.'),
    email: z.string().trim().email('Enter a valid email address.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[A-Z]/, 'Password needs an uppercase letter.')
      .regex(/[a-z]/, 'Password needs a lowercase letter.')
      .regex(/\d/, 'Password needs a number.')
      .regex(/[^A-Za-z0-9]/, 'Password needs a special character.'),
    confirmPassword: z.string().trim().min(1, 'Please confirm your password.'),
    avatarUrl: z.string().optional(),
  })
  .superRefine(({ mobile, password, confirmPassword }, ctx) => {
    if (!isPhoneNumberValid(mobile)) {
      ctx.addIssue({
        path: ['mobile'],
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid phone number.',
      });
    }

    if (password !== confirmPassword) {
      ctx.addIssue({
        path: ['confirmPassword'],
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match.',
      });
    }
  });

export function normalizePhoneNumber(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  let candidate = trimmed.replace(/\s+/g, ' ');
  candidate = candidate.replace(/\s*\+\s*/g, '+');
  candidate = candidate.replace(/[^\d+()\-\s]/g, '');

  if (!candidate) return '';

  const digitsOnly = candidate.replace(/\D/g, '');
  if (!digitsOnly) return '';

  if (candidate.startsWith('00')) {
    candidate = `+${candidate.slice(2)}`;
  } else if (!candidate.startsWith('+')) {
    candidate = `+${digitsOnly}`;
  }

  try {
    const parsed = parsePhoneNumber(candidate);
    if (parsed && typeof parsed.isValid === 'function' && parsed.isValid() && parsed.number) {
      return parsed.number;
    }
  } catch {
    // fallback below when libphonenumber metadata is unavailable in this runtime
  }

  const normalized = candidate.replace(/\D/g, '');
  if (/^\+?[1-9]\d{7,14}$/.test(`+${normalized}`)) {
    return `+${normalized}`;
  }

  return candidate.replace(/\s+/g, '');
}

export function isPhoneNumberValid(value: string): boolean {
  const normalized = normalizePhoneNumber(value);
  if (!normalized) return false;

  try {
    const parsed = parsePhoneNumber(normalized);
    if (parsed && typeof parsed.isValid === 'function' && parsed.isValid()) {
      return true;
    }
  } catch {
    // fallback below when libphonenumber metadata is unavailable in this runtime
  }

  const sanitized = normalized.replace(/\s+/g, '');
  return /^\+?[1-9]\d{7,14}$/.test(sanitized);
}

export function isSignupFormReady(values: Partial<SignupFormValues>): boolean {
  const safeValues = {
    firstName: values.firstName ?? '',
    lastName: values.lastName ?? '',
    gender: values.gender ?? '',
    username: values.username ?? '',
    mobile: values.mobile ?? '',
    email: values.email ?? '',
    password: values.password ?? '',
    confirmPassword: values.confirmPassword ?? '',
    avatarUrl: values.avatarUrl ?? '',
  };

  if (!safeValues.firstName.trim() || !safeValues.lastName.trim() || !safeValues.gender.trim() || !safeValues.username.trim() || !safeValues.mobile.trim() || !safeValues.email.trim() || !safeValues.password.trim() || !safeValues.confirmPassword.trim()) {
    return false;
  }

  const parsed = signupSchema.safeParse(safeValues);
  return parsed.success;
}
