import { Cause, Effect, Exit, Option } from "effect";

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

/**
 * Enqueue email outbox theo cach idempotent cho fixed-slot flow.
 *
 * @param tx Prisma transaction hien tai.
 * @param args Payload outbox can enqueue.
 * @returns Effect bo qua unique violation de worker rerun van safe.
 */
function enqueueEmailIdempotent(
  tx: PrismaTypes.TransactionClient,
  args: Parameters<typeof enqueueOutboxJobInTx>[1],
) {
  return enqueueOutboxJobInTx(tx, args).pipe(
    Effect.catchIf(isPrismaUniqueViolation, () => Effect.void),
    Effect.catchAll(err => Effect.die(err)),
  );
}

/**
 * Enqueue email thong bao khong con xe cho slot dang xu ly.
 *
 * @param tx Prisma transaction hien tai.
 * @param template Template dang duoc assign.
 * @param labels Label da build cho slot hien tai.
 * @param context Context chung cua lan assignment.
 * @returns Effect enqueue email voi dedupe key theo template + ngay.
 */
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

  return enqueueEmailIdempotent(tx, {
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
  });
}

/**
 * Enqueue email thong bao assignment thanh cong cho reservation vua tao.
 *
 * @param tx Prisma transaction hien tai.
 * @param reservationId ID reservation vua duoc tao.
 * @param template Template dang duoc assign.
 * @param labels Label da build cho slot hien tai.
 * @param context Context chung cua lan assignment.
 * @returns Effect enqueue email voi dedupe key theo reservation.
 */
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

  return enqueueEmailIdempotent(tx, {
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
  });
}

/**
 * Chay transaction assignment cho mot fixed-slot template.
 *
 * @param client Prisma client goc de mo transaction.
 * @param template Template dang xu ly.
 * @param labels Label va `slotStartAt` cua slot hien tai.
 * @param context Context assignment cho ngay dang chay.
 * @returns Promise ket qua assignment cho template do.
 */
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
      const existingReservationOpt = yield* txReservationQueryRepo.findPendingFixedSlotByTemplateAndStart(
        template.id,
        labels.slotStartAt,
      );

      if (Option.isSome(existingReservationOpt) && existingReservationOpt.value.bikeId) {
        return "ALREADY_ASSIGNED" as const;
      }
      if (Option.isSome(existingReservationOpt)) {
        return yield* Effect.fail(new FixedSlotAssignmentConflict());
      }

      const bikeOpt = yield* bikeRepo.findAvailableByStation(template.stationId);
      if (Option.isNone(bikeOpt)) {
        yield* enqueueNoBikeEmail(tx, template, labels, context);
        return "NO_BIKE" as const;
      }
      const bike = bikeOpt.value;

      const bikeReserved = yield* bikeRepo.reserveBikeIfAvailable(bike.id, context.now);
      if (!bikeReserved) {
        return yield* Effect.fail(new FixedSlotAssignmentConflict());
      }

      const reservation = yield* txReservationCommandRepo.createReservation({
        userId: template.userId,
        bikeId: bike.id,
        stationId: template.stationId,
        pricingPolicyId: template.pricingPolicyId,
        reservationOption: "FIXED_SLOT",
        fixedSlotTemplateId: template.id,
        subscriptionId: template.subscriptionId,
        startTime: labels.slotStartAt,
        endTime: null,
        prepaid: template.prepaid,
        status: "PENDING",
      }).pipe(
        Effect.catchTag("ReservationUniqueViolation", () =>
          Effect.fail(new FixedSlotAssignmentConflict())),
      );

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

/**
 * Xu ly assignment cho mot fixed-slot template trong ngay muc tieu.
 *
 * @param client Prisma client goc.
 * @param template Template dang duoc assign.
 * @param context Context assignment cho ngay dang chay.
 * @returns Effect ket qua assignment da duoc map ve union outcome on dinh.
 */
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
