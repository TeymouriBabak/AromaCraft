'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Check, Eye, EyeOff, X } from 'lucide-react';

// Password rules -- identical to the registration form
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#^])[A-Za-z\d@$!%*?&_\-#^]{8,}$/;

const PASSWORD_HINT =
  'At least 8 characters -- include uppercase, lowercase, a number, and a special character (@$!%*?&_-#^).';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrength = (() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    const percent = Math.min((score / 4) * 100, 100);
    if (score <= 1)
      return { label: 'Weak', tone: 'weak', percent, bar: 'weak', score };
    if (score <= 2)
      return { label: 'Fair', tone: 'fair', percent, bar: 'fair', score };
    if (score <= 3)
      return { label: 'Good', tone: 'good', percent, bar: 'good', score };
    return { label: 'Very Strong', tone: 'strong', percent, bar: 'strong', score };
  })();

  const passwordRequirements = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'One number', valid: /\d/.test(password) },
    { label: 'One special character', valid: /[^A-Za-z0-9]/.test(password) },
  ];

  if (!token) {
    return (
      <div className="card" role="alert">
        <h2>Invalid Link</h2>
        <p>This password reset link is missing a token. Please request a new one.</p>
        <a href="/login" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
          Back to login
        </a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card" role="status">
        <h2>Password updated</h2>
        <p>Your password has been changed. You can now sign in with your new credentials.</p>
        <a href="/login" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
          Go to login
        </a>
      </div>
    );
  }

  function validatePassword(value: string): string {
    if (!value) return 'Password is required.';
    if (!PASSWORD_REGEX.test(value)) return PASSWORD_HINT;
    return '';
  }

  function validateConfirm(value: string, pw: string): string {
    if (!value) return 'Please confirm your password.';
    if (value !== pw) return 'Passwords do not match.';
    return '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');

    const pwErr = validatePassword(password);
    const cfErr = validateConfirm(confirm, password);
    setPasswordError(pwErr);
    setConfirmError(cfErr);
    if (pwErr || cfErr) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400 && data.code === 'invalid_token') {
          setServerError(
            'This link has expired or already been used. Please request a new reset link.'
          );
        } else {
          setServerError(data.message ?? 'Something went wrong. Please try again.');
        }
        return;
      }

      setDone(true);
      router.push('/login');
    } catch {
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Set a new password</h2>
      <p className="subtitle">Choose a strong password for your AromaCraft account.</p>

      {serverError && (
        <div className="error-banner" role="alert">
          {serverError}
          {serverError.includes('expired') && (
            <>
              {' '}
              <a href="/login">Go back to login</a>.
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="password">New password</label>
          <div className="input-wrap">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              autoComplete="new-password"
              aria-describedby={passwordError ? 'password-error' : 'password-hint'}
              aria-invalid={!!passwordError}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(validatePassword(e.target.value));
              }}
              onBlur={(e) => setPasswordError(validatePassword(e.target.value))}
            />
            <button
              type="button"
              className="visibility-toggle"
              aria-label={showPassword ? 'Hide new password' : 'Show new password'}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {password ? (
            <div className="strength" aria-label={`Password strength: ${passwordStrength.label}`}>
              <div className="strength-heading">
                <span>Password strength</span>
                <span className={passwordStrength.tone}>{passwordStrength.label}</span>
              </div>
              <div className="strength-track">
                <div className={`strength-bar ${passwordStrength.bar}`} style={{ width: `${passwordStrength.percent}%` }} />
              </div>
              <ul className="requirements">
                {passwordRequirements.map((rule) => (
                  <li key={rule.label}>
                    {rule.valid ? <Check size={14} className="valid" /> : <X size={14} className="invalid" />}
                    {rule.label}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {passwordError ? (
            <span id="password-error" className="field-error" role="alert">
              {passwordError}
            </span>
          ) : (
            <span id="password-hint" className="field-hint">
              {PASSWORD_HINT}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="confirm">Confirm new password</label>
          <div className="input-wrap">
            <input
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              autoComplete="new-password"
              aria-describedby={confirmError ? 'confirm-error' : undefined}
              aria-invalid={!!confirmError}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (confirmError) setConfirmError(validateConfirm(e.target.value, password));
              }}
              onBlur={(e) => setConfirmError(validateConfirm(e.target.value, password))}
            />
            <button
              type="button"
              className="visibility-toggle"
              aria-label={showConfirm ? 'Hide confirmed password' : 'Show confirmed password'}
              onClick={() => setShowConfirm((value) => !value)}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmError && (
            <span id="confirm-error" className="field-error" role="alert">
              {confirmError}
            </span>
          )}
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Updating...' : 'Set new password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <style>{`
        :root {
          --accent: oklch(38% 0.08 44);       /* coffee brown */
          --accent-hover: oklch(32% 0.09 44);
          --surface: oklch(98% 0.005 60);
          --text: oklch(18% 0.01 60);
          --muted: oklch(48% 0.015 60);
          --border: oklch(88% 0.01 60);
          --error: oklch(50% 0.18 25);
          --error-bg: oklch(97% 0.02 25);
        }

        .page-wrap {
          min-height: 100svh;
          display: grid;
          place-items: center;
          padding: 2rem 1rem;
          background: var(--surface);
          font-family: system-ui, sans-serif;
          color: var(--text);
        }

        .card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 2.5rem 2rem;
          box-shadow: 0 2px 8px oklch(0% 0 0 / 6%);
        }

        h2 {
          margin: 0 0 0.25rem;
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .subtitle {
          margin: 0 0 1.5rem;
          color: var(--muted);
          font-size: 0.9rem;
        }

        .error-banner {
          background: var(--error-bg);
          border: 1px solid var(--error);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: var(--error);
          margin-bottom: 1.25rem;
        }

        .error-banner a { color: inherit; font-weight: 600; }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          margin-bottom: 1.1rem;
        }

        label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text);
        }

        input[type="password"] {
          height: 44px;
          padding: 0 0.875rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 1rem;
          color: var(--text);
          background: #fff;
          transition: border-color 120ms ease;
          outline: none;
        }

        input[type="text"] {
          height: 44px;
          width: 100%;
          padding: 0 0.875rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 1rem;
          color: var(--text);
          background: #fff;
          outline: none;
        }

        .input-wrap { position: relative; }
        .input-wrap input { padding-right: 3rem; }
        .visibility-toggle {
          position: absolute;
          top: 50%;
          right: 0.75rem;
          display: grid;
          place-items: center;
          padding: 0.25rem;
          border: 0;
          color: var(--muted);
          background: transparent;
          cursor: pointer;
          transform: translateY(-50%);
        }
        .visibility-toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

        .strength { margin-top: 0.85rem; }
        .strength-heading { display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: var(--muted); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; }
        .strength-heading .weak, .invalid { color: #e76f51; }
        .strength-heading .fair { color: #c9854d; }
        .strength-heading .good { color: #d4a373; }
        .strength-heading .strong, .valid { color: #2f7d4a; }
        .strength-track { height: 8px; border-radius: 999px; background: #efe2d2; }
        .strength-bar { height: 8px; border-radius: 999px; transition: width 300ms ease; }
        .strength-bar.weak { background: #e76f51; }
        .strength-bar.fair { background: #c9854d; }
        .strength-bar.good { background: #d4a373; }
        .strength-bar.strong { background: #2f7d4a; }
        .requirements { display: grid; gap: 0.25rem; margin: 0.75rem 0 0; padding: 0; color: var(--muted); font-size: 0.75rem; list-style: none; }
        .requirements li { display: flex; align-items: center; gap: 0.4rem; }

        input[type="password"]:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px oklch(38% 0.08 44 / 15%);
        }

        .field-error {
          font-size: 0.75rem;
          color: var(--error);
        }

        .field-hint {
          font-size: 0.75rem;
          color: var(--muted);
        }

        .btn-primary {
          display: block;
          width: 100%;
          height: 44px;
          border-radius: 8px;
          background: var(--accent);
          color: #fff;
          font-weight: 600;
          border: none;
          cursor: pointer;
          margin-top: 1rem;
        }

        .btn-primary:hover {
          background: var(--accent-hover);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      <div className="page-wrap">
        <Suspense fallback={<div>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </>
  );
}