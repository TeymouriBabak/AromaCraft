import { getSmsProvider } from '@/lib/providers/factory';

const provider = getSmsProvider();

function maskPhone(p: string) {
  try {
    const s = String(p).replace(/\D/g, '');
    if (s.length <= 4) return '***';
    return `***${s.slice(-4)}`;
  } catch {
    return '***';
  }
}

export async function sendVerificationSMS(phone: string, code?: string) {
  const message = code
    ? `Your AromaCraft verification code is ${code}.`
    : 'AromaCraft verification: a code has been sent to your account.';
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.info(
        `[sms] To: ${maskPhone(String(phone))} | Message: [REDACTED]`
      );
    }
    await provider.sendSms(phone, message);
    return true;
  } catch (err) {
    console.error(
      '[sms] send failed',
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

export default sendVerificationSMS;
