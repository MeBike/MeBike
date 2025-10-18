import { checkSchema } from "express-validator";
import { ObjectId } from "mongodb";

import { BikeStatus } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { BIKES_MESSAGES, RENTALS_MESSAGE } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import databaseService from "~/services/database.services";
import { validate } from "~/utils/validation";

const statusErrors: any = {
  [BikeStatus.Booked]: RENTALS_MESSAGE.BIKE_IN_USE,
  [BikeStatus.Broken]: RENTALS_MESSAGE.BIKE_IS_BROKEN,
  [BikeStatus.Maintained]: RENTALS_MESSAGE.BIKE_IS_MAINTAINED,
  [BikeStatus.Reserved]: RENTALS_MESSAGE.BIKE_IS_RESERVED,
  [BikeStatus.Unavailable]: RENTALS_MESSAGE.UNAVAILABLE_BIKE
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
    message: RENTALS_MESSAGE.INVALID_BIKE_STATUS,
    status: HTTP_STATUS.BAD_REQUEST
  });
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
      chip_id: {
        notEmpty: { errorMessage: BIKES_MESSAGES.CHIP_ID_IS_REQUIRED },
        isString: { errorMessage: BIKES_MESSAGES.CHIP_ID_MUST_BE_A_STRING },
        custom: {
          options: async (value) => {
            const existingBike = await databaseService.bikes.findOne({ chip_id: value });
            if (existingBike) {
              throw new ErrorWithStatus({
                message: BIKES_MESSAGES.CHIP_ID_ALREADY_EXISTS,
                status: HTTP_STATUS.BAD_REQUEST,
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

export const bikeIdValidator = validate(
  checkSchema(
    {
      _id: {
        in: ["params"],
        notEmpty: {
          errorMessage: BIKES_MESSAGES.BIKE_ID_IS_REQUIRED,
        },
        isMongoId: {
          errorMessage: BIKES_MESSAGES.INVALID_BIKE_ID,
        },
        custom: {
          options: async (value) => {
            const bike = await databaseService.bikes.findOne({ _id: new ObjectId(value) });
            if (!bike) {
              throw new ErrorWithStatus({
                message: BIKES_MESSAGES.BIKE_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
              });
            }
            return true;
          },
        },
      },
    },
    ["params"],
  )
);

export const updateBikeValidator = validate(
  checkSchema(
    {
      chip_id: { 
        notEmpty: { errorMessage: BIKES_MESSAGES.CHIP_ID_IS_REQUIRED }, 
        isString: { errorMessage: BIKES_MESSAGES.CHIP_ID_MUST_BE_A_STRING }, 
        custom: { 
          options: async (value, { req }) => { 
            const bikeId = req.params?._id; 
            // Kiểm tra xem có xe nào khác đang dùng chip_id này không
            const existingBike = await databaseService.bikes.findOne({ 
              chip_id: value, 
              _id: { $ne: new ObjectId(bikeId) },
            }); 
            if (existingBike) { 
              throw new ErrorWithStatus({ 
                message: BIKES_MESSAGES.CHIP_ID_ALREADY_EXISTS_ON_ANOTHER_BIKE, 
                status: HTTP_STATUS.BAD_REQUEST, 
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
      station_id: {
        optional: true,
        isMongoId: {
          errorMessage: BIKES_MESSAGES.INVALID_STATION_ID,
        },
        custom: {
          options: async (value) => {
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
      supplier_id: {
        optional: true,
        isMongoId: {
          errorMessage: BIKES_MESSAGES.INVALID_SUPPLIER_ID,
        },
        custom: {
          options: async (value) => {
            const supplier = await databaseService.suppliers.findOne({ _id: new ObjectId(value) });
            if (!supplier) {
              throw new ErrorWithStatus({
                message: BIKES_MESSAGES.SUPPLIER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
              });
            }
            return true;
          },
        },
      },
    },
    ["body"],
  )
);
