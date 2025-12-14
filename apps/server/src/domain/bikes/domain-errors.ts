import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";

export class BikeRepositoryError extends Data.TaggedError("BikeRepositoryError")<
  WithGenericError
> {}

export class BikeNotFound extends Data.TaggedError("BikeNotFound")<{
  readonly id: string;
}> {}

export class DuplicateChipId extends Data.TaggedError("DuplicateChipId")<{
  readonly chipId: string;
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

export class BikeNotRentedByUser extends Data.TaggedError("BikeNotRentedByUser")<{
  readonly bikeId: string;
  readonly userId: string;
}> {}
