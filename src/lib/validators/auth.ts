import { z } from 'zod';

/**
 * Auth Validation Schemas (Zod)
 * OCL Rule Enforcement: All request payloads validated before DB operations
 */

/**
 * OCL Rule 1, 2, 3: UNIQUE(mobile), UNIQUE(email), UNIQUE(username)
 * Validated at field level; Database enforces final uniqueness
 */
export const loginSchema = z.object({
  loginMode: z.enum(['email', 'username'], {
    errorMap: () => ({ message: 'Login mode must be "email" or "username"' }),
  }),
  role: z.enum(['customer', 'admin', 'manager'], {
    errorMap: () => ({ message: 'Role must be "customer", "admin", or "manager"' }),
  }),
  identifier: z
    .string()
    .trim()
    .min(1, 'Email or username is required.')
    .max(255, 'Email or username is too long.'),
  password: z
    .string()
    .trim()
    .min(1, 'Password is required.')
    .max(255, 'Password is too long.'),
});

export type LoginPayload = z.infer<typeof loginSchema>;

/**
 * OCL Rules 1, 2, 3, 5: UNIQUE(mobile), UNIQUE(email), UNIQUE(username), User must have at least one valid identity
 */
export const signupSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, 'First name is required.')
      .max(120, 'First name is too long.'),
    lastName: z
      .string()
      .trim()
      .min(1, 'Last name is required.')
      .max(120, 'Last name is too long.'),
    gender: z
      .string()
      .trim()
      .min(1, 'Gender is required.')
      .max(80, 'Gender value is too long.'),
    username: z
      .string()
      .trim()
      .min(4, 'Username must be at least 4 characters.')
      .max(120, 'Username must not exceed 120 characters.')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens.')
      .regex(/(?=.*[A-Z])/, 'Username needs at least one uppercase letter.')
      .regex(/(?=.*[a-z])/, 'Username needs at least one lowercase letter.')
      .regex(/(?=.*\d)/, 'Username needs at least one digit.'),
    mobile: z
      .string()
      .trim()
      .min(5, 'Mobile number must be valid.')
      .max(40, 'Mobile number is too long.'),
    email: z
      .string()
      .trim()
      .email('Enter a valid email address.')
      .max(255, 'Email is too long.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(255, 'Password is too long.')
      .regex(/[A-Z]/, 'Password needs an uppercase letter.')
      .regex(/[a-z]/, 'Password needs a lowercase letter.')
      .regex(/\d/, 'Password needs a number.')
      .regex(/[^A-Za-z0-9]/, 'Password needs a special character.'),
    confirmPassword: z.string().trim().min(1, 'Please confirm your password.'),
    avatarUrl: z.string().url('Avatar must be a valid URL.').optional(),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        path: ['confirmPassword'],
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match.',
      });
    }
  });

export type SignupPayload = z.infer<typeof signupSchema>;

/**
 * OCL Rule 6: OTP.code must be exactly 6 digits
 */
export const verifyOtpSchema = z.object({
  email: z.string().trim().email('Valid email is required.'),
  otp: z
    .string()
    .trim()
    .length(6, 'OTP must be exactly 6 digits.')
    .regex(/^\d{6}$/, 'OTP must contain only digits.'),
});

export type VerifyOtpPayload = z.infer<typeof verifyOtpSchema>;

/**
 * OCL Rule 5: User must have at least one valid identity (mobile OR email)
 */
export const checkEmailSchema = z.object({
  email: z.string().trim().email('Valid email is required.'),
});

export type CheckEmailPayload = z.infer<typeof checkEmailSchema>;

export const checkUsernameSchema = z.object({
  username: z
    .string()
    .trim()
    .min(4, 'Username must be at least 4 characters.')
    .max(120, 'Username must not exceed 120 characters.'),
});

export type CheckUsernamePayload = z.infer<typeof checkUsernameSchema>;

export const checkMobileSchema = z.object({
  mobile: z
    .string()
    .trim()
    .min(5, 'Mobile number must be valid.')
    .max(40, 'Mobile number is too long.'),
});

export type CheckMobilePayload = z.infer<typeof checkMobileSchema>;

/**
 * Password reset request
 */
export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Valid email is required.'),
});

export type ForgotPasswordPayload = z.infer<typeof forgotPasswordSchema>;

/**
 * Username recovery
 */
export const forgotUsernameSchema = z.object({
  email: z.string().trim().email('Valid email is required.'),
});

export type ForgotUsernamePayload = z.infer<typeof forgotUsernameSchema>;

/**
 * Resend verification OTP
 */
export const resendVerificationSchema = z.object({
  email: z.string().trim().email('Valid email is required.'),
});

export type ResendVerificationPayload = z.infer<typeof resendVerificationSchema>;
