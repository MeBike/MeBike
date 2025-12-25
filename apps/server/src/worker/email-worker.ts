import type { Job } from "pg-boss";

import logger from "@/lib/logger";

export type EmailJobPayload = {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly from?: string;
};

export type EmailTransport = {
  readonly defaultFrom: string;
  readonly transporter: {
    sendMail: (options: {
      readonly from: string;
      readonly to: string;
      readonly subject: string;
      readonly html: string;
    }) => Promise<unknown>;
  };
};

export function isEmailJobPayload(data: unknown): data is EmailJobPayload {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const payload = data as Record<string, unknown>;
  return (
    typeof payload.to === "string"
    && typeof payload.subject === "string"
    && typeof payload.html === "string"
    && (payload.from === undefined || typeof payload.from === "string")
  );
}

export async function handleEmailJob(
  job: Job<unknown> | undefined,
  email: EmailTransport,
): Promise<void> {
  if (!job) {
    logger.warn("Email worker received empty batch");
    return;
  }
  const data = job.data;
  if (!isEmailJobPayload(data)) {
    const message = "Invalid email job payload";
    logger.error({ jobId: job.id, data }, message);
    throw new Error(message);
  }

  logger.info(
    { jobId: job.id, to: data.to, subject: data.subject },
    "Sending email job",
  );
  await email.transporter.sendMail({
    from: data.from ?? email.defaultFrom,
    to: data.to,
    subject: data.subject,
    html: data.html,
  });
  logger.info(
    { jobId: job.id, to: data.to, subject: data.subject },
    "Email job sent",
  );
}
