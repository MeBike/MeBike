import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";
import type {
  SubscriptionNotFound,
  SubscriptionNotUsable,
  SubscriptionUsageExceeded,
} from "@/domain/subscriptions/domain-errors";
import type { BikeSwapStatus } from "generated/kysely/types";
import type { BikeStatus, RentalStatus } from "generated/prisma/enums";

export class RentalRepositoryError extends Data.TaggedError(
  "RentalRepositoryError",
)<WithGenericError> {}

export class RentalUniqueViolation extends Data.TaggedError(
  "RentalUniqueViolation",
)<WithGenericError<{ constraint?: string | string[] }>> {}

export class ReturnSlotUniqueViolation extends Data.TaggedError(
  "ReturnSlotUniqueViolation",
)<WithGenericError<{ constraint?: string | string[] }>> {}

export class ReturnConfirmationUniqueViolation extends Data.TaggedError(
  "ReturnConfirmationUniqueViolation",
)<WithGenericError<{ constraint?: string | string[] }>> {}

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

export class BikeNotFoundInStation extends Data.TaggedError(
  "BikeNotFoundInStation",
)<{
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

export class InsufficientBalanceToRent extends Data.TaggedError(
  "InsufficientBalanceToRent",
)<{
    readonly userId: string;
    readonly requiredBalance: number;
    readonly currentBalance: number;
  }> {}

export class InvalidRentalState extends Data.TaggedError("InvalidRentalState")<{
  readonly rentalId: string;
  readonly from: RentalStatus;
  readonly to: RentalStatus;
}> {}

export class ReturnSlotRequiredForReturn extends Data.TaggedError(
  "ReturnSlotRequiredForReturn",
)<{
    readonly rentalId: string;
    readonly endStationId: string;
  }> {}

export class ReturnSlotStationMismatch extends Data.TaggedError(
  "ReturnSlotStationMismatch",
)<{
    readonly rentalId: string;
    readonly returnSlotStationId: string;
    readonly attemptedEndStationId: string;
  }> {}

export class UnauthorizedRentalAccess extends Data.TaggedError(
  "UnauthorizedRentalAccess",
)<{
    readonly rentalId: string;
    readonly userId: string;
  }> {}

export class CannotRequestSwap extends Data.TaggedError("CannotRequestSwap")<{
  readonly rentalId: string;
  readonly status: string;
}> {}

export class ReturnSlotRequiresActiveRental extends Data.TaggedError(
  "ReturnSlotRequiresActiveRental",
)<{
    readonly rentalId: string;
    readonly status: RentalStatus;
  }> {}

export class ReturnSlotNotFound extends Data.TaggedError("ReturnSlotNotFound")<{
  readonly rentalId: string;
  readonly userId: string;
}> {}

export class ReturnSlotCapacityExceeded extends Data.TaggedError(
  "ReturnSlotCapacityExceeded",
)<{
    readonly stationId: string;
    readonly totalCapacity: number;
    readonly returnSlotLimit: number;
    readonly totalBikes: number;
    readonly activeReturnSlots: number;
  }> {}

export class ReturnAlreadyConfirmed extends Data.TaggedError(
  "ReturnAlreadyConfirmed",
)<{
    readonly rentalId: string;
  }> {}

export class BikeSwapRequestNotFound extends Data.TaggedError(
  "BikeSwapRequestNotFound",
)<{
    readonly bikeSwapRequestId: string;
  }> {}

export class NoAvailableBike extends Data.TaggedError("NoAvailableBike")<Record<string, never>> {}

export class BikeSwapRequestExisted extends Data.TaggedError(
  "BikeSwapRequestExisted",
)<{
    readonly rentalId: string;
  }> {}

export class InvalidBikeSwapRequestStatus extends Data.TaggedError(
  "InvalidBikeSwapRequestStatus",
)<{
    readonly status: BikeSwapStatus;
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
    | ReturnSlotRequiredForReturn
    | ReturnSlotStationMismatch
    | ReturnSlotRequiresActiveRental
    | ReturnSlotNotFound
    | ReturnSlotCapacityExceeded
    | ReturnAlreadyConfirmed
    | SubscriptionNotFound
    | SubscriptionNotUsable
    | SubscriptionUsageExceeded
    | CannotRequestSwap
    | BikeSwapRequestNotFound
    | NoAvailableBike
    | InvalidBikeSwapRequestStatus
    | BikeSwapRequestExisted;

export type RentalRepoError = RentalUniqueViolation;

export type ReturnSlotRepoError = ReturnSlotUniqueViolation;

export type ReturnConfirmationRepoError = ReturnConfirmationUniqueViolation;
