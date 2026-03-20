import { PgBoss } from "pg-boss";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { JobTypes } from "@/infrastructure/jobs/job-types";
import { enqueueOutboxJob } from "@/infrastructure/jobs/outbox-enqueue";
import { makePgBossJobProducer, toQueueJob } from "@/infrastructure/jobs/pgboss";
import { resolveQueueOptions } from "@/infrastructure/jobs/queue-policy";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { handleEmailJob } from "@/worker/email-worker";
import { dispatchOutboxOnce } from "@/worker/outbox-dispatcher";

describe("outbox + email worker integration", () => {
  const fixture = setupPrismaIntFixture();
  let boss: PgBoss;

  beforeAll(async () => {
    boss = new PgBoss({ connectionString: fixture.url });
    await boss.start();
    await boss.createQueue(
      JobTypes.EmailSend,
      resolveQueueOptions(JobTypes.EmailSend),
    );
  }, 60000);

  beforeEach(async () => {
    await fixture.prisma.jobOutbox.deleteMany({});
  });

  afterAll(async () => {
    if (boss) {
      await boss.stop({ close: true });
    }
  });

  it("dispatches outbox job to pg-boss and marks SENT", async () => {
    const now = new Date();
    const payload = {
      version: 1 as const,
      kind: "raw" as const,
      to: "test@example.com",
      subject: "Outbox dispatch test",
      html: "<p>Hello</p>",
    };

    await enqueueOutboxJob(fixture.prisma, {
      type: JobTypes.EmailSend,
      payload,
      runAt: now,
      dedupeKey: "outbox-email-test-1",
    });

    await dispatchOutboxOnce({
      db: fixture.db,
      producer: makePgBossJobProducer(boss),
      workerId: "test-dispatcher",
      batchSize: 1,
    });

    const jobs = await boss.fetch(JobTypes.EmailSend, { batchSize: 1 });
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.data).toEqual(payload);
    await boss.complete(JobTypes.EmailSend, jobs[0]!.id);

    const outboxRow = await fixture.prisma.jobOutbox.findFirst({
      where: { dedupeKey: "outbox-email-test-1" },
    });
    expect(outboxRow).not.toBeNull();
    expect(outboxRow?.status).toBe("SENT");
    expect(outboxRow?.sentAt).not.toBeNull();
  });

  it("email worker consumes a dispatched job", async () => {
    const now = new Date();
    const payload = {
      version: 1 as const,
      kind: "raw" as const,
      to: "worker@example.com",
      subject: "Worker dispatch test",
      html: "<p>Worker</p>",
    };

    await enqueueOutboxJob(fixture.prisma, {
      type: JobTypes.EmailSend,
      payload,
      runAt: now,
      dedupeKey: "outbox-email-test-2",
    });

    await dispatchOutboxOnce({
      db: fixture.db,
      producer: makePgBossJobProducer(boss),
      workerId: "test-dispatcher",
      batchSize: 1,
    });

    const jobs = await boss.fetch(JobTypes.EmailSend, { batchSize: 1 });
    const job = jobs[0];
    expect(job).toBeDefined();

    const sent: Array<{ to: string; subject: string; html: string; from: string }> = [];
    await handleEmailJob(toQueueJob(job), {
      defaultFrom: "MeBike <no-reply@mebike.test>",
      transporter: {
        sendMail: async (options) => {
          sent.push(options);
          return undefined;
        },
      },
    });
    await boss.complete(JobTypes.EmailSend, job!.id);

    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toBe(payload.to);
    expect(sent[0]?.subject).toBe(payload.subject);
    expect(sent[0]?.html).toBe(payload.html);
  });
});
