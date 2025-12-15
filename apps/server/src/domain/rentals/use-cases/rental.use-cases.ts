import type { Option } from "effect";

import { Effect } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type { RentalServiceFailure } from "../domain-errors";
import type { RentalCountsRow, RentalRow, RentalSortField, RentalStatusCounts } from "../models";
import type {
  EndRentalInput,
  ListMyRentalsInput,
  StartRentalInput,
} from "../types";

import { RentalServiceTag } from "../services/rental.service";

export function listMyRentalsUseCase(
  input: ListMyRentalsInput,
): Effect.Effect<PageResult<RentalRow>, never, RentalServiceTag> {
  return Effect.gen(function* () {
    const service = yield* RentalServiceTag;
    return yield* service.listMyRentals(input.userId, input.filter, input.pageReq);
  });
}

export function listMyCurrentRentalsUseCase(
  userId: string,
  pageReq: PageRequest<RentalSortField>,
): Effect.Effect<PageResult<RentalRow>, never, RentalServiceTag> {
  return Effect.gen(function* () {
    const service = yield* RentalServiceTag;
    return yield* service.listMyCurrentRentals(userId, pageReq);
  });
}

export function getMyRentalUseCase(
  userId: string,
  rentalId: string,
): Effect.Effect<Option.Option<RentalRow>, never, RentalServiceTag> {
  return Effect.gen(function* () {
    const service = yield* RentalServiceTag;
    return yield* service.getMyRentalById(userId, rentalId);
  });
}

export function getMyRentalCountsUseCase(
  userId: string,
): Effect.Effect<RentalStatusCounts, never, RentalServiceTag> {
  return Effect.gen(function* () {
    const service = yield* RentalServiceTag;
    const rows = yield* service.getMyRentalCounts(userId);
    
    return rows.reduce<RentalStatusCounts>(
      (acc, row) => ({ ...acc, [row.status]: row.count }),
      { RENTED: 0, COMPLETED: 0, CANCELLED: 0, RESERVED: 0 }
    );
  });
}

export function startRentalUseCase(
  input: StartRentalInput,
): Effect.Effect<RentalRow, RentalServiceFailure, RentalServiceTag> {
  return Effect.gen(function* () {
    const service = yield* RentalServiceTag;
    return yield* service.startRental(input);
  });
}

export function endRentalUseCase(
  input: EndRentalInput,
): Effect.Effect<RentalRow, RentalServiceFailure, RentalServiceTag> {
  return Effect.gen(function* () {
    const service = yield* RentalServiceTag;
    return yield* service.endRental(input);
  });
}
