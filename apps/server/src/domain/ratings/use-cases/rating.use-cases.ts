import type { Option } from "effect";

import { Effect } from "effect";

import { RentalServiceTag } from "@/domain/rentals";

import type {
  CreateRatingFailure,
  RatingRepositoryError as RatingRepoErrorAlias,
} from "../domain-errors";
import type { CreateRatingInput, RatingRow } from "../models";

import {
  CannotRateOthersRental,
  CannotRateUncompletedRental,
  RatingAlreadyExists,
  RatingExpired,
  RatingReasonNotFound,
} from "../domain-errors";
import { RatingReasonRepository } from "../repository/rating-reason.repository";
import { RatingServiceTag } from "../services/rating.service";

export function createRatingUseCase(input: CreateRatingInput): Effect.Effect<
  RatingRow,
  RatingRepoErrorAlias | RatingAlreadyExists,
  RatingServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* RatingServiceTag;
    return yield* service.create(input);
  });
}

export function getRatingByRentalIdUseCase(rentalId: string): Effect.Effect<
  Option.Option<RatingRow>,
  RatingRepoErrorAlias,
  RatingServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* RatingServiceTag;
    return yield* service.getByRentalId(rentalId);
  });
}

export function createRatingWithGuardsUseCase(input: CreateRatingInput): Effect.Effect<
  RatingRow,
  CreateRatingFailure,
  RatingServiceTag | RatingReasonRepository | RentalServiceTag
> {
  return Effect.gen(function* () {
    const ratingService = yield* RatingServiceTag;
    const reasonRepo = yield* RatingReasonRepository;
    const rentalService = yield* RentalServiceTag;

    // Rental existence and ownership/status checks
    const rental = yield* rentalService.getByIdForUser({
      rentalId: input.rentalId,
      userId: input.userId,
    });

    if (rental.status !== "COMPLETED") {
      return yield* Effect.fail(new CannotRateUncompletedRental({
        rentalId: rental.id,
        status: rental.status,
      }));
    }

    if (rental.userId !== input.userId) {
      return yield* Effect.fail(new CannotRateOthersRental({
        rentalId: rental.id,
        ownerUserId: rental.userId,
        requesterUserId: input.userId,
      }));
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (!rental.endTime || rental.endTime < sevenDaysAgo) {
      return yield* Effect.fail(new RatingExpired({ rentalId: rental.id }));
    }

    const existing = yield* ratingService.getByRentalId(input.rentalId);
    if (existing._tag === "Some") {
      return yield* Effect.fail(new RatingAlreadyExists({ rentalId: input.rentalId }));
    }

    const reasons = yield* reasonRepo.findManyByIds(input.reasonIds);
    const existingIds = new Set(reasons.map(r => r.id));
    const missing = input.reasonIds.filter(id => !existingIds.has(id));
    if (missing.length > 0) {
      return yield* Effect.fail(new RatingReasonNotFound({ missingIds: missing }));
    }

    return yield* ratingService.create(input);
  });
}
