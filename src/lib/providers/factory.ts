import { mailpitProvider } from './implementations/emailMailpit'
import { mockSmsProvider } from './implementations/smsMock'
import { smsConsoleProvider } from './implementations/smsConsole'
import { emailConsoleProvider } from './implementations/emailConsole'
import { localStorageProvider } from './implementations/storageLocal'
import { EmailProviderName } from './emailProvider'
import { SmsProviderName } from './smsProvider'
import { StorageProviderName } from './storageProvider'

export function getEmailProvider(name?: EmailProviderName) {
  const explicitProvider = name || (process.env.EMAIL_PROVIDER as EmailProviderName | undefined);
  if (process.env.NODE_ENV === 'production' && !explicitProvider) {
    throw new Error('EMAIL_PROVIDER must be configured in production. Mock providers are disabled.');
  }
  const provider = explicitProvider || 'local_mailpit';
  switch (provider) {
    case 'local_mailpit':
      return mailpitProvider
    case 'console':
      return emailConsoleProvider
    default:
      return mailpitProvider
  }
}

export function getSmsProvider(name?: SmsProviderName) {
  const explicitProvider = name || (process.env.SMS_PROVIDER as SmsProviderName | undefined);
  if (process.env.NODE_ENV === 'production' && !explicitProvider) {
    throw new Error('SMS_PROVIDER must be configured in production. Mock providers are disabled.');
  }
  const provider = explicitProvider || 'mock_sms';
  switch (provider) {
    case 'mock_sms':
      return mockSmsProvider
    case 'console':
      return smsConsoleProvider
    default:
      return mockSmsProvider
  }
}

export function getStorageProvider(name?: StorageProviderName) {
  const explicitProvider = name || (process.env.STORAGE_PROVIDER as StorageProviderName | undefined);
  if (process.env.NODE_ENV === 'production' && !explicitProvider) {
    throw new Error('STORAGE_PROVIDER must be configured in production.');
  }
  const provider = explicitProvider || 'local_files';
  switch (provider) {
    case 'local_files':
      return localStorageProvider
    default:
      return localStorageProvider
  }
}
