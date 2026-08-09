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
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/verify?email=${encodeURIComponent(to)}&code=${encodeURIComponent(code)}`;
  const text = `Your verification code is: ${code}\n\nUse this link to verify: ${verificationUrl}\n\nIf you didn't request this, ignore this email.`;
  const html = `
    <div style="font-family:Arial,sans-serif;background:#f9f6f0;padding:32px;color:#1a0f0a;">
      <div style="max-width:600px;margin:0 auto;background:#fff; border-radius:18px; overflow:hidden; border:1px solid #e9d7c5;">
        <div style="background:linear-gradient(135deg,#1a0f0a,#2b1d17);padding:24px;color:#f9f6f0;">
          <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;opacity:0.8;">AromaCraft</div>
          <div style="font-size:28px;font-weight:700;margin-top:12px;">Verify your account</div>
        </div>
        <div style="padding:28px 24px;">
          <p style="font-size:18px;line-height:1.6;margin:0 0 16px;">Welcome to AromaCraft. Use the secure verification code below to confirm your email address.</p>
          <div style="background:#f7efe8;border-radius:12px;padding:18px;text-align:center;margin:18px 0;">
            <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#7a5b45;">Your code</div>
            <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#1a0f0a;margin-top:8px;">${code}</div>
          </div>
          <div style="text-align:center;margin:18px 0 12px;">
            <a href="${verificationUrl}" style="display:inline-block;background:#d4a373;color:#1a0f0a;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:700;">Verify Account</a>
          </div>
          <p style="font-size:14px;color:#6e4b33;line-height:1.6;">If you did not create this account, you can safely ignore this email.</p>
        </div>
      </div>
    </div>
  `;

  if (process.env.NODE_ENV !== 'production') {
    console.log('[mailer] sendVerificationEmail', { to, code, verificationUrl });
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
