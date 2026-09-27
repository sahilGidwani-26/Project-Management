import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
});

export async function sendMail(to: string, subject: string, html: string) {
  if (!env.SMTP_HOST) {
    console.warn(`[mailer] SMTP not configured, skipping email to ${to}: ${subject}`);
    return;
  }
  await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html });
}
