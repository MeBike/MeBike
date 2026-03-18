import { Data, Effect, Option } from "effect";

import { Prisma } from "@/infrastructure/prisma";
import { runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type {
  BikeSwapRequestNotFound,
  InvalidBikeSwapRequestStatus,
  NoAvailableBike,
  RentalRepositoryError,
} from "../domain-errors";
import type { StaffBikeSwapRequestRow } from "../models";

import { makeRentalRepository, RentalRepository } from "../repository/rental.repository";

export class StaffBikeRequestNotFound extends Data.TaggedError(
  "StaffBikeRequestNotFound",
)<{
    readonly bikeSwapRequestId: string;
  }> {
  constructor(readonly bikeSwapRequestId: string) {
    super({ bikeSwapRequestId });
  }
}

export function staffGetChangeBikeDetailUseCase(
  bikeSwapRequestId: string,
): Effect.Effect<
  StaffBikeSwapRequestRow,
  RentalRepositoryError | StaffBikeRequestNotFound,
  RentalRepository
> {
  return Effect.gen(function* () {
    const repo = yield* RentalRepository;

    const result = yield* repo.staffGetBikeSwapRequests(bikeSwapRequestId);

    if (Option.isNone(result)) {
      return yield* Effect.fail(
        new StaffBikeRequestNotFound(bikeSwapRequestId),
      );
    }

    return result.value;
  });
}

export function staffApproveBikeSwapRequestUseCase(
  bikeSwapRequestId: string,
): Effect.Effect<
  StaffBikeSwapRequestRow,
  | RentalRepositoryError
  | StaffBikeRequestNotFound
  | NoAvailableBike
  | InvalidBikeSwapRequestStatus
  | BikeSwapRequestNotFound
  | import("@/lib/effect/prisma-tx").PrismaTransactionError,
  RentalRepository | Prisma
> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;

    const result = yield* runPrismaTransaction(client, (tx) => {
      const txRepo = makeRentalRepository(tx);
      return txRepo.staffApproveBikeSwapRequests(bikeSwapRequestId);
    });

    if (Option.isNone(result)) {
      return yield* Effect.fail(
        new StaffBikeRequestNotFound(bikeSwapRequestId),
      );
    }

    return result.value;
  });
}

export function staffRejectBikeSwapRequestUseCase(
  bikeSwapRequestId: string,
  reason: string,
): Effect.Effect<
  StaffBikeSwapRequestRow,
  | RentalRepositoryError
  | StaffBikeRequestNotFound
  | InvalidBikeSwapRequestStatus
  | BikeSwapRequestNotFound,
  RentalRepository
> {
  return Effect.gen(function* () {
    const repo = yield* RentalRepository;

    const result = yield* repo.staffRejectBikeSwapRequests(
      bikeSwapRequestId,
      reason,
    );

    if (Option.isNone(result)) {
      return yield* Effect.fail(
        new StaffBikeRequestNotFound(bikeSwapRequestId),
      );
    }

    return result.value;
  });
}
