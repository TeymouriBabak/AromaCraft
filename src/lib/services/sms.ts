import { getSmsProvider } from '@/lib/providers/factory'

const provider = getSmsProvider();

export async function sendVerificationSMS(phone: string, code?: string) {
  const message = code
    ? `Your AromaCraft verification code is ${code}.`
    : 'AromaCraft verification: a code has been sent to your account.';

  try {
    await provider.sendSms(phone, message);
    return true;
  } catch (err) {
    console.error('[sms] send failed', (err instanceof Error) ? err.message : err);
    return false;
  }
}

export default sendVerificationSMS;
