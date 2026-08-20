import { EmailProvider } from '../emailProvider'

export const emailConsoleProvider: EmailProvider = {
  sendEmail: async (to, subject, html, text) => {
    if (process.env.NODE_ENV !== 'production') {
      // Mask recipient to avoid leaking emails in test logs
      const maskEmail = (s: string) => {
        try {
          const parts = s.split('@');
          if (parts.length !== 2) return '***';
          const name = parts[0];
          const domain = parts[1];
          return `${name[0] || '*'}***@${domain}`;
        } catch {
          return '***';
        }
      };
      console.info(`[email-console] To: ${maskEmail(String(to))} | Subject: ${subject}`);
      // Do not print verification codes to logs to avoid leaking them during tests
      const maybeCode = (text || html || '').match(/\b\d{4,6}\b/);
      if (maybeCode) console.info(`[email-console] verification code: [REDACTED]`);
    }
    return Promise.resolve();
  },
}
