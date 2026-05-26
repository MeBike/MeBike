import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";
import type { SupplierStatus } from "generated/prisma/client";

export class BikeRepositoryError extends Data.TaggedError("BikeRepositoryError")<
  WithGenericError
> {}

export class BikeNotFound extends Data.TaggedError("BikeNotFound")<{
  readonly id: string;
}> {}

export class BikeStationNotFound extends Data.TaggedError("BikeStationNotFound")<{
  readonly stationId: string;
}> {}

export class BikeStationPlacementCapacityExceeded extends Data.TaggedError("BikeStationPlacementCapacityExceeded")<{
  readonly stationId: string;
  readonly availablePlacementSlots: number;
  readonly requiredPlacementSlots: number;
}> {}

export class BikeSupplierNotFound extends Data.TaggedError("BikeSupplierNotFound")<{
  readonly supplierId: string;
}> {}

export class BikeSupplierNotActive extends Data.TaggedError("BikeSupplierNotActive")<{
  readonly supplierId: string;
  readonly status: SupplierStatus;
}> {}

export class InvalidBikeStatus extends Data.TaggedError("InvalidBikeStatus")<{
  readonly status: string;
  readonly allowed: readonly string[];
}> {}

export class BikeCurrentlyRented extends Data.TaggedError("BikeCurrentlyRented")<{
  readonly bikeId: string;
  readonly action: "update_station" | "delete";
}> {}

export class BikeCurrentlyReserved extends Data.TaggedError("BikeCurrentlyReserved")<{
  readonly bikeId: string;
  readonly action: "update_station" | "delete";
}> {}

export class BikeSystemCapacityExceeded extends Data.TaggedError("BikeSystemCapacityExceeded")<{
  readonly activeBikesCount: number;
  readonly totalCapacity: number;
}> {}
