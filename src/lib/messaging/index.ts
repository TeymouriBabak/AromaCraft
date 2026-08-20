import { getEmailProvider as getEmail } from '@/lib/providers/factory'
import { getSmsProvider as getSms } from '@/lib/providers/factory'

export type MessagingProviderName = 'console' | 'local_mailpit' | 'mock_sms' | 'smtp' | 'twilio'

export async function sendVerificationEmail(to: string, code: string) {
  const provider = getEmail();
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/verify?email=${encodeURIComponent(to)}`;
  const subject = 'Verify your AromaCraft account';
  const html = `<p>Your verification code is <strong>${code}</strong>. Visit <a href="${verificationUrl}">Verify account</a> to complete verification.</p>`;
  const text = `Your verification code is ${code}. Visit ${verificationUrl} to verify your account.`;
  try {
    await provider.sendEmail(to, subject, html, text);
    return true;
  } catch (err) {
    console.error('[messaging] sendVerificationEmail failed', err instanceof Error ? err.message : err);
    return false;
  }
}

export async function sendVerificationSMS(phone: string, code?: string) {
  const provider = getSms();
  const message = code ? `Your AromaCraft verification code is ${code}.` : 'AromaCraft verification: a code has been sent to your account.';
  try {
    await provider.sendSms(phone, message);
    return true;
  } catch (err) {
    console.error('[messaging] sendVerificationSMS failed', err instanceof Error ? err.message : err);
    return false;
  }
}

const messaging = { sendVerificationEmail, sendVerificationSMS };
export default messaging;
