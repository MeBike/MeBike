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

import {
  makeRentalRepository,
  RentalRepository,
} from "../repository/rental.repository";

export class OperatorBikeSwapRequestNotFound extends Data.TaggedError(
  "OperatorBikeSwapRequestNotFound",
)<{
    readonly bikeSwapRequestId: string;
  }> {
  constructor(readonly bikeSwapRequestId: string) {
    super({ bikeSwapRequestId });
  }
}

export function getOperatorBikeSwapRequestDetail(
  userId: string,
  bikeSwapRequestId: string,
): Effect.Effect<
  StaffBikeSwapRequestRow,
  RentalRepositoryError | OperatorBikeSwapRequestNotFound,
  RentalRepository
> {
  return Effect.gen(function* () {
    const repo = yield* RentalRepository;

    const result = yield* repo.staffGetBikeSwapRequests(
      userId,
      bikeSwapRequestId,
    );

    if (Option.isNone(result)) {
      return yield* Effect.fail(
        new OperatorBikeSwapRequestNotFound(bikeSwapRequestId),
      );
    }

    return result.value;
  });
}

export function approveOperatorBikeSwapRequest(
  userId: string,
  bikeSwapRequestId: string,
): Effect.Effect<
  StaffBikeSwapRequestRow,
  | RentalRepositoryError
  | OperatorBikeSwapRequestNotFound
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
      return txRepo.staffApproveBikeSwapRequests(userId, bikeSwapRequestId);
    });

    if (Option.isNone(result)) {
      return yield* Effect.fail(
        new OperatorBikeSwapRequestNotFound(bikeSwapRequestId),
      );
    }

    return result.value;
  });
}

export function rejectOperatorBikeSwapRequest(
  userId: string,
  bikeSwapRequestId: string,
  reason: string,
): Effect.Effect<
  StaffBikeSwapRequestRow,
  | RentalRepositoryError
  | OperatorBikeSwapRequestNotFound
  | InvalidBikeSwapRequestStatus
  | BikeSwapRequestNotFound,
  RentalRepository
> {
  return Effect.gen(function* () {
    const repo = yield* RentalRepository;

    const result = yield* repo.staffRejectBikeSwapRequests(
      userId,
      bikeSwapRequestId,
      reason,
    );

    if (Option.isNone(result)) {
      return yield* Effect.fail(
        new OperatorBikeSwapRequestNotFound(bikeSwapRequestId),
      );
    }

    return result.value;
  });
}
