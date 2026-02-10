import { Option } from "effect";

import type { BikeStatus } from "generated/prisma/enums";

import {
  BikeAlreadyRented,
  BikeIsBroken,
  BikeIsMaintained,
  BikeIsReserved,
  BikeUnavailable,
  InvalidBikeStatus,
} from "../domain-errors";

export type StartRentalBikeStatusFailure
  = | BikeAlreadyRented
    | BikeIsBroken
    | BikeIsMaintained
    | BikeIsReserved
    | BikeUnavailable
    | InvalidBikeStatus;

export function startRentalFailureFromBikeStatus(args: {
  bikeId: string;
  status: BikeStatus;
}): Option.Option<StartRentalBikeStatusFailure> {
  const { bikeId, status } = args;

  switch (status) {
    case "AVAILABLE":
      return Option.none();
    case "BOOKED":
      return Option.some(new BikeAlreadyRented({ bikeId }));
    case "BROKEN":
      return Option.some(new BikeIsBroken({ bikeId }));
    case "MAINTAINED":
      return Option.some(new BikeIsMaintained({ bikeId }));
    case "RESERVED":
      return Option.some(new BikeIsReserved({ bikeId }));
    case "UNAVAILABLE":
      return Option.some(new BikeUnavailable({ bikeId }));
    default:
      return Option.some(new InvalidBikeStatus({ bikeId, status }));
  }
}
