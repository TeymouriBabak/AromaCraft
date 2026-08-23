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
