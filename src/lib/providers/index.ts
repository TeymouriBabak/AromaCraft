export type EmailProvider = {
  sendEmail: (to: string, subject: string, html: string, text?: string) => Promise<void>;
};

export type SmsProvider = {
  sendSms: (to: string, message: string) => Promise<void>;
};

export const providers = {
  email: null as unknown as EmailProvider,
  sms: null as unknown as SmsProvider,
};
