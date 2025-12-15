import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";
import type { RentalStatus } from "generated/prisma/enums";

export class RentalRepositoryError extends Data.TaggedError("RentalRepositoryError")<
  WithGenericError
> {}

export class RentalUniqueViolation extends Data.TaggedError("RentalUniqueViolation")<
  WithGenericError<{ constraint?: string | string[] }>
> {}

// User-level domain errors
export class RentalNotFound extends Data.TaggedError("RentalNotFound")<{
  readonly rentalId: string;
  readonly userId: string;
}> {}

export class ActiveRentalExists extends Data.TaggedError("ActiveRentalExists")<{
  readonly userId: string;
}> {}

export class BikeAlreadyRented extends Data.TaggedError("BikeAlreadyRented")<{
  readonly bikeId: string;
}> {}

export class InvalidRentalState extends Data.TaggedError("InvalidRentalState")<{
  readonly rentalId: string;
  readonly from: RentalStatus;
  readonly to: RentalStatus;
}> {}

export class EndStationMismatch extends Data.TaggedError("EndStationMismatch")<{
  readonly rentalId: string;
  readonly startStationId: string | null;
  readonly attemptedEndStationId: string;
}> {}

export class UnauthorizedRentalAccess extends Data.TaggedError(
  "UnauthorizedRentalAccess",
)<{
    readonly rentalId: string;
    readonly userId: string;
  }> {}

// Union type for service failures
export type RentalServiceFailure
  = | RentalNotFound
    | ActiveRentalExists
    | BikeAlreadyRented
    | InvalidRentalState
    | EndStationMismatch;

// Repository-level error union
export type RentalRepoError = RentalRepositoryError | RentalUniqueViolation;
