import { checkSchema } from "express-validator"
import HTTP_STATUS from "~/constants/http-status"
import { RESERVATIONS_MESSAGE } from "~/constants/messages"
import { ErrorWithStatus } from "~/models/errors"
import databaseService from "~/services/database.services"
import { toObjectId } from "~/utils/string"
import { validate } from "~/utils/validation"
import { isAvailability } from "./bikes.middlewares"
import { BikeStatus } from "~/constants/enums"

export const reserveBikeValidator = validate(
  checkSchema(
    {
      bike_id: {
        notEmpty: {
          errorMessage: RESERVATIONS_MESSAGE.REQUIRED_BIKE_ID,
          bail: true
        },
        isMongoId: {
          errorMessage: RESERVATIONS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'bike_id'),
          bail: true
        },
        custom: {
          options: async (value, { req }) => {
            const bikeId = toObjectId(value)
            const bike = await databaseService.bikes.findOne({ _id: bikeId })
            if (!bike) {
              throw new ErrorWithStatus({
                message: RESERVATIONS_MESSAGE.BIKE_NOT_FOUND.replace('%s', value),
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            isAvailability(bike.status as BikeStatus)

            const stationId = bike.station_id
            if (!stationId) {
              throw new ErrorWithStatus({
                message: RESERVATIONS_MESSAGE.UNAVAILABLE_BIKE,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const station = await databaseService.stations.findOne({ _id: stationId })
            if (!station) {
              throw new ErrorWithStatus({
                message: RESERVATIONS_MESSAGE.STATION_NOT_FOUND.replace('%s', stationId.toString()),
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            req.bike = bike
            return true
          }
        }
      },
      start_time: {
        notEmpty: {
            errorMessage: RESERVATIONS_MESSAGE.REQUIRED_START_TIME
        },
        isISO8601: {
            errorMessage: RESERVATIONS_MESSAGE.INVALID_START_TIME_FORMAT
        }
      }
    },
    ['body']
  )
)