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
  readonly totalCapacity: number;
  readonly maxCapacity: number;
}> {}

export class StationCapacitySplitInvalid extends Data.TaggedError("StationCapacitySplitInvalid")<{
  readonly totalCapacity: number;
  readonly pickupSlotLimit: number;
  readonly returnSlotLimit: number;
}> {}

export class StationAgencyRequired extends Data.TaggedError("StationAgencyRequired")<{}> {}

export class StationAgencyForbidden extends Data.TaggedError("StationAgencyForbidden")<{}> {}

export class StationAgencyNotFound extends Data.TaggedError("StationAgencyNotFound")<{
  readonly agencyId: string;
}> {}

export class StationAgencyAlreadyAssigned extends Data.TaggedError("StationAgencyAlreadyAssigned")<{
  readonly agencyId: string;
  readonly stationId: string;
}> {}

export class StationHasBikes extends Data.TaggedError("StationHasBikes")<{
  readonly stationId: string;
}> {}
