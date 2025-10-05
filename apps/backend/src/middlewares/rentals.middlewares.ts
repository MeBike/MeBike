import { checkSchema } from "express-validator";
import { ObjectId } from "mongodb";

import { BikeStatus, RentalStatus } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { RENTALS_MESSAGE } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import databaseService from "~/services/database.services";
import { validate } from "~/utils/validation";

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
          const station = await databaseService.stations.findOne({ _id: new ObjectId(req.body.start_station) });
          if (!station) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.STATION_NOT_FOUND.replace("%s", req.body.start_station),
              status: HTTP_STATUS.NOT_FOUND,
            });
          }

          const bikeInStation = await databaseService.bikes.findOne({
            _id: new ObjectId(value),
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

          if (bikeInStation.status !== BikeStatus.Available) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.NOT_AVAILABLE_BIKE,
              status: HTTP_STATUS.BAD_REQUEST,
            });
          }

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
            status: RentalStatus.Ongoing,
          });

          if (!currentRental) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.NOT_FOUND_ONGOING_RENTAL.replace("%s", value),
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
