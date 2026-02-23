import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";

export class StationRepositoryError extends Data.TaggedError("StationRepositoryError")<
  WithGenericError
> {}

export class StationNotFound extends Data.TaggedError("StationNotFound")<{
  readonly id: string;
}> {}

export class StationNameAlreadyExists extends Data.TaggedError("StationNameAlreadyExists")<{
  readonly name: string;
}> {}

export class StationOutsideSupportedArea extends Data.TaggedError("StationOutsideSupportedArea")<{
  readonly latitude: number;
  readonly longitude: number;
}> {}

export class StationCapacityLimitExceeded extends Data.TaggedError("StationCapacityLimitExceeded")<{
  readonly capacity: number;
  readonly maxCapacity: number;
}> {}

export class StationHasBikes extends Data.TaggedError("StationHasBikes")<{
  readonly stationId: string;
}> {}
