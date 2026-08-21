import { EmailProvider } from './index';

export const MockEmailProvider: EmailProvider = {
  async sendEmail(to, subject, _html) {
    // In dev, Mailpit will capture SMTP; here we also log minimal info (no secrets)
    void _html;
    if (process.env.NODE_ENV !== 'production') {
      console.info(`MockEmailProvider: queued email to ${to} subject="${subject}"`);
    }
    return Promise.resolve();
  },
};
