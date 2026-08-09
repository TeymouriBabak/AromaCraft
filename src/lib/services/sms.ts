export async function sendVerificationSMS(phone: string, code: string) {
  const provider = process.env.SMS_PROVIDER ?? 'mock';
  const message = `AromaCraft verification\nYour code is ${code}. Thank you for choosing us.`;

  if (provider === 'mock') {
    const endpoint = process.env.SMS_MOCK_ENDPOINT ?? 'http://localhost:3000/sms';
    try {
      if (typeof fetch === 'function') {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ to: phone, message, code }),
        });
      }
      console.log('[sms][mock] sent', { to: phone, code, message });
      return true;
    } catch (err) {
      console.error('[sms][mock] error sending', err);
      return false;
    }
  }

  if (provider === 'twilio') {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!sid || !token || !from) {
      console.error('[sms][twilio] missing TWILIO_* env vars');
      return false;
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`;
      const body = new URLSearchParams();
      body.append('To', phone);
      body.append('From', from);
      body.append('Body', message);

      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      const resp = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        console.error('[sms][twilio] failed', resp.status, txt);
        return false;
      }
      console.log('[sms][twilio] sent', { to: phone, code });
      return true;
    } catch (err) {
      console.error('[sms][twilio] error', err);
      return false;
    }
  }

  if (provider === 'sns') {
    try {
      const { SNSClient, PublishCommand } = await import('@aws-sdk/client-sns');
      const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION;
      if (!region) {
        console.error('[sms][sns] missing AWS region');
        return false;
      }
      const client = new SNSClient({ region });
      const params = { Message: message, PhoneNumber: phone };
      await client.send(new PublishCommand(params));
      console.log('[sms][sns] sent', { to: phone });
      return true;
    } catch (err) {
      console.error('[sms][sns] error or @aws-sdk not installed', err);
      return false;
    }
  }

  console.warn('[sms] unknown provider:', provider);
  return false;
}

export default sendVerificationSMS;
