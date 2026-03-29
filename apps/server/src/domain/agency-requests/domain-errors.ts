import { Data } from "effect";

export class AgencyRequestRepositoryError extends Data.TaggedError("AgencyRequestRepositoryError")<{
  readonly operation: string;
  readonly cause: unknown;
}> {}

export class AgencyRequestNotFound extends Data.TaggedError("AgencyRequestNotFound")<{
  readonly agencyRequestId: string;
}> {}

export class AgencyRequestNotOwned extends Data.TaggedError("AgencyRequestNotOwned")<{
  readonly agencyRequestId: string;
  readonly userId: string;
}> {}

export class InvalidAgencyRequestStatusTransition extends Data.TaggedError("InvalidAgencyRequestStatusTransition")<{
  readonly agencyRequestId: string;
  readonly currentStatus: string;
  readonly nextStatus: string;
}> {}
