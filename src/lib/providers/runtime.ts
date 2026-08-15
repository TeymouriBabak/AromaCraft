import { providers } from './index';
import { MockEmailProvider } from './mock-email';
import { MockSmsProvider } from './mock-sms';

export function initProviders() {
  // For now only mock/local providers are wired. In production toggle via ENV to a different implementation.
  providers.email = MockEmailProvider;
  providers.sms = MockSmsProvider;
}
