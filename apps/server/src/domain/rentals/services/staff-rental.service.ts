import { Data, Effect, Option } from "effect";

import type { RentalRepositoryError } from "../domain-errors";
import type { StaffBikeSwapRequestRow } from "../models";

import { RentalRepository } from "../repository/rental.repository";

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
