import { Role } from './../constants/enums'
import { checkSchema } from 'express-validator'
import HTTP_STATUS from '~/constants/http-status'
import { RESERVATIONS_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import databaseService from '~/services/database.services'
import { toObjectId } from '~/utils/string'
import { validate } from '~/utils/validation'
import { isAvailability } from './bikes.middlewares'
import { BikeStatus } from '~/constants/enums'
import { TokenPayLoad } from '~/models/requests/users.requests'

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

export const cancelReservationValidator = validate(
  checkSchema({
    id: {
      in: ['params'],
      notEmpty: {
        errorMessage: RESERVATIONS_MESSAGE.REQUIRED_ID
      },
      isMongoId: {
        errorMessage: RESERVATIONS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'Id')
      },
      custom: {
        options: async (value, { req }) => {
          const reservation = await databaseService.reservations.findOne({ _id: toObjectId(value) })
          if (!reservation) {
            throw new ErrorWithStatus({
              message: RESERVATIONS_MESSAGE.NOT_FOUND.replace('%s', value),
              status: HTTP_STATUS.NOT_FOUND
            })
          }
          const { user_id } = req.decoded_authorization as TokenPayLoad
          const user = await databaseService.users.findOne({ _id: toObjectId(user_id) })
          if (!user) {
            throw new ErrorWithStatus({
              message: RESERVATIONS_MESSAGE.USER_NOT_FOUND.replace('%s', user_id),
              status: HTTP_STATUS.NOT_FOUND
            })
          }

          if (user.role === Role.User && reservation.user_id.toString().localeCompare(user_id) !== 0) {
            throw new ErrorWithStatus({
              message: RESERVATIONS_MESSAGE.CANNOT_CANCEL_OTHER_RESERVATION,
              status: HTTP_STATUS.FORBIDDEN
            })
          }

          req.reservation = reservation
          return true
        }
      }
    },
    reason: {
      notEmpty: {
        errorMessage: RESERVATIONS_MESSAGE.REQUIRED_CANCELLED_REASON
      },
      isString: {
        errorMessage: RESERVATIONS_MESSAGE.INVALID_CANCELLED_REASON
      },
      isLength: {
        options: { max: 255 },
        errorMessage: RESERVATIONS_MESSAGE.REASON_TOO_LONG
      }
    }
  })
)
