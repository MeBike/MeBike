import { BikeStatus } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { BIKE_MESSAGE } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";

const statusErrors = {
  [BikeStatus.Booked]: BIKE_MESSAGE.BIKE_IN_USE,
  [BikeStatus.Broken]: BIKE_MESSAGE.BIKE_IS_BROKEN,
  [BikeStatus.Maintained]: BIKE_MESSAGE.BIKE_IS_MAINTAINED,
  [BikeStatus.Reserved]: BIKE_MESSAGE.BIKE_IS_RESERVED,
  [BikeStatus.Unavailable]: BIKE_MESSAGE.UNAVAILABLE_BIKE
};

export const isAvailability = (status: BikeStatus) => {
  if (status === BikeStatus.Available) return true;

  const message = statusErrors[status];
  if (message) {
    throw new ErrorWithStatus({
      message,
      status: HTTP_STATUS.BAD_REQUEST
    });
  }

  throw new ErrorWithStatus({
    message: BIKE_MESSAGE.INVALID_STATUS,
    status: HTTP_STATUS.BAD_REQUEST
  });
};
