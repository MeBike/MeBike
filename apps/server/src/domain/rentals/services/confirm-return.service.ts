import { Effect, Option } from "effect";

import { BikeRepository } from "@/domain/bikes";
import { defectOn } from "@/domain/shared";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type { RentalServiceFailure } from "../domain-errors";
import type { RentalRow } from "../models";
import type { ConfirmRentalReturnInput } from "../types";

import {
  InvalidRentalState,
  RentalNotFound,
  RentalRepositoryError,
  ReturnAlreadyConfirmed,
  ReturnSlotRequiredForReturn,
  ReturnSlotStationMismatch,
  UnauthorizedRentalAccess,
} from "../domain-errors";
import { makeRentalRepository, RentalRepository } from "../repository/rental.repository";
import {
  makeReturnConfirmationRepository,
  ReturnConfirmationRepository,
} from "../repository/return-confirmation.repository";
import { makeReturnSlotRepository, ReturnSlotRepository } from "../repository/return-slot.repository";
import { finalizeRentalReturnInTx } from "./finalize-rental-return";

export function confirmRentalReturnByOperator(
  input: ConfirmRentalReturnInput,
): Effect.Effect<
  RentalRow,
  RentalServiceFailure,
  | Prisma
  | RentalRepository
  | ReturnSlotRepository
  | ReturnConfirmationRepository
  | BikeRepository
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    yield* RentalRepository;
    yield* ReturnSlotRepository;
    yield* ReturnConfirmationRepository;
    yield* BikeRepository;

    return yield* runPrismaTransaction(
      client,
      tx =>
        Effect.gen(function* () {
          const txRentalRepo = makeRentalRepository(tx);
          const txReturnSlotRepo = makeReturnSlotRepository(tx);
          const txReturnConfirmationRepo = makeReturnConfirmationRepository(tx);

          const rentalOpt = yield* txRentalRepo.findById(input.rentalId);

          if (Option.isNone(rentalOpt)) {
            return yield* Effect.fail(new RentalNotFound({
              rentalId: input.rentalId,
              userId: "unknown",
            }));
          }

          const rental = rentalOpt.value;
          if (rental.status !== "RENTED") {
            return yield* Effect.fail(new InvalidRentalState({
              rentalId: rental.id,
              from: rental.status,
              to: "COMPLETED",
            }));
          }

          const operator = yield* Effect.tryPromise({
            try: async () => {
              if (
                input.operatorRole
                && (input.operatorRole === "STAFF"
                  || input.operatorRole === "AGENCY")
              ) {
                return {
                  role: input.operatorRole,
                  stationId: input.operatorStationId ?? null,
                  agencyId: input.operatorAgencyId ?? null,
                };
              }

              const user = await tx.user.findUnique({
                where: { id: input.confirmedByUserId },
                select: {
                  role: true,
                  orgAssignment: {
                    select: {
                      stationId: true,
                      agencyId: true,
                    },
                  },
                },
              });

              return user
                ? {
                    role: user.role,
                    stationId: user.orgAssignment?.stationId ?? null,
                    agencyId: user.orgAssignment?.agencyId ?? null,
                  }
                : null;
            },
            catch: e =>
              new RentalRepositoryError({
                operation: "confirmRentalReturnByOperator.findOperator",
                cause: e,
              }),
          }).pipe(defectOn(RentalRepositoryError));

          if (operator?.role === "STAFF" && operator.stationId !== input.stationId) {
            return yield* Effect.fail(new UnauthorizedRentalAccess({
              rentalId: rental.id,
              userId: input.confirmedByUserId,
            }));
          }

          if (operator?.role === "AGENCY") {
            const station = yield* Effect.tryPromise({
              try: () =>
                tx.station.findUnique({
                  where: { id: input.stationId },
                  select: { agencyId: true },
                }),
              catch: e =>
                new RentalRepositoryError({
                  operation: "confirmRentalReturnByOperator.findStationAgency",
                  cause: e,
                }),
            }).pipe(defectOn(RentalRepositoryError));

            if (!station || !operator.agencyId || station.agencyId !== operator.agencyId) {
              return yield* Effect.fail(new UnauthorizedRentalAccess({
                rentalId: rental.id,
                userId: input.confirmedByUserId,
              }));
            }
          }

          const activeReturnSlotOpt = yield* txReturnSlotRepo.findActiveByRentalId(rental.id);

          if (Option.isNone(activeReturnSlotOpt)) {
            return yield* Effect.fail(new ReturnSlotRequiredForReturn({
              rentalId: rental.id,
              endStationId: input.stationId,
            }));
          }

          const activeReturnSlot = activeReturnSlotOpt.value;
          if (activeReturnSlot.stationId !== input.stationId) {
            return yield* Effect.fail(new ReturnSlotStationMismatch({
              rentalId: rental.id,
              returnSlotStationId: activeReturnSlot.stationId,
              attemptedEndStationId: input.stationId,
            }));
          }

          const existingConfirmationOpt = yield* txReturnConfirmationRepo.findByRentalId(rental.id);

          if (Option.isSome(existingConfirmationOpt)) {
            return yield* Effect.fail(new ReturnAlreadyConfirmed({
              rentalId: rental.id,
            }));
          }

          yield* txReturnConfirmationRepo.create({
            rentalId: rental.id,
            stationId: input.stationId,
            confirmedByUserId: input.confirmedByUserId,
            confirmationMethod: input.confirmationMethod,
            handoverStatus: "CONFIRMED",
            confirmedAt: input.confirmedAt,
          }).pipe(
            Effect.catchTag("ReturnConfirmationUniqueViolation", () =>
              Effect.fail(new ReturnAlreadyConfirmed({ rentalId: rental.id }))),
          );

          return yield* finalizeRentalReturnInTx({
            tx,
            rental,
            bikeId: rental.bikeId,
            endStationId: input.stationId,
            endTime: input.confirmedAt,
          });
        }),
    ).pipe(
      defectOn(PrismaTransactionError),
    );
  });
}
