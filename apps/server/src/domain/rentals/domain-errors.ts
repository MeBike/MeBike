import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";
import type { BikeStatus, RentalStatus } from "generated/prisma/enums";

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

export class BikeNotFound extends Data.TaggedError("BikeNotFound")<{
  readonly bikeId: string;
}> {}

export class BikeMissingStation extends Data.TaggedError("BikeMissingStation")<{
  readonly bikeId: string;
}> {}

export class BikeNotFoundInStation extends Data.TaggedError("BikeNotFoundInStation")<{
  readonly bikeId: string;
  readonly stationId: string;
}> {}

export class BikeIsBroken extends Data.TaggedError("BikeIsBroken")<{
  readonly bikeId: string;
}> {}

export class BikeIsMaintained extends Data.TaggedError("BikeIsMaintained")<{
  readonly bikeId: string;
}> {}

export class BikeIsReserved extends Data.TaggedError("BikeIsReserved")<{
  readonly bikeId: string;
}> {}

export class BikeUnavailable extends Data.TaggedError("BikeUnavailable")<{
  readonly bikeId: string;
}> {}

export class InvalidBikeStatus extends Data.TaggedError("InvalidBikeStatus")<{
  readonly bikeId: string;
  readonly status: BikeStatus;
}> {}

export class UserWalletNotFound extends Data.TaggedError("UserWalletNotFound")<{
  readonly userId: string;
}> {}

export class InsufficientBalanceToRent extends Data.TaggedError("InsufficientBalanceToRent")<{
  readonly userId: string;
  readonly requiredBalance: number;
  readonly currentBalance: number;
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

export type RentalServiceFailure
  = | RentalNotFound
    | ActiveRentalExists
    | BikeAlreadyRented
    | BikeNotFound
    | BikeMissingStation
    | BikeNotFoundInStation
    | BikeIsBroken
    | BikeIsMaintained
    | BikeIsReserved
    | BikeUnavailable
    | InvalidBikeStatus
    | UserWalletNotFound
    | InsufficientBalanceToRent
    | InvalidRentalState
    | EndStationMismatch;
export type RentalRepoError = RentalRepositoryError | RentalUniqueViolation;
