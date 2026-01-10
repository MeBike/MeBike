import { Data, Effect, Option } from "effect";

import type { RentalSortField } from "@/domain/rentals/models";
import type { PageRequest } from "@/domain/shared/pagination";

import type { RentalRepositoryError } from "../domain-errors";
import type {
  AdminRentalDetail,
  AdminRentalFilter,
  AdminRentalListItem,
} from "../models";

import { RentalRepository } from "../repository/rental.repository";

export class AdminRentalNotFound extends Data.TaggedError("AdminRentalNotFound")<{
  readonly rentalId: string;
}> {
  constructor(readonly rentalId: string) {
    super({ rentalId });
  }
}

export function adminListRentalsUseCase(input: {
  filter: AdminRentalFilter;
  pageReq: PageRequest<RentalSortField>;
}): Effect.Effect<
  { items: AdminRentalListItem[]; page: number; pageSize: number; total: number; totalPages: number },
  RentalRepositoryError,
  RentalRepository
> {
  return Effect.gen(function* () {
    const repo = yield* RentalRepository;

    return yield* repo.adminListRentals(input.filter, input.pageReq);
  });
}

/**
 * Admin use case to get a single rental by ID with full details.
 * Returns detailed rental with populated user, bike, and station data.
 */
export function adminGetRentalDetailUseCase(
  rentalId: string,
): Effect.Effect<AdminRentalDetail, RentalRepositoryError | AdminRentalNotFound, RentalRepository> {
  return Effect.gen(function* () {
    const repo = yield* RentalRepository;

    const result = yield* repo.adminGetRentalById(rentalId);

    if (Option.isNone(result)) {
      return yield* Effect.fail(new AdminRentalNotFound(rentalId));
    }

    return result.value;
  });
}
