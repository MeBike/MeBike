import { checkSchema } from "express-validator";
import { ObjectId } from "mongodb";

import { BikeStatus } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { BIKES_MESSAGES } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import databaseService from "~/services/database.services";
import { validate } from "~/utils/validation";

const statusErrors: any = {
  [BikeStatus.Booked]: BIKES_MESSAGES.BIKE_IN_USE,
  [BikeStatus.Broken]: BIKES_MESSAGES.BIKE_IS_BROKEN,
  [BikeStatus.Maintained]: BIKES_MESSAGES.BIKE_IS_MAINTAINED,
  [BikeStatus.Reserved]: BIKES_MESSAGES.BIKE_IS_RESERVED,
  [BikeStatus.Unavailable]: BIKES_MESSAGES.UNAVAILABLE_BIKE
};

export const createBikeValidator = validate(
  checkSchema(
    {
      station_id: {
        notEmpty: { errorMessage: BIKES_MESSAGES.STATION_ID_IS_REQUIRED },
        isString: { errorMessage: BIKES_MESSAGES.INVALID_STATION_ID },
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: BIKES_MESSAGES.INVALID_STATION_ID,
                status: HTTP_STATUS.BAD_REQUEST,
              });
            }
            const station = await databaseService.stations.findOne({ _id: new ObjectId(value) });
            if (!station) {
              throw new ErrorWithStatus({
                message: BIKES_MESSAGES.STATION_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
              });
            }
            return true;
          },
        },
      },
      status: {
        optional: true,
        isIn: {
          options: [Object.values(BikeStatus)],
          errorMessage: BIKES_MESSAGES.INVALID_STATUS,
        },
      },
      supplier_id: {
        optional: true,
        custom: {
          options: async (value) => {
            if (value) { // Chỉ kiểm tra nếu supplier_id được cung cấp
              if (!ObjectId.isValid(value)) {
                throw new ErrorWithStatus({
                  message: BIKES_MESSAGES.INVALID_SUPPLIER_ID,
                  status: HTTP_STATUS.BAD_REQUEST,
                });
              }
              // Kiểm tra xem supplier có tồn tại trong database không
              const supplier = await databaseService.suppliers.findOne({ _id: new ObjectId(value) });
              if (!supplier) {
                throw new ErrorWithStatus({
                  message: BIKES_MESSAGES.SUPPLIER_NOT_FOUND,
                  status: HTTP_STATUS.NOT_FOUND,
                });
              }
            }
            return true;
          },
        },
      },
    },
    ["body"],
  ),
);

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
    message: BIKES_MESSAGES.INVALID_STATUS,
    status: HTTP_STATUS.BAD_REQUEST
  });
};
