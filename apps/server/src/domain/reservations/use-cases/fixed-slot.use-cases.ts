import { Effect, Option } from "effect";

import type { enqueueOutboxJob } from "@/infrastructure/jobs/outbox-enqueue";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { BikeRepository, makeBikeRepository } from "@/domain/bikes";
import { RentalRepository } from "@/domain/rentals";
import { JobTypes } from "@/infrastructure/jobs/job-types";
import { enqueueOutboxJobInTx } from "@/infrastructure/jobs/outbox-enqueue";
import { Prisma } from "@/infrastructure/prisma";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";
import {
  buildFixedSlotAssignedEmail,
  buildFixedSlotNoBikeEmail,
} from "@/lib/email-templates";

import { ReservationRepository } from "../repository/reservation.repository";

export type FixedSlotAssignmentSummary = {
  readonly slotDate: string;
  readonly totalTemplates: number;
  readonly assigned: number;
  readonly noBike: number;
  readonly missingReservation: number;
  readonly conflicts: number;
};

type FixedSlotTemplateWithDetails = {
  readonly id: string;
  readonly userId: string;
  readonly stationId: string;
  readonly slotStart: Date;
  readonly user: {
    readonly fullname: string;
    readonly email: string;
  };
  readonly station: {
    readonly name: string;
  };
};

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

export function assignFixedSlotReservationsUseCase(args: {
  readonly slotDate?: Date;
  readonly assignmentTime?: Date;
  readonly now?: Date;
}): Effect.Effect<
  FixedSlotAssignmentSummary,
  never,
  Prisma | ReservationRepository | BikeRepository | RentalRepository
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    const reservationRepo = yield* ReservationRepository;
    const bikeRepo = yield* BikeRepository;
    const rentalRepo = yield* RentalRepository;
    const assignmentTime = args.assignmentTime ?? new Date();
    const slotDate = args.slotDate ?? normalizeSlotDate(assignmentTime);
    const slotDateKey = toSlotDateKey(slotDate);
    const now = args.now ?? new Date();

    const templates = yield* Effect.tryPromise({
      try: () =>
        client.fixedSlotTemplate.findMany({
          where: {
            status: "ACTIVE",
            dates: { some: { slotDate } },
          },
          select: {
            id: true,
            userId: true,
            stationId: true,
            slotStart: true,
            user: { select: { fullname: true, email: true } },
            station: { select: { name: true } },
          },
        }) as Promise<FixedSlotTemplateWithDetails[]>,
      catch: err => err as unknown,
    }).pipe(Effect.catchAll(err => Effect.die(err)));

    let assigned = 0;
    let noBike = 0;
    let missingReservation = 0;
    let conflicts = 0;
    // TODO(ops): Avoid "sequential death" — a single unexpected DB/infra failure currently dies the whole run.
    // Wrap per-template processing with `Effect.either` / `Effect.catchAll` to log + continue, and track an error count.

    for (const template of templates) {
      const slotStartAt = mergeSlotStart(slotDate, template.slotStart);
      const slotDateLabel = formatSlotDateLabel(slotDate);
      const slotTimeLabel = formatSlotTimeLabel(template.slotStart);
      const outcome = yield* Effect.tryPromise({
        try: () =>
          client.$transaction(async tx =>
            Effect.runPromise(Effect.gen(function* () {
              const bikeRepo = makeBikeRepository(tx);
              const reservationOpt = yield* reservationRepo.findPendingFixedSlotByTemplateAndStartInTx(
                tx,
                template.id,
                slotStartAt,
              ).pipe(
                Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
              );

              if (Option.isNone(reservationOpt)) {
                return "MISSING_RESERVATION" as const;
              }
              const reservation = reservationOpt.value;

              const bikeOpt = yield* bikeRepo.findAvailableByStation(template.stationId).pipe(
                Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
              );

              if (Option.isNone(bikeOpt)) {
                const email = buildFixedSlotNoBikeEmail({
                  fullName: template.user.fullname,
                  stationName: template.station.name,
                  slotDateLabel,
                  slotTimeLabel,
                });
                yield* Effect.tryPromise({
                  try: () =>
                    enqueueEmailIdempotent(tx, {
                      type: JobTypes.EmailSend,
                      dedupeKey: `fixed-slot:no-bike:${template.id}:${slotDateKey}`,
                      payload: {
                        version: 1,
                        to: template.user.email,
                        kind: "raw",
                        subject: email.subject,
                        html: email.html,
                      },
                      runAt: now,
                    }),
                  catch: err => err as unknown,
                }).pipe(Effect.catchAll(err => Effect.die(err)));
                return "NO_BIKE" as const;
              }
              const bike = bikeOpt.value;

              const reservationAssigned = yield* reservationRepo.assignBikeToPendingReservationInTx(
                tx,
                reservation.id,
                bike.id,
                now,
              ).pipe(
                Effect.catchTag("ReservationRepositoryError", err => Effect.die(err)),
              );
              if (!reservationAssigned) {
                return "CONFLICT" as const;
              }

              const rentalAssigned = yield* rentalRepo.assignBikeToReservedRentalInTx(
                tx,
                reservation.id,
                bike.id,
                now,
              ).pipe(
                Effect.catchTag("RentalRepositoryError", err => Effect.die(err)),
              );
              if (!rentalAssigned) {
                return "CONFLICT" as const;
              }

              const bikeReserved = yield* bikeRepo.reserveBikeIfAvailable(bike.id, now).pipe(
                Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
              );
              if (!bikeReserved) {
                return "CONFLICT" as const;
              }

              // TODO(iot): send reservation "reserve" command once IoT integration is ready.

              const email = buildFixedSlotAssignedEmail({
                fullName: template.user.fullname,
                stationName: template.station.name,
                slotDateLabel,
                slotTimeLabel,
              });
              yield* Effect.tryPromise({
                try: () =>
                  enqueueEmailIdempotent(tx, {
                    type: JobTypes.EmailSend,
                    dedupeKey: `fixed-slot:assigned:${reservation.id}`,
                    payload: {
                      version: 1,
                      to: template.user.email,
                      kind: "raw",
                      subject: email.subject,
                      html: email.html,
                    },
                    runAt: now,
                  }),
                catch: err => err as unknown,
              }).pipe(Effect.catchAll(err => Effect.die(err)));

              return "ASSIGNED" as const;
            })),
          ),
        catch: err => err as unknown,
      }).pipe(Effect.catchAll(err => Effect.die(err)));

      switch (outcome) {
        case "ASSIGNED":
          assigned += 1;
          break;
        case "NO_BIKE":
          noBike += 1;
          break;
        case "MISSING_RESERVATION":
          missingReservation += 1;
          break;
        case "CONFLICT":
          conflicts += 1;
          break;
        default: {
          const _exhaustive: never = outcome;
          throw _exhaustive;
        }
      }
    }

    return {
      slotDate: slotDateKey,
      totalTemplates: templates.length,
      assigned,
      noBike,
      missingReservation,
      conflicts,
    };
  });
}
