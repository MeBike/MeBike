import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";

export class RedistributionRepositoryError extends Data.TaggedError(
  "RedistributionRepositoryError",
)<WithGenericError> {}

export class RedistributionRequestNotFound extends Data.TaggedError(
  "RedistributionRequestNotFound",
)<{
    readonly requestId: string;
  }> {}

export class RedistributionRequestNotFoundWithStatus extends Data.TaggedError(
  "RedistributionRequestNotFoundWithStatus",
)<{
    readonly requestId: string;
    readonly status: string;
  }> {}

export class RedistributionRequestAlreadyExists extends Data.TaggedError(
  "RedistributionRequestAlreadyExists",
)<{
    readonly userId: string;
    readonly sourceStationId: string;
  }> {}

export class InvalidRedistributionStatus extends Data.TaggedError(
  "InvalidRedistributionStatus",
)<{
    readonly requestId: string;
    readonly currentStatus: string;
    readonly attemptedStatus: string;
  }> {}

export class UnauthorizedRedistributionAccess extends Data.TaggedError(
  "UnauthorizedRedistributionAccess",
)<{
    readonly requestId: string;
    readonly userId: string;
  }> {}

export class UnauthorizedRedistributionCreation extends Data.TaggedError(
  "UnauthorizedRedistributionCreation",
)<{
    readonly userId: string;
    readonly sourceStationId: string;
  }> {}

export class UnauthorizedRedistributionCancellation extends Data.TaggedError(
  "UnauthorizedRedistributionCancellation",
)<{
    readonly requestId: string;
    readonly requestedByUserId: string;
    readonly userId: string;
  }> {}

export class UserNotFound extends Data.TaggedError("UserNotFound")<{
  readonly userId: string;
}> {}
export class StationNotFound extends Data.TaggedError("StationNotFound")<{
  readonly stationId: string;
}> {}

export class AgencyNotFound extends Data.TaggedError("AgencyNotFound")<{
  readonly agencyId: string;
}> {}

export class BikeNotAvailable extends Data.TaggedError("BikeNotAvailable")<{
  readonly bikeId: string;
}> {}

export class NotEnoughBikesAtStation extends Data.TaggedError(
  "NotEnoughBikesAtStation",
)<{
    readonly stationId: string;
    readonly required: number;
    readonly available: number;
  }> {}

export class NotEnoughEmptySlotsAtTarget extends Data.TaggedError(
  "NotEnoughEmptySlotsAtTarget",
)<{
    readonly targetId: string;
    readonly required: number;
    readonly available: number;
  }> {}

export class ExceededMinBikesAtStation extends Data.TaggedError(
  "ExceededMinBikesAtStation",
)<{
    readonly stationId: string;
    readonly minBikes: number;
    readonly restBikesAfterFulfillment: number;
  }> {}

export class CannotCancelNonPendingRedistribution extends Data.TaggedError(
  "CannotCancelNonPendingRedistribution",
)<{
    readonly requestId: string;
    readonly currentStatus: string;
  }> {}

export type RedistributionServiceFailure
  = | RedistributionRequestNotFound
    | RedistributionRequestNotFoundWithStatus
    | RedistributionRequestAlreadyExists
    | InvalidRedistributionStatus
    | UnauthorizedRedistributionAccess
    | UnauthorizedRedistributionCreation
    | UnauthorizedRedistributionCancellation
    | StationNotFound
    | AgencyNotFound
    | UserNotFound
    | BikeNotAvailable
    | NotEnoughBikesAtStation
    | NotEnoughEmptySlotsAtTarget
    | ExceededMinBikesAtStation
    | CannotCancelNonPendingRedistribution
    | RedistributionRepositoryError;
