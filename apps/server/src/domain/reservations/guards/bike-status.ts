import { Option } from "effect";

import type { BikeStatus } from "generated/prisma/enums";

import {
  BikeAlreadyReserved,
  BikeIsDisabled,
  BikeIsLost,
  BikeIsRedistributing,
  BikeNotAvailable,
} from "../domain-errors";

type ReservationBikeStatusFailure
  = | BikeAlreadyReserved
    | BikeIsRedistributing
    | BikeIsLost
    | BikeIsDisabled
    | BikeNotAvailable;

type ReservationTransitionBikeStatusFailure
  = | BikeIsRedistributing
    | BikeIsLost
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
    case "REDISTRIBUTING":
      return Option.some(new BikeIsRedistributing({ bikeId }));
    case "LOST":
      return Option.some(new BikeIsLost({ bikeId }));
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
    case "REDISTRIBUTING":
      return new BikeIsRedistributing({ bikeId });
    case "LOST":
      return new BikeIsLost({ bikeId });
    case "DISABLED":
      return new BikeIsDisabled({ bikeId });
    default:
      return new BikeNotAvailable({ bikeId, status });
  }
}
