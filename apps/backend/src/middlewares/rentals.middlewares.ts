import { checkSchema } from "express-validator";
import { ObjectId } from "mongodb";

import { BikeStatus, RentalStatus } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { RENTALS_MESSAGE } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import databaseService from "~/services/database.services";
import { validate } from "~/utils/validation";
import { isAvailability } from "./bikes.middlewares";
import { toObjectId } from "~/utils/string";

export const createRentalSessionValidator = validate(
  checkSchema({
    start_station: {
      notEmpty: {
        errorMessage: RENTALS_MESSAGE.REQUIRED_START_STATION,
        bail: true,
      },
      isMongoId: {
        errorMessage: RENTALS_MESSAGE.INVALID_OBJECT_ID.replace("%s", "start_station"),
        bail: true,
      },
    },
    bike_id: {
      notEmpty: {
        errorMessage: RENTALS_MESSAGE.REQUIRED_BIKE_ID,
        bail: true,
      },
      isMongoId: {
        errorMessage: RENTALS_MESSAGE.INVALID_OBJECT_ID.replace("%s", "bike_id"),
        bail: true,
      },
      custom: {
        options: async (value, { req }) => {
          const stationId = toObjectId(req.body.start_station);
          const bikeId = toObjectId(value);

          const station = await databaseService.stations.findOne({ _id: stationId });
          if (!station) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.STATION_NOT_FOUND.replace("%s", req.body.start_station),
              status: HTTP_STATUS.NOT_FOUND,
            });
          }

          const bikeInStation = await databaseService.bikes.findOne({
            _id: bikeId,
            station_id: station._id,
          });

          if (!bikeInStation) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.BIKE_NOT_FOUND_IN_STATION
                .replace("%s", value)
                .replace("%s", station.name),
              status: HTTP_STATUS.NOT_FOUND,
            });
          }

          isAvailability(bikeInStation.status as BikeStatus)

          req.station = station;
          req.bike = bikeInStation;
          return true;
        },
      },
    },
  }, ["body"]),
);

export const endRentalSessionValidator = validate(
  checkSchema({
    id: {
      in: ["params"],
      notEmpty: {
        errorMessage: RENTALS_MESSAGE.REQUIRED_ID,
        bail: true,
      },
      isMongoId: {
        errorMessage: RENTALS_MESSAGE.INVALID_OBJECT_ID.replace("%s", "Rental Id"),
        bail: true,
      },
      custom: {
        options: async (value, { req }) => {
          const currentRental = await databaseService.rentals.findOne({
            _id: new ObjectId(value),
            status: RentalStatus.Rented,
          });

          if (!currentRental) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.NOT_FOUND_RENTED_RENTAL.replace("%s", value),
              status: HTTP_STATUS.NOT_FOUND,
            });
          }

          req.rental = currentRental;
          return true;
        },
        bail: true,
      },
    },
    end_station: {
      in: ["body"],
      notEmpty: {
        errorMessage: RENTALS_MESSAGE.REQUIRED_END_STATION,
        bail: true,
      },
      isMongoId: {
        errorMessage: RENTALS_MESSAGE.INVALID_OBJECT_ID.replace("%s", "end_station"),
        bail: true,
      },
      custom: {
        options: async (value) => {
          const station = await databaseService.stations.findOne({ _id: new ObjectId(value) });
          if (!station) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.STATION_NOT_FOUND.replace("%s", value),
              status: HTTP_STATUS.NOT_FOUND,
            });
          }
          return true;
        },
      },
    },
  }),
);
