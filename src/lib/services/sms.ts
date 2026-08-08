export async function sendVerificationSMS(phone: string, code: string) {
  const provider = process.env.SMS_PROVIDER ?? 'mock';
  if (provider === 'mock') {
    const endpoint = process.env.SMS_MOCK_ENDPOINT ?? 'http://localhost:3000/sms';
    try {
      if (typeof fetch === 'function') {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ to: phone, code }),
        });
      }
      console.log('[sms][mock] sent', { to: phone, code });
      return true;
    } catch (err) {
      console.error('[sms][mock] error sending', err);
      return false;
    }
  }

  console.warn('[sms] provider not implemented:', provider);
  return false;
}

export default sendVerificationSMS;
