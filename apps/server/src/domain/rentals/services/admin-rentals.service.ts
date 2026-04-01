import { Data, Effect, Option } from "effect";

import type { RentalRepositoryError } from "../domain-errors";
import type { AdminRentalDetail, StaffBikeSwapRequestRow } from "../models";

import { RentalRepository } from "../repository/rental.repository";

export class AdminRentalNotFound extends Data.TaggedError(
  "AdminRentalNotFound",
)<{
    readonly rentalId: string;
  }> {
  constructor(readonly rentalId: string) {
    super({ rentalId });
  }
}

export class AdminBikeRequestNotFound extends Data.TaggedError(
  "AdminBikeRequestNotFound",
)<{
    readonly bikeSwapRequestId: string;
  }> {
  constructor(readonly bikeSwapRequestId: string) {
    super({ bikeSwapRequestId });
  }
}

export function adminGetRentalDetail(
  rentalId: string,
): Effect.Effect<
  AdminRentalDetail,
  AdminRentalNotFound,
  RentalRepository
> {
  return Effect.gen(function* () {
    const repo = yield* RentalRepository;

    const result = yield* repo.adminGetRentalById(rentalId);

    if (Option.isNone(result)) {
      return yield* Effect.fail(new AdminRentalNotFound(rentalId));
    }

    return result.value;
  });
}

export function adminGetChangeBikeDetail(
  bikeSwapRequestId: string,
): Effect.Effect<
  StaffBikeSwapRequestRow,
  RentalRepositoryError | AdminBikeRequestNotFound,
  RentalRepository
> {
  return Effect.gen(function* () {
    const repo = yield* RentalRepository;

    const result = yield* repo.staffGetBikeSwapRequests(bikeSwapRequestId);

    if (Option.isNone(result)) {
      return yield* Effect.fail(
        new AdminBikeRequestNotFound(bikeSwapRequestId),
      );
    }

    return result.value;
  });
}
