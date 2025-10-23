import { ReservationStatus, Role } from './../constants/enums'
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
import { getLocalTime } from '~/utils/date'
import { DispatchBikeReqBody } from '~/models/requests/reservations.requests'

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

            const preReservingThreshold = process.env.RESERVE_QUOTA_PERCENT || '0.50'
            const RESERVE_QUOTA_PERCENT = Number.parseFloat(preReservingThreshold)

            const aggResult = await databaseService.bikes
              .aggregate([
                { $match: { station_id: stationId, status: { $in: [BikeStatus.Available, BikeStatus.Reserved] } } },
                {
                  $group: {
                    _id: null,
                    totalAvailableBikes: { $sum: 1 },
                    currentlyReservedBikes: {
                      $sum: { $cond: [{ $eq: ['$status', BikeStatus.Reserved] }, 1, 0] }
                    }
                  }
                }
              ])
              .toArray()

            const { totalAvailableBikes = 0, currentlyReservedBikes = 0 } = aggResult[0] || {}

            const maxAllowedReserved = Math.floor(totalAvailableBikes * RESERVE_QUOTA_PERCENT)

            if (currentlyReservedBikes >= maxAllowedReserved) {
              throw new ErrorWithStatus({
                message: RESERVATIONS_MESSAGE.QUOTA_EXCEEDED,
                status: HTTP_STATUS.BAD_REQUEST
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
        },
        custom: {
          options: (value) => {
            const now = getLocalTime()
            if (new Date(value) < now) {
              throw new ErrorWithStatus({
                message: RESERVATIONS_MESSAGE.INVALID_START_TIME,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            return true
          }
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

          if (reservation.status !== ReservationStatus.Pending) {
            throw new ErrorWithStatus({
              message: RESERVATIONS_MESSAGE.CANNOT_CANCEL_THIS_RESERVATION,
              status: HTTP_STATUS.BAD_REQUEST
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
        errorMessage: RESERVATIONS_MESSAGE.INVALID_REASON
      },
      isLength: {
        options: { min: 5, max: 255 },
        errorMessage: RESERVATIONS_MESSAGE.INVALID_REASON_LENGTH
      }
    }
  })
)

const checkReservationState = async (reservationId: string, req: any) => {
  const reservation = await databaseService.reservations.findOne({ _id: toObjectId(reservationId) })

  if (!reservation) {
    throw new ErrorWithStatus({
      message: RESERVATIONS_MESSAGE.NOT_FOUND.replace('%s', reservationId),
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  if (reservation.status !== ReservationStatus.Pending) {
    throw new ErrorWithStatus({
      message: RESERVATIONS_MESSAGE.CANNOT_CONFIRM_THIS_RESERVATION,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }

  const now = getLocalTime()

  if (reservation.start_time > now) {
    throw new ErrorWithStatus({
      message: RESERVATIONS_MESSAGE.NOT_AVAILABLE_FOR_CONFIRMATION,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }

  if (reservation.end_time && reservation.end_time < now) {
    throw new ErrorWithStatus({
      message: RESERVATIONS_MESSAGE.CANNOT_CONFIRM_EXPIRED_RESERVATION,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }

  req.reservation = reservation
  return true
}

export const userConfirmReservationValidator = validate(
  checkSchema({
    id: {
      in: ['params'],
      notEmpty: { errorMessage: RESERVATIONS_MESSAGE.REQUIRED_ID },
      isMongoId: { errorMessage: RESERVATIONS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'Id') },
      custom: {
        options: (value, { req }) => checkReservationState(value, req)
      }
    }
  })
)

export const staffConfirmReservationValidator = validate(
  checkSchema({
    id: {
      in: ['params'],
      notEmpty: { errorMessage: RESERVATIONS_MESSAGE.REQUIRED_ID },
      isMongoId: { errorMessage: RESERVATIONS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'Id') },
      custom: {
        options: (value, { req }) => checkReservationState(value, req)
      }
    },
    reason: {
      in: ['body'],
      notEmpty: { errorMessage: RESERVATIONS_MESSAGE.REQUIRED_CONFIRM_REASON },
      isString: { errorMessage: RESERVATIONS_MESSAGE.INVALID_REASON },
      trim: true,
      isLength: {
        options: { min: 5, max: 255 },
        errorMessage: RESERVATIONS_MESSAGE.INVALID_REASON_LENGTH
      }
    }
  })
)

export const batchDispatchSameStationValidator = validate(
  checkSchema(
    {
      source_station_id: {
        notEmpty: {
          errorMessage: RESERVATIONS_MESSAGE.REQUIRED_SOURCE_STATION_ID
        },
        isMongoId: { errorMessage: RESERVATIONS_MESSAGE.INVALID_SOURCE_STATION_ID, bail: true },
        custom: {
          options: async (value) => {
            const station = await databaseService.stations.findOne({ _id: toObjectId(value) })
            if (!station) {
              throw new ErrorWithStatus({
                message: RESERVATIONS_MESSAGE.SOURCE_STATION_NOT_FOUND.replace('%s', value),
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        }
      },
      destination_station_id: {
        notEmpty: {
          errorMessage: RESERVATIONS_MESSAGE.REQUIRED_DESTINATION_STATION_ID
        },
        isMongoId: { errorMessage: RESERVATIONS_MESSAGE.INVALID_DESTINATION_STATION_ID, bail: true },
        custom: {
          options: async (value, { req }) => {
            const destId = toObjectId(value)
            const sourceId = toObjectId((req.body as DispatchBikeReqBody).source_station_id)

            if (destId.equals(sourceId)) {
              throw new ErrorWithStatus({
                message: RESERVATIONS_MESSAGE.DESTINATION_SAME_AS_SOURCE,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const station = await databaseService.stations.findOne({ _id: destId })
            if (!station) {
              throw new ErrorWithStatus({
                message: RESERVATIONS_MESSAGE.DESTINATION_STATION_NOT_FOUND.replace('%s', value),
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        }
      },
      bike_ids_to_move: {
        isArray: { errorMessage: RESERVATIONS_MESSAGE.INVALID_BIKE_LIST, options: { min: 1 }, bail: true },
        custom: {
          options: async (bikeIds: string[], { req }) => {
            const sourceId = toObjectId((req.body as DispatchBikeReqBody).source_station_id)
            const bikeObjectIds = bikeIds.map((id) => toObjectId(id))

            const bikes = await databaseService.bikes
              .find(
                {
                  _id: { $in: bikeObjectIds }
                },
                {
                  projection: { status: 1, station_id: 1 }
                }
              )
              .toArray()

            const foundBikeIdStrings = new Set(bikes.map((bike) => bike._id.toString()))
            const missingBikeId = bikeIds.find((id) => !foundBikeIdStrings.has(id))

            if (missingBikeId) {
              throw new ErrorWithStatus({
                message: RESERVATIONS_MESSAGE.BIKE_NOT_FOUND.replace('%s', missingBikeId),
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            const errors: string[] = []
            bikes.forEach((bike) => {
              if (bike.status !== BikeStatus.Available) {
                errors.push(
                  RESERVATIONS_MESSAGE.BIKE_NOT_AVAILABLE_FOR_DISPATCH.replace('%s', bike._id.toString()).replace(
                    '%s',
                    bike.status
                  )
                )
              }
              if (!bike.station_id || !bike.station_id.equals(sourceId)) {
                errors.push(RESERVATIONS_MESSAGE.BIKE_NOT_AT_SOURCE_STATION.replace('%s', bike._id.toString()))
              }
            })

            if (errors.length > 0) {
              throw new ErrorWithStatus({
                message: errors.join('; '),
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            ;(req as any).dispatch_bike_ids = bikeObjectIds
            ;(req as any).dispatched_bikes = bikes
            return true
          }
        }
      }
    },
    ['body']
  )
)
