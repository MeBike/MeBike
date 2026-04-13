import { Cause, Effect, Exit, Option } from "effect";

import type { enqueueOutboxJob } from "@/infrastructure/jobs/outbox-enqueue";
import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { BikeRepository, makeBikeRepository } from "@/domain/bikes";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { enqueueOutboxJobInTx } from "@/infrastructure/jobs/outbox-enqueue";
import { Prisma } from "@/infrastructure/prisma";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";
import {
  buildFixedSlotAssignedEmail,
  buildFixedSlotNoBikeEmail,
} from "@/lib/email-templates";

import type { FixedSlotAssignmentTemplateRow } from "../models";

import { makeReservationCommandRepository } from "../repository/reservation-command.repository";
import { makeReservationQueryRepository } from "../repository/reservation-query.repository";

export type FixedSlotAssignmentSummary = {
  readonly slotDate: string;
  readonly totalTemplates: number;
  readonly assigned: number;
  readonly noBike: number;
  readonly missingReservation: number;
  readonly conflicts: number;
};

type FixedSlotAssignmentOutcome
  = | "ASSIGNED"
    | "NO_BIKE"
    | "MISSING_RESERVATION"
    | "CONFLICT";

type FixedSlotAssignmentContext = {
  readonly slotDate: Date;
  readonly slotDateKey: string;
  readonly now: Date;
};

type FixedSlotLabels = {
  readonly slotStartAt: Date;
  readonly slotDateLabel: string;
  readonly slotTimeLabel: string;
};

type FixedSlotCounts = {
  assigned: number;
  noBike: number;
  missingReservation: number;
  conflicts: number;
};

class FixedSlotAssignmentConflict extends Error {
  constructor() {
    super("Fixed-slot assignment conflict");
  }
}

function toSlotDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseSlotDateKey(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`Invalid slot date format: ${value}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day));
}

function normalizeSlotDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function mergeSlotStart(slotDate: Date, slotStart: Date): Date {
  return new Date(Date.UTC(
    slotDate.getUTCFullYear(),
    slotDate.getUTCMonth(),
    slotDate.getUTCDate(),
    slotStart.getUTCHours(),
    slotStart.getUTCMinutes(),
    0,
    0,
  ));
}

function formatSlotTimeLabel(slotStart: Date): string {
  const hours = String(slotStart.getUTCHours()).padStart(2, "0");
  const minutes = String(slotStart.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatSlotDateLabel(slotDate: Date): string {
  return slotDate.toLocaleDateString("vi-VN");
}

async function enqueueEmailIdempotent(
  tx: PrismaTypes.TransactionClient,
  args: Parameters<typeof enqueueOutboxJob>[1],
): Promise<void> {
  try {
    await Effect.runPromise(enqueueOutboxJobInTx(tx, args));
  }
  catch (err) {
    if (isPrismaUniqueViolation(err)) {
      return;
    }
    throw err;
  }
}

function buildFixedSlotLabels(
  slotDate: Date,
  slotStart: Date,
): FixedSlotLabels {
  return {
    slotStartAt: mergeSlotStart(slotDate, slotStart),
    slotDateLabel: formatSlotDateLabel(slotDate),
    slotTimeLabel: formatSlotTimeLabel(slotStart),
  };
}

function enqueueNoBikeEmail(
  tx: PrismaTypes.TransactionClient,
  template: FixedSlotAssignmentTemplateRow,
  labels: FixedSlotLabels,
  context: FixedSlotAssignmentContext,
) {
  const email = buildFixedSlotNoBikeEmail({
    fullName: template.user.fullName,
    stationName: template.station.name,
    slotDateLabel: labels.slotDateLabel,
    slotTimeLabel: labels.slotTimeLabel,
  });

  return Effect.tryPromise({
    try: () =>
      enqueueEmailIdempotent(tx, {
        type: JobTypes.EmailSend,
        dedupeKey: `fixed-slot:no-bike:${template.id}:${context.slotDateKey}`,
        payload: {
          version: 1,
          to: template.user.email,
          kind: "raw",
          subject: email.subject,
          html: email.html,
        },
        runAt: context.now,
      }),
    catch: err => err as unknown,
  }).pipe(Effect.catchAll(err => Effect.die(err)));
}

function enqueueAssignedEmail(
  tx: PrismaTypes.TransactionClient,
  reservationId: string,
  template: FixedSlotAssignmentTemplateRow,
  labels: FixedSlotLabels,
  context: FixedSlotAssignmentContext,
) {
  const email = buildFixedSlotAssignedEmail({
    fullName: template.user.fullName,
    stationName: template.station.name,
    slotDateLabel: labels.slotDateLabel,
    slotTimeLabel: labels.slotTimeLabel,
  });

  return Effect.tryPromise({
    try: () =>
      enqueueEmailIdempotent(tx, {
        type: JobTypes.EmailSend,
        dedupeKey: `fixed-slot:assigned:${reservationId}`,
        payload: {
          version: 1,
          to: template.user.email,
          kind: "raw",
          subject: email.subject,
          html: email.html,
        },
        runAt: context.now,
      }),
    catch: err => err as unknown,
  }).pipe(Effect.catchAll(err => Effect.die(err)));
}

async function runFixedSlotAssignmentTransaction(
  client: PrismaClient,
  template: FixedSlotAssignmentTemplateRow,
  labels: FixedSlotLabels,
  context: FixedSlotAssignmentContext,
): Promise<FixedSlotAssignmentOutcome> {
  return client.$transaction(async (tx) => {
    const exit = await Effect.runPromiseExit(Effect.gen(function* () {
      const bikeRepo = makeBikeRepository(tx);
      const txReservationQueryRepo = makeReservationQueryRepository(tx);
      const txReservationCommandRepo = makeReservationCommandRepository(tx);
      const reservationOpt = yield* txReservationQueryRepo.findPendingFixedSlotByTemplateAndStart(
        template.id,
        labels.slotStartAt,
      );

      if (Option.isNone(reservationOpt)) {
        return "MISSING_RESERVATION" as const;
      }
      const reservation = reservationOpt.value;

      const bikeOpt = yield* bikeRepo.findAvailableByStation(template.stationId);
      if (Option.isNone(bikeOpt)) {
        yield* enqueueNoBikeEmail(tx, template, labels, context);
        return "NO_BIKE" as const;
      }
      const bike = bikeOpt.value;

      const reservationAssigned = yield* txReservationCommandRepo.assignBikeToPendingReservation(
        reservation.id,
        bike.id,
        context.now,
      );
      if (!reservationAssigned) {
        return "CONFLICT" as const;
      }

      const bikeReserved = yield* bikeRepo.reserveBikeIfAvailable(bike.id, context.now);
      if (!bikeReserved) {
        // Roll back the reservation bike assignment so the next run can retry cleanly.
        return yield* Effect.fail(new FixedSlotAssignmentConflict());
      }

      // TODO(iot): send reservation "reserve" command once IoT integration is ready.
      yield* enqueueAssignedEmail(tx, reservation.id, template, labels, context);

      return "ASSIGNED" as const;
    }));

    if (Exit.isSuccess(exit)) {
      return exit.value;
    }

    const failure = Cause.failureOption(exit.cause);
    if (Option.isSome(failure)) {
      throw failure.value;
    }

    throw Cause.squash(exit.cause);
  });
}

function processFixedSlotTemplate(
  client: PrismaClient,
  template: FixedSlotAssignmentTemplateRow,
  context: FixedSlotAssignmentContext,
) {
  const labels = buildFixedSlotLabels(context.slotDate, template.slotStart);

  return Effect.tryPromise({
    try: () => runFixedSlotAssignmentTransaction(client, template, labels, context),
    catch: err => err as unknown,
  }).pipe(
    Effect.catchIf(
      (err): err is FixedSlotAssignmentConflict => err instanceof FixedSlotAssignmentConflict,
      () => Effect.succeed("CONFLICT" as const),
    ),
    Effect.catchAll(err => Effect.die(err)),
  );
}

function incrementFixedSlotCounts(
  counts: FixedSlotCounts,
  outcome: FixedSlotAssignmentOutcome,
) {
  switch (outcome) {
    case "ASSIGNED":
      counts.assigned += 1;
      break;
    case "NO_BIKE":
      counts.noBike += 1;
      break;
    case "MISSING_RESERVATION":
      counts.missingReservation += 1;
      break;
    case "CONFLICT":
      counts.conflicts += 1;
      break;
    default: {
      const _exhaustive: never = outcome;
      throw _exhaustive;
    }
  }
}

export function assignFixedSlotReservations(args: {
  readonly slotDate?: Date;
  readonly assignmentTime?: Date;
  readonly now?: Date;
}): Effect.Effect<
  FixedSlotAssignmentSummary,
  never,
  Prisma | BikeRepository
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    yield* BikeRepository;
    const assignmentTime = args.assignmentTime ?? new Date();
    const slotDate = args.slotDate ?? normalizeSlotDate(assignmentTime);
    const context: FixedSlotAssignmentContext = {
      slotDate,
      slotDateKey: toSlotDateKey(slotDate),
      now: args.now ?? new Date(),
    };

    const reservationQueryRepo = makeReservationQueryRepository(client);
    const templates = yield* reservationQueryRepo.listActiveFixedSlotTemplatesByDate(slotDate);
    const counts: FixedSlotCounts = {
      assigned: 0,
      noBike: 0,
      missingReservation: 0,
      conflicts: 0,
    };
    // TODO(ops): Avoid "sequential death" — a single unexpected DB/infra failure currently dies the whole run.
    // Wrap per-template processing with `Effect.either` / `Effect.catchAll` to log + continue, and track an error count.

    for (const template of templates) {
      const outcome = yield* processFixedSlotTemplate(client, template, context);
      incrementFixedSlotCounts(counts, outcome);
    }

    return {
      slotDate: context.slotDateKey,
      totalTemplates: templates.length,
      ...counts,
    };
  });
}
