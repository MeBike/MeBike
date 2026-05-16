import { Option } from "effect";

import type { BikeStatus } from "generated/prisma/enums";

import {
  BikeAlreadyRented,
  BikeIsBroken,
  BikeIsDisabled,
  BikeIsLost,
  BikeIsTransporting,
  BikeIsSwapping,
  BikeIsReserved,
  BikeIsPendingDispatch,
  InvalidBikeStatus,
  BikeIsFixed,
} from "../domain-errors";

export type StartRentalBikeStatusFailure
  = | BikeAlreadyRented
    | BikeIsBroken
    | BikeIsFixed
    | BikeIsReserved
    | BikeIsDisabled
    | BikeIsPendingDispatch
    | BikeIsTransporting
    | BikeIsSwapping
    | BikeIsLost
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
    case "FIXED":
      return Option.some(new BikeIsFixed({ bikeId }));
    case "RESERVED":
      return Option.some(new BikeIsReserved({ bikeId }));
    case "PENDING_DISPATCH":
      return Option.some(new BikeIsPendingDispatch({ bikeId }));
    case "TRANSPORTING":
      return Option.some(new BikeIsTransporting({ bikeId }));
    case "SWAPPING":
      return Option.some(new BikeIsSwapping({ bikeId }));
    case "LOST":
      return Option.some(new BikeIsLost({ bikeId }));
    case "DISABLED":
      return Option.some(new BikeIsDisabled({ bikeId }));
    default:
      return Option.some(new InvalidBikeStatus({ bikeId, status }));
  }
}
