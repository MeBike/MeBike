import { Cause, Effect, Exit, Option } from "effect";

import type { enqueueOutboxJob } from "@/infrastructure/jobs/outbox-enqueue";
import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { makeBikeRepository } from "@/domain/bikes";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { enqueueOutboxJobInTx } from "@/infrastructure/jobs/outbox-enqueue";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";
import {
  buildFixedSlotAssignedEmail,
  buildFixedSlotNoBikeEmail,
} from "@/lib/email-templates";

import type {
  FixedSlotAssignmentContext,
  FixedSlotAssignmentOutcome,
  FixedSlotAssignmentTemplateRow,
  FixedSlotLabels,
} from "./fixed-slot.types";

import { makeReservationCommandRepository } from "../../repository/reservation-command.repository";
import { makeReservationQueryRepository } from "../../repository/reservation-query.repository";
import { buildFixedSlotLabels } from "./fixed-slot.helpers";

class FixedSlotAssignmentConflict extends Error {
  constructor() {
    super("Fixed-slot assignment conflict");
  }
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
        return yield* Effect.fail(new FixedSlotAssignmentConflict());
      }

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

export function processFixedSlotTemplate(
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
