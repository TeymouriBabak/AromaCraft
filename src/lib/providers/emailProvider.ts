export interface EmailProvider {
  sendEmail: (to: string, subject: string, html: string, text?: string) => Promise<void>
}

export type EmailProviderName = 'local_mailpit' | 'smtp' | 'sendgrid' | 'console'
