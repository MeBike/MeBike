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
  readonly returnSlotLimit: number;
}> {}

export class StationCapacityBelowActiveUsage extends Data.TaggedError("StationCapacityBelowActiveUsage")<{
  readonly stationId: string;
  readonly totalCapacity: number;
  readonly totalBikes: number;
  readonly activeReturnSlots: number;
}> {}

export class StationReturnSlotLimitBelowActiveReservations extends Data.TaggedError("StationReturnSlotLimitBelowActiveReservations")<{
  readonly stationId: string;
  readonly returnSlotLimit: number;
  readonly activeReturnSlots: number;
}> {}

export class StationAgencyRequired extends Data.TaggedError("StationAgencyRequired")<
  Record<string, never>
> {}

export class StationAgencyForbidden extends Data.TaggedError("StationAgencyForbidden")<
  Record<string, never>
> {}

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
