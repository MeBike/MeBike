import type { JobPayload } from "@mebike/shared/contracts/server/jobs";
import type { Job } from "pg-boss";

import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";

import logger from "@/lib/logger";

export type EmailJobPayload = JobPayload<typeof JobTypes.EmailSend>;

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

export async function handleEmailJob(
  job: Job<unknown> | undefined,
  email: EmailTransport,
): Promise<void> {
  if (!job) {
    logger.warn("Email worker received empty batch");
    return;
  }
  let data: EmailJobPayload;
  try {
    data = parseJobPayload(JobTypes.EmailSend, job.data);
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ jobId: job.id, error: message }, "Invalid email job payload");
    throw err;
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
