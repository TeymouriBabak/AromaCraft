import { getEmailProvider } from '@/lib/providers/factory'

const provider = getEmailProvider();

export async function sendVerificationEmail(to: string, code: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/verify?email=${encodeURIComponent(to)}`;
  const subject = 'Verify your AromaCraft account';
  const html = `<p>Your verification code is <strong>${code}</strong>. Visit <a href="${verificationUrl}">Verify account</a> to complete verification.</p>`;
  const text = `Your verification code is ${code}. Visit ${verificationUrl} to verify your account.`;

  try {
    // avoid returning or logging the code in responses
    await provider.sendEmail(to, subject, html, text);
    return true;
  } catch (err) {
    console.error('[mailer] error sending email', (err instanceof Error) ? err.message : err);
    return false;
  }
}

export default sendVerificationEmail;
