import { SmsProvider } from './index';

export const MockSmsProvider: SmsProvider = {
  async sendSms(to, message) {
    // Do NOT log OTPs or sensitive data. Only log destination and message length.
    if (process.env.NODE_ENV !== 'production') {
      console.info(`MockSmsProvider: sendSms to ${to}, length=${message.length}`);
    }
    return Promise.resolve();
  },
};
