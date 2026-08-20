import { getEmailProvider } from '@/lib/providers/factory'

const provider = getEmailProvider();

function maskEmail(e: string) {
  try {
    const parts = String(e).split('@');
    if (parts.length !== 2) return '***';
    const name = parts[0];
    const domain = parts[1];
    return `${name.slice(0, 1)}***@${domain}`;
  } catch {
    return '***';
  }
}

export async function sendVerificationEmail(to: string, code: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/verify?email=${encodeURIComponent(to)}`;
  const subject = 'Verify your AromaCraft account';
  const html = `<p>Your verification code is <strong>${code}</strong>. Visit <a href="${verificationUrl}">Verify account</a> to complete verification.</p>`;
  const text = `Your verification code is ${code}. Visit ${verificationUrl} to verify your account.`;

  try {
    // In development, log only non-sensitive metadata
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[mailer] To: ${maskEmail(String(to))} | Subject: ${subject}`);
    }
    await provider.sendEmail(to, subject, html, text);
    return true;
  } catch (err) {
    console.error('[mailer] error sending email', err instanceof Error ? err.message : err);
    return false;
  }
}

export default sendVerificationEmail;
