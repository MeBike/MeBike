import type { Kysely } from "kysely";

import { PrismaPg } from "@prisma/adapter-pg";
import { PgBoss } from "pg-boss";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { DB } from "generated/kysely/types";

import { JobTypes } from "@/infrastructure/jobs/job-types";
import { enqueueOutboxJob } from "@/infrastructure/jobs/outbox-enqueue";
import { JobDeadLetters, resolveQueueOptions } from "@/infrastructure/jobs/queue-policy";
import { destroyTestDb, makeTestDb } from "@/test/db/kysely";
import { migrate } from "@/test/db/migrate";
import { startPostgres } from "@/test/db/postgres";
import { handleEmailJob } from "@/worker/email-worker";
import { dispatchOutboxOnce } from "@/worker/outbox-dispatcher";
import { PrismaClient } from "generated/prisma/client";

type TestContainer = { stop: () => Promise<void>; url: string };

describe("outbox + email worker integration", () => {
  let container: TestContainer;
  let client: PrismaClient;
  let db: Kysely<DB>;
  let boss: PgBoss;

  beforeAll(async () => {
    container = await startPostgres();
    await migrate(container.url);

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
    db = makeTestDb(container.url);

    boss = new PgBoss({ connectionString: container.url });
    await boss.start();
    const emailDlq = JobDeadLetters[JobTypes.EmailSend];
    if (emailDlq) {
      await boss.createQueue(emailDlq);
    }
    await boss.createQueue(
      JobTypes.EmailSend,
      resolveQueueOptions(JobTypes.EmailSend),
    );
  }, 60000);

  beforeEach(async () => {
    await client.jobOutbox.deleteMany({});
  });

  afterAll(async () => {
    if (boss) {
      await boss.stop({ close: true });
    }
    if (db) {
      await destroyTestDb(db);
    }
    if (client) {
      await client.$disconnect();
    }
    if (container) {
      await container.stop();
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

    await enqueueOutboxJob(client, {
      type: JobTypes.EmailSend,
      payload,
      runAt: now,
      dedupeKey: "outbox-email-test-1",
    });

    await dispatchOutboxOnce({
      db,
      boss,
      workerId: "test-dispatcher",
      batchSize: 1,
    });

    const jobs = await boss.fetch(JobTypes.EmailSend, { batchSize: 1 });
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.data).toEqual(payload);
    await boss.complete(JobTypes.EmailSend, jobs[0]!.id);

    const outboxRow = await client.jobOutbox.findFirst({
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

    await enqueueOutboxJob(client, {
      type: JobTypes.EmailSend,
      payload,
      runAt: now,
      dedupeKey: "outbox-email-test-2",
    });

    await dispatchOutboxOnce({
      db,
      boss,
      workerId: "test-dispatcher",
      batchSize: 1,
    });

    const jobs = await boss.fetch(JobTypes.EmailSend, { batchSize: 1 });
    const job = jobs[0];
    expect(job).toBeDefined();

    const sent: Array<{ to: string; subject: string; html: string; from: string }> = [];
    await handleEmailJob(job, {
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
