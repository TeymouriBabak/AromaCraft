import { SmsProvider } from '../smsProvider';

export const smsConsoleProvider: SmsProvider = {
  sendSms: async (to, message) => {
    if (process.env.NODE_ENV !== 'production') {
      const maskPhone = (p: string) => {
        try {
          const s = String(p).replace(/\s+/g, '');
          if (s.length <= 4) return '****';
          return `***${s.slice(-2)}`;
        } catch {
          return '***';
        }
      };
      console.info(
        `[sms-console] To: ${maskPhone(String(to))} | Message: [REDACTED]`
      );
      const maybeCode = message.match(/\b\d{4,6}\b/);
      if (maybeCode)
        console.info(`[sms-console] verification code: [REDACTED]`);
    }
    return Promise.resolve();
  },
};
