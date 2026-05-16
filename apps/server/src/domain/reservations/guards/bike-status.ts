import { Option } from "effect";

import type { BikeStatus } from "generated/prisma/enums";

import {
  BikeAlreadyReserved,
  BikeIsDisabled,
  BikeIsLost,
  BikeIsPendingDispatch,
  BikeIsTransporting,
  BikeIsSwapping,
  BikeNotAvailable,
  BikeIsBroken,
  BikeIsFixed,
} from "../domain-errors";

type ReservationBikeStatusFailure
  = | BikeAlreadyReserved
    | BikeIsPendingDispatch
    | BikeIsTransporting
    | BikeIsSwapping
    | BikeIsLost
    | BikeIsBroken
    | BikeIsFixed
    | BikeIsDisabled
    | BikeNotAvailable;

type ReservationTransitionBikeStatusFailure
  = | BikeIsPendingDispatch
    | BikeIsTransporting
    | BikeIsSwapping
    | BikeIsLost
    | BikeIsBroken
    | BikeIsFixed
    | BikeIsDisabled
    | BikeNotAvailable;

export function reserveFailureFromBikeStatus(args: {
  bikeId: string;
  status: BikeStatus;
}): Option.Option<ReservationBikeStatusFailure> {
  const { bikeId, status } = args;

  switch (status) {
    case "AVAILABLE":
      return Option.none();
    case "RESERVED":
      return Option.some(new BikeAlreadyReserved({ bikeId }));
    case "PENDING_DISPATCH":
      return Option.some(new BikeIsPendingDispatch({ bikeId }));
    case "TRANSPORTING":
      return Option.some(new BikeIsTransporting({ bikeId }));
    case "SWAPPING":
      return Option.some(new BikeIsSwapping({ bikeId }));
    case "LOST":
      return Option.some(new BikeIsLost({ bikeId }));
    case "BROKEN":
      return Option.some(new BikeIsBroken({ bikeId }));
    case "FIXED":
      return Option.some(new BikeIsFixed({ bikeId }));
    case "DISABLED":
      return Option.some(new BikeIsDisabled({ bikeId }));
    default:
      return Option.some(new BikeNotAvailable({ bikeId, status }));
  }
}

export function reservationTransitionFailureFromBikeStatus(args: {
  bikeId: string;
  status: BikeStatus;
}): ReservationTransitionBikeStatusFailure {
  const { bikeId, status } = args;

  switch (status) {
    case "PENDING_DISPATCH":
      return new BikeIsPendingDispatch({ bikeId });
    case "TRANSPORTING":
      return new BikeIsTransporting({ bikeId });
    case "SWAPPING":
      return new BikeIsSwapping({ bikeId });
    case "LOST":
      return new BikeIsLost({ bikeId });
    case "BROKEN":
      return new BikeIsBroken({ bikeId });
    case "FIXED":
      return new BikeIsFixed({ bikeId });
    case "DISABLED":
      return new BikeIsDisabled({ bikeId });
    default:
      return new BikeNotAvailable({ bikeId, status });
  }
}
