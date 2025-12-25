import type { JobPayload } from "@mebike/shared/contracts/server/jobs";
import type { Job } from "pg-boss";

import { JobTypes, parseJobPayload } from "@mebike/shared/contracts/server/jobs";

import { buildAuthOtpEmail } from "@/lib/email-templates";
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

  const message = buildEmailMessage(data);
  logger.info(
    { jobId: job.id, to: message.to, subject: message.subject, kind: data.kind },
    "Sending email job",
  );
  await email.transporter.sendMail({
    from: message.from ?? email.defaultFrom,
    to: message.to,
    subject: message.subject,
    html: message.html,
  });
  logger.info(
    { jobId: job.id, to: message.to, subject: message.subject, kind: data.kind },
    "Email job sent",
  );
}

function buildEmailMessage(
  data: EmailJobPayload,
): { to: string; subject: string; html: string; from?: string } {
  switch (data.kind) {
    case "raw":
      return {
        to: data.to,
        subject: data.subject,
        html: data.html,
        from: data.from,
      };
    case "auth.verifyOtp":
      return {
        to: data.to,
        ...buildAuthOtpEmail({
          kind: data.kind,
          fullName: data.fullName,
          otp: data.otp,
          expiresInMinutes: data.expiresInMinutes,
        }),
        from: data.from,
      };
    case "auth.resetOtp":
      return {
        to: data.to,
        ...buildAuthOtpEmail({
          kind: data.kind,
          fullName: data.fullName,
          otp: data.otp,
          expiresInMinutes: data.expiresInMinutes,
        }),
        from: data.from,
      };
    default: {
      const _exhaustive: never = data;
      return _exhaustive;
    }
  }
}
