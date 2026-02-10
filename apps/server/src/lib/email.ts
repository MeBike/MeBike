import nodemailer from "nodemailer";

import { env } from "@/config/env";

export type EmailConfig = {
  readonly user?: string;
  readonly pass?: string;
  readonly fromName?: string;
};

export function makeEmailTransporter(config: EmailConfig = {}) {
  const user = config.user ?? env.EMAIL_APP;
  const pass = config.pass ?? env.EMAIL_PASSWORD_APP;

  if (!user || !pass) {
    throw new Error(
      "EMAIL_APP and EMAIL_PASSWORD_APP must be set to initialize the email transporter.",
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  const defaultFrom = config.fromName
    ? `"${config.fromName}" <${user}>`
    : user;

  return { transporter, defaultFrom } as const;
}
