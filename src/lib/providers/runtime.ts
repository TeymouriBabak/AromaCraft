import { providers } from './index';
import { MockEmailProvider } from './mock-email';
import { MockSmsProvider } from './mock-sms';
import { emailConsoleProvider } from './implementations/emailConsole';
import { smsConsoleProvider } from './implementations/smsConsole';

export function initProviders() {
  // Choose providers based on environment variables or NODE_ENV
  const emailProvider =
    process.env.EMAIL_PROVIDER ??
    (process.env.NODE_ENV === 'production' ? undefined : 'console');
  const smsProvider =
    process.env.SMS_PROVIDER ??
    (process.env.NODE_ENV === 'production' ? undefined : 'console');

  switch (emailProvider) {
    case 'console':
      providers.email = emailConsoleProvider;
      break;
    case 'local_mailpit':
      providers.email = MockEmailProvider;
      break;
    default:
      providers.email = MockEmailProvider;
  }

  switch (smsProvider) {
    case 'console':
      providers.sms = smsConsoleProvider;
      break;
    case 'mock_sms':
      providers.sms = MockSmsProvider;
      break;
    default:
      providers.sms = MockSmsProvider;
  }
}
