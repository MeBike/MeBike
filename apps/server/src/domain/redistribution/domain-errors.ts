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

export class StationNotFound extends Data.TaggedError("StationNotFound")<{
  readonly stationId: string;
}> {}

export class AgencyNotFound extends Data.TaggedError("AgencyNotFound")<{
  readonly agencyId: string;
}> {}

export class BikeNotAvailable extends Data.TaggedError("BikeNotAvailable")<{
  readonly bikeId: string;
}> {}

export type RedistributionServiceFailure
  = | RedistributionRequestNotFound
    | RedistributionRequestAlreadyExists
    | InvalidRedistributionStatus
    | UnauthorizedRedistributionAccess
    | StationNotFound
    | AgencyNotFound
    | BikeNotAvailable
    | RedistributionRepositoryError;
