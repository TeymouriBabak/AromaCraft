import { getEmailProvider } from '@/lib/providers/factory';

const provider = getEmailProvider();

function maskEmail(e: string) {
  try {
    const parts = String(e).split('@');
    if (parts.length !== 2) return '***';
    return `${parts[0].slice(0, 1)}***@${parts[1]}`;
  } catch {
    return '***';
  }
}

export async function sendVerificationEmail(to: string, token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const verificationUrl = `${base}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const subject = 'Verify your AromaCraft account';
  // Expiry wording must match VERIFICATION_TTL_MS in src/lib/auth-utils.ts (15 minutes).
  const html = `<p>Welcome to AromaCraft! Click <a href="${verificationUrl}">this link</a> to verify your email address. The link expires in 15 minutes.</p>`;
  const text = `Welcome to AromaCraft! Verify your email address by visiting: ${verificationUrl} (the link expires in 15 minutes)`;

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.info(
        `[mailer] To: ${maskEmail(String(to))} | Subject: ${subject}`
      );
    }
    await provider.sendEmail(to, subject, html, text);
    return true;
  } catch (err) {
    console.error(
      '[mailer] error sending email',
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

export default sendVerificationEmail;

export async function sendUsernameRecoveryEmail(
  to: string,
  username: string,
  loginUrl: string
): Promise<boolean> {
  const subject = 'AromaCraft — Your username';
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2>Your username</h2>
      <p>Your AromaCraft username is <strong>${username}</strong>.</p>
      <p><a href="${loginUrl}" style="background:#6f4e37;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Sign in</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `;
  const text = `Your AromaCraft username is ${username}. Sign in here: ${loginUrl}`;

  try {
    await provider.sendEmail(to, subject, html, text);
    return true;
  } catch (error) {
    console.error('[mailer] error sending username recovery email', error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<boolean> {
  try {
    await provider.sendEmail(
      to,
      'AromaCraft — Reset your password',
      `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2>Password Reset</h2>
          <p>We received a request to reset your password. This link is valid for 15 minutes:</p>
          <p><a href="${resetUrl}" style="background:#6f4e37;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Reset Password</a></p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
      `Reset your password (valid 15 minutes): ${resetUrl}`
    );
    return true;
  } catch (error) {
    console.error('[mailer] error sending password reset email', error);
    return false;
  }
}

