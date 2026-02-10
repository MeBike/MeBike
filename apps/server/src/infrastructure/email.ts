import { Data, Effect, Layer } from "effect";

import type { WithGenericError } from "@/domain/shared/errors";

import { makeEmailTransporter } from "@/lib/email";

export class EmailInitError extends Data.TaggedError("EmailInitError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class EmailSendError extends Data.TaggedError("EmailSendError")<
  WithGenericError<{ to: string; subject: string }>
> {}

export type EmailService = {
  readonly defaultFrom: string;
  send: (options: {
    readonly to: string;
    readonly subject: string;
    readonly html: string;
    readonly from?: string;
  }) => Effect.Effect<void, EmailSendError, never>;
};

const makeEmail = Effect.gen(function* () {
  const { transporter, defaultFrom } = yield* Effect.acquireRelease(
    Effect.tryPromise({
      try: async () => {
        const created = makeEmailTransporter({ fromName: "MeBike" });
        await created.transporter.verify();
        return created;
      },
      catch: cause =>
        new EmailInitError({
          message:
            "Failed to initialize email transporter. Check EMAIL_APP / EMAIL_PASSWORD_APP and SMTP connectivity.",
          cause,
        }),
    }),
    resource =>
      Effect.sync(() => {
        if (typeof resource.transporter.close === "function") {
          resource.transporter.close();
        }
      }),
  );

  const send: EmailService["send"] = ({ to, subject, html, from }) =>
    Effect.tryPromise({
      try: () =>
        transporter.sendMail({
          from: from ?? defaultFrom,
          to,
          subject,
          html,
        }),
      catch: cause =>
        new EmailSendError({
          operation: "Email.send",
          to,
          subject,
          cause,
        }),
    });

  return { defaultFrom, send } satisfies EmailService;
});

export class Email extends Effect.Service<Email>()("Email", {
  scoped: makeEmail,
}) {}

export const EmailLive = Layer.scoped(
  Email,
  makeEmail.pipe(Effect.map(Email.make)),
);
