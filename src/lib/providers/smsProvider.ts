export interface SmsProvider {
  sendSms: (to: string, message: string) => Promise<void>
}

export type SmsProviderName = 'mock_sms' | 'twilio' | 'sns' | 'console'
