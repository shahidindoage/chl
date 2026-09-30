import nodemailer, { type Transporter } from "nodemailer";

import { env } from "../config/env.js";
import { logger } from "./logger.js";

/**
 * Mailer singleton. In development, if SMTP_HOST is unset, emails are not
 * sent — they are logged to the console (dev OTP convenience). In production
 * a missing SMTP_HOST is a startup error (checked in server.ts).
 */
let transporter: Transporter | null = null;

export function mailerConfigured(): boolean {
  return Boolean(env.SMTP_HOST);
}

function getTransporter(): Transporter | null {
  if (!mailerConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail(options: SendMailOptions): Promise<void> {
  const transport = getTransporter();
  if (!transport) {
    logger.info(`mail:dev (SMTP not configured) → to=${options.to} subject="${options.subject}"`, {
      text: options.text,
    });
    return;
  }
  await transport.sendMail({
    from: env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
  logger.info(`mail sent → to=${options.to} subject="${options.subject}"`);
}
