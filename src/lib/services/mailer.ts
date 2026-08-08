import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST ?? '127.0.0.1';
const smtpPort = Number(process.env.SMTP_PORT ?? 1025);
const smtpUser = process.env.SMTP_USER || undefined;
const smtpPass = process.env.SMTP_PASS || undefined;
const fromAddress = process.env.SMTP_FROM ?? 'noreply@aromacraft.test';

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: false,
  auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
});

export async function sendVerificationEmail(to: string, code: string) {
  const subject = 'Verify your AromaCraft account';
  const text = `Your verification code is: ${code}\n\nIf you didn't request this, ignore this email.`;
  const html = `<p>Your verification code is: <strong>${code}</strong></p>`;

  if (process.env.NODE_ENV !== 'production') {
    console.log('[mailer] sendVerificationEmail', { to, code });
  }

  try {
    const info = await transporter.sendMail({ from: fromAddress, to, subject, text, html });
    if (process.env.NODE_ENV !== 'production') console.log('[mailer] sent', info?.response ?? info);
    return true;
  } catch (err) {
    console.error('[mailer] error sending email', err);
    return false;
  }
}

export default sendVerificationEmail;
