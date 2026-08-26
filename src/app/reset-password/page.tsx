'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';

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
      // Redirect to login after 2 seconds so the user can read the success message
      setTimeout(() => router.push('/login'), 2000);
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
          <input
            id="password"
            type="password"
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
          <input
            id="confirm"
            type="password"
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