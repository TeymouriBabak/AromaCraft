import nodemailer from 'nodemailer';
import { EmailProvider } from '../emailProvider';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mailpit',
  port: Number(process.env.SMTP_PORT || 1025),
  secure: false,
});

export const mailpitProvider: EmailProvider = {
  sendEmail: async (to, subject, html, text) => {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@aromacraft.test',
      to,
      subject,
      html,
      text,
    });
  },
};
