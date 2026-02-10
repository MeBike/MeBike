import { Data } from "effect";

import type { RentalNotFound, RentalRepositoryError, UnauthorizedRentalAccess } from "@/domain/rentals";
import type { WithGenericError } from "@/domain/shared";

export class RatingRepositoryError extends Data.TaggedError("RatingRepositoryError")<
  WithGenericError
> {}

export class RatingAlreadyExists extends Data.TaggedError("RatingAlreadyExists")<{
  readonly rentalId: string;
}> {}

export class RatingNotFound extends Data.TaggedError("RatingNotFound")<{
  readonly ratingId?: string;
  readonly rentalId?: string;
}> {}

export class CannotRateUncompletedRental extends Data.TaggedError("CannotRateUncompletedRental")<{
  readonly rentalId: string;
  readonly status: string;
}> {}

export class CannotRateOthersRental extends Data.TaggedError("CannotRateOthersRental")<{
  readonly rentalId: string;
  readonly ownerUserId: string;
  readonly requesterUserId: string;
}> {}

export class RatingExpired extends Data.TaggedError("RatingExpired")<{
  readonly rentalId: string;
}> {}

export class RatingReasonNotFound extends Data.TaggedError("RatingReasonNotFound")<{
  readonly missingIds: readonly string[];
}> {}

export type CreateRatingFailure
  = | RatingRepositoryError
    | RatingAlreadyExists
    | RatingNotFound
    | CannotRateUncompletedRental
    | CannotRateOthersRental
    | RatingExpired
    | RatingReasonNotFound
    | RentalNotFound
    | RentalRepositoryError
    | UnauthorizedRentalAccess;
