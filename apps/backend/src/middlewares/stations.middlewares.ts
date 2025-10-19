import { checkSchema } from "express-validator";
import { ObjectId } from "mongodb";
import { validate } from "~/utils/validation";
import databaseService from "~/services/database.services";
import { ErrorWithStatus } from "~/models/errors";
import HTTP_STATUS from "~/constants/http-status";
import { STATIONS_MESSAGE } from "~/constants/messages";

export const stationIdValidator = validate(
  checkSchema(
    {
      _id: {
        in: ["params"],
        trim: true,
        notEmpty: {
          errorMessage: STATIONS_MESSAGE.STATION_ID_IS_REQUIRED,
        },
        isMongoId: {
          errorMessage: STATIONS_MESSAGE.INVALID_STATION_ID,
        },
        custom: {
          options: async (value: string) => {
            const station = await databaseService.stations.findOne({
              _id: new ObjectId(value),
            });
            if (!station) {
              throw new ErrorWithStatus({
                message: STATIONS_MESSAGE.STATION_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
              });
            }
            return true;
          },
        },
      },
    },
    ["params"]
  )
);

export const createStationValidator = validate(
  checkSchema(
    {
      name: {
        in: ["body"],
        trim: true,
        notEmpty: { errorMessage: STATIONS_MESSAGE.STATION_NAME_IS_REQUIRED },
        isString: { errorMessage: STATIONS_MESSAGE.STATION_NAME_MUST_BE_STRING },
        isLength: {
          options: { min: 3, max: 100 },
          errorMessage: STATIONS_MESSAGE.STATION_NAME_LENGTH_MUST_BE_FROM_3_TO_100,
        },
        custom: {
          options: async (value: string) => {
            const existingStation = await databaseService.stations.findOne({ name: value });
            if (existingStation) {
              throw new ErrorWithStatus({
                message: STATIONS_MESSAGE.STATION_NAME_ALREADY_EXISTS,
                status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
              });
            }
            return true;
          },
        },
      },
      address: {
        in: ["body"],
        trim: true,
        notEmpty: { errorMessage: STATIONS_MESSAGE.ADDRESS_IS_REQUIRED },
        isString: { errorMessage: STATIONS_MESSAGE.ADDRESS_MUST_BE_STRING },
        isLength: {
          options: { min: 10, max: 255 },
          errorMessage: STATIONS_MESSAGE.ADDRESS_LENGTH_MUST_BE_FROM_10_TO_255,
        },
      },
      latitude: {
        in: ["body"],
        trim: true,
        notEmpty: { errorMessage: STATIONS_MESSAGE.LATITUDE_IS_REQUIRED },
        isString: { errorMessage: STATIONS_MESSAGE.LATITUDE_MUST_BE_STRING },
        isNumeric: {
          errorMessage: STATIONS_MESSAGE.LATITUDE_MUST_BE_NUMERIC,
        }
      },
      longitude: {
        in: ["body"],
        trim: true,
        notEmpty: { errorMessage: STATIONS_MESSAGE.LONGITUDE_IS_REQUIRED },
        isString: { errorMessage: STATIONS_MESSAGE.LONGITUDE_MUST_BE_STRING },
        isNumeric: {
          errorMessage: STATIONS_MESSAGE.LONGITUDE_MUST_BE_NUMERIC,
        }
      },
      capacity: {
        in: ["body"],
        trim: true,
        notEmpty: { errorMessage: STATIONS_MESSAGE.CAPACITY_IS_REQUIRED },
        isString: { errorMessage: STATIONS_MESSAGE.CAPACITY_MUST_BE_STRING },
        custom: {
          options: (value: string) => {
            if (!/^\d+$/.test(value)) {
              throw new Error(STATIONS_MESSAGE.CAPACITY_MUST_BE_NON_NEGATIVE_INTEGER);
            }
            const numValue = parseInt(value, 10);
             if (numValue < 0) {
               throw new Error(STATIONS_MESSAGE.CAPACITY_CANNOT_BE_NEGATIVE);
             }
            if (numValue > 1000) {
                throw new Error(STATIONS_MESSAGE.CAPACITY_CANNOT_EXCEED_1000);
            }
            return true;
          },
        },
      },
    },
    ["body"]
  )
);

export const updateStationValidator = validate(
  checkSchema(
    {
      name: {
        in: ["body"],
        optional: true,
        trim: true,
        isString: { errorMessage: STATIONS_MESSAGE.STATION_NAME_MUST_BE_STRING },
        isLength: {
          options: { min: 3, max: 100 },
          errorMessage: STATIONS_MESSAGE.STATION_NAME_LENGTH_MUST_BE_FROM_3_TO_100,
        },
        custom: {
          options: async (value: string, { req }) => {
            if (value) {
              const stationIdBeingUpdated = req.params?._id;
              if (!stationIdBeingUpdated || !ObjectId.isValid(stationIdBeingUpdated)) {
                 return true;
              }
              const existingStation = await databaseService.stations.findOne({
                name: value,
                _id: { $ne: new ObjectId(stationIdBeingUpdated) }
              });
              if (existingStation) {
                throw new ErrorWithStatus({
                  message: STATIONS_MESSAGE.STATION_NAME_ALREADY_EXISTS,
                  status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
                });
              }
            }
            return true;
          },
        },
      },
      address: {
        in: ["body"],
        optional: true,
        trim: true,
        isString: { errorMessage: STATIONS_MESSAGE.ADDRESS_MUST_BE_STRING },
        isLength: {
          options: { min: 10, max: 255 },
          errorMessage: STATIONS_MESSAGE.ADDRESS_LENGTH_MUST_BE_FROM_10_TO_255,
        },
      },
      latitude: {
        in: ["body"],
        optional: true,
        trim: true,
        isString: { errorMessage: STATIONS_MESSAGE.LATITUDE_MUST_BE_STRING },
        isNumeric: {
          errorMessage: STATIONS_MESSAGE.LATITUDE_MUST_BE_NUMERIC,
        }
      },
      longitude: {
        in: ["body"],
        optional: true,
        trim: true,
        isString: { errorMessage: STATIONS_MESSAGE.LONGITUDE_MUST_BE_STRING },
        isNumeric: {
          errorMessage: STATIONS_MESSAGE.LONGITUDE_MUST_BE_NUMERIC,
        }
      },
      capacity: {
        in: ["body"],
        optional: true,
        trim: true,
        isString: { errorMessage: STATIONS_MESSAGE.CAPACITY_MUST_BE_STRING },
        custom: {
          options: (value: string) => {
             if (!/^\d+$/.test(value)) {
               throw new Error(STATIONS_MESSAGE.CAPACITY_MUST_BE_NON_NEGATIVE_INTEGER);
             }
             const numValue = parseInt(value, 10);
             if (numValue < 0) {
               throw new Error(STATIONS_MESSAGE.CAPACITY_CANNOT_BE_NEGATIVE);
             }
             if (numValue > 1000) {
                 throw new Error(STATIONS_MESSAGE.CAPACITY_CANNOT_EXCEED_1000);
             }
            return true;
          },
        },
      },
    },
    ["body"]
  )
);