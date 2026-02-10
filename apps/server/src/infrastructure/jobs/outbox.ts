import type { Kysely } from "kysely";

import type { DB } from "generated/kysely/types";

export type OutboxJob = {
  readonly id: string;
  readonly type: string;
  readonly payload: unknown;
  readonly runAt: Date;
  readonly attempts: number;
  readonly dedupeKey: string | null;
};

export type OutboxRetryOptions = {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly backoff: "exponential" | "fixed";
  readonly maxDelayMs: number;
};

const DEFAULT_LOCK_TTL_MS = 5 * 60 * 1000;
const DEFAULT_RETRY_OPTIONS: OutboxRetryOptions = {
  maxAttempts: 5,
  baseDelayMs: 30_000,
  backoff: "exponential",
  maxDelayMs: 15 * 60 * 1000,
};

function computeRetryDelayMs(
  attempts: number,
  options: OutboxRetryOptions,
): number {
  const attemptIndex = Math.max(0, attempts - 1);
  const multiplier = options.backoff === "exponential" ? 2 ** attemptIndex : 1;
  const delay = options.baseDelayMs * multiplier;
  return Math.min(delay, options.maxDelayMs);
}

export async function claimOutboxJobs(
  db: Kysely<DB>,
  args: {
    readonly limit: number;
    readonly workerId: string;
    readonly now?: Date;
    readonly lockTtlMs?: number;
  },
): Promise<readonly OutboxJob[]> {
  const now = args.now ?? new Date();
  const lockTtlMs = args.lockTtlMs ?? DEFAULT_LOCK_TTL_MS;
  const lockExpiredAt = new Date(now.getTime() - lockTtlMs);

  return db.transaction().execute(async (trx) => {
    const rows = await trx
      .selectFrom("job_outbox")
      .select([
        "id",
        "type",
        "payload",
        "run_at",
        "attempts",
        "dedupe_key",
      ])
      .where("status", "=", "PENDING")
      .where("run_at", "<=", now)
      .where(eb =>
        eb.or([
          eb("locked_at", "is", null),
          eb("locked_at", "<", lockExpiredAt),
        ]),
      )
      .orderBy("run_at", "asc")
      .limit(args.limit)
      .forUpdate()
      .skipLocked()
      .execute();

    if (rows.length === 0) {
      return [];
    }

    const ids = rows.map(row => row.id);
    await trx
      .updateTable("job_outbox")
      .set(eb => ({
        locked_at: now,
        locked_by: args.workerId,
        attempts: eb("attempts", "+", 1),
        updated_at: now,
      }))
      .where("id", "in", ids)
      .execute();

    return rows.map(row => ({
      id: row.id,
      type: row.type,
      payload: row.payload,
      runAt: row.run_at,
      attempts: row.attempts + 1,
      dedupeKey: row.dedupe_key,
    }));
  });
}

export async function markOutboxSent(
  db: Kysely<DB>,
  args: {
    readonly id: string;
    readonly workerId: string;
    readonly now?: Date;
  },
): Promise<void> {
  const now = args.now ?? new Date();
  await db
    .updateTable("job_outbox")
    .set({
      status: "SENT",
      sent_at: now,
      locked_at: null,
      locked_by: null,
      updated_at: now,
    })
    .where("id", "=", args.id)
    .where("locked_by", "=", args.workerId)
    .execute();
}

export async function markOutboxFailed(
  db: Kysely<DB>,
  args: {
    readonly id: string;
    readonly workerId: string;
    readonly error: string;
    readonly now?: Date;
  },
): Promise<void> {
  const now = args.now ?? new Date();
  await db
    .updateTable("job_outbox")
    .set({
      status: "FAILED",
      last_error: args.error,
      locked_at: null,
      locked_by: null,
      updated_at: now,
    })
    .where("id", "=", args.id)
    .where("locked_by", "=", args.workerId)
    .execute();
}

export async function rescheduleOutboxOnFailure(
  db: Kysely<DB>,
  args: {
    readonly id: string;
    readonly workerId: string;
    readonly error: string;
    readonly attempts: number;
    readonly retry?: Partial<OutboxRetryOptions>;
    readonly now?: Date;
  },
): Promise<
  | { readonly outcome: "RESCHEDULED"; readonly runAt: Date; readonly maxAttempts: number }
  | { readonly outcome: "FAILED"; readonly maxAttempts: number }
> {
  const now = args.now ?? new Date();
  const retry = { ...DEFAULT_RETRY_OPTIONS, ...args.retry };

  if (args.attempts >= retry.maxAttempts) {
    await markOutboxFailed(db, {
      id: args.id,
      workerId: args.workerId,
      error: args.error,
      now,
    });
    return { outcome: "FAILED", maxAttempts: retry.maxAttempts };
  }

  const runAt = new Date(now.getTime() + computeRetryDelayMs(args.attempts, retry));
  await db
    .updateTable("job_outbox")
    .set({
      status: "PENDING",
      run_at: runAt,
      last_error: args.error,
      locked_at: null,
      locked_by: null,
      updated_at: now,
    })
    .where("id", "=", args.id)
    .where("locked_by", "=", args.workerId)
    .execute();

  return { outcome: "RESCHEDULED", runAt, maxAttempts: retry.maxAttempts };
}
