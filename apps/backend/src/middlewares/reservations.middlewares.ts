import { Decimal128 } from 'mongodb'
import { GroupByOptions, ReservationOptions, ReservationStatus, Role, SubscriptionStatus } from './../constants/enums'
import { checkSchema, ParamSchema } from 'express-validator'
import HTTP_STATUS from '~/constants/http-status'
import { RENTALS_MESSAGE, RESERVATIONS_MESSAGE, WALLETS_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import databaseService from '~/services/database.services'
import { toObjectId } from '~/utils/string'
import { validate } from '~/utils/validation'
import { isAvailability } from './bikes.middlewares'
import { BikeStatus } from '~/constants/enums'
import { TokenPayLoad } from '~/models/requests/users.requests'
import { getLocalTime } from '~/utils/date-time'
import { DispatchBikeReqBody } from '~/models/requests/reservations.requests'
import { NextFunction, Request, Response } from 'express'

const VALID_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export const reserveBikeValidator = validate(
  checkSchema(
    {
      reservation_option: {
        notEmpty: {
          errorMessage: RESERVATIONS_MESSAGE.REQUIRED_OPTIONS
        },
        isIn: {
          options: [[ReservationOptions.ONE_TIME, ReservationOptions.FIXED_SLOT, ReservationOptions.SUBSCRIPTION]],
          errorMessage: RESERVATIONS_MESSAGE.INVALID_OPTIONS
        }
      },

      // Common field for ONE_TIME + SUBSCRIPTION
      bike_id: {
        optional: true,
        custom: {
          options: async (value, { req }) => {
            if ([ReservationOptions.ONE_TIME, ReservationOptions.SUBSCRIPTION].includes(req.body.reservation_option)) {
              if (!value) {
                throw new ErrorWithStatus({
                  message: RESERVATIONS_MESSAGE.REQUIRED_BIKE_ID,
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }

              if (!/^[a-fA-F0-9]{24}$/.test(value)) {
                throw new ErrorWithStatus({
                  message: RESERVATIONS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'bike_id'),
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }

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

              const [stationExists, aggResult] = await Promise.all([
                databaseService.stations.findOne({ _id: stationId }, { projection: { _id: 1, name: 1 } }),
                databaseService.bikes
                  .aggregate([
                    {
                      $match: {
                        station_id: stationId,
                        status: { $in: [BikeStatus.Available, BikeStatus.Reserved] }
                      }
                    },
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
              ])

              if (!stationExists) {
                throw new ErrorWithStatus({
                  message: RESERVATIONS_MESSAGE.STATION_NOT_FOUND.replace('%s', stationId.toString()),
                  status: HTTP_STATUS.NOT_FOUND
                })
              }

              const { totalAvailableBikes = 0, currentlyReservedBikes = 0 } = aggResult[0] || {}
              const RESERVE_QUOTA_PERCENT = parseFloat(process.env.RESERVE_QUOTA_PERCENT || '0.50')
              const maxAllowedReserved = Math.floor(totalAvailableBikes * RESERVE_QUOTA_PERCENT)

              if (currentlyReservedBikes >= maxAllowedReserved) {
                throw new ErrorWithStatus({
                  message: RESERVATIONS_MESSAGE.QUOTA_EXCEEDED,
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }

              req.station = stationExists
              req.bike = bike
            }

            return true
          }
        }
      },

      // Common time validation
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
      },

      // FIXED_SLOT-specific
      slot_start: {
        optional: true,
        custom: {
          options: (value, { req }) => {
            if (req.body.reservation_option === ReservationOptions.FIXED_SLOT && !value) {
              throw new ErrorWithStatus({
                message: RESERVATIONS_MESSAGE.FS_REQUIRED_SLOT_START,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            return true
          }
        }
      },
      days_of_week: {
        optional: true,
        custom: {
          options: (value, { req }) => {
            if (req.body.reservation_option === ReservationOptions.FIXED_SLOT) {
              if (!Array.isArray(value) || value.length === 0) {
                throw new ErrorWithStatus({
                  message: RESERVATIONS_MESSAGE.FS_REQUIRED_DAYS_OF_WEEK,
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }
            }
            return true
          }
        }
      },

      // SUBSCRIPTION-specific
      subscription_id: {
        optional: true,
        custom: {
          options: async (value, { req }) => {
            if (req.body.reservation_option === ReservationOptions.SUBSCRIPTION) {
              if (!value) {
                throw new ErrorWithStatus({
                  message: RESERVATIONS_MESSAGE.SUB_REQUIRED_SUBSCRIPTION_ID,
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }

              if (!/^[a-fA-F0-9]{24}$/.test(value)) {
                throw new ErrorWithStatus({
                  message: RESERVATIONS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'subscription_id'),
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }

              const subscription = await databaseService.subscriptions.findOne({
                _id: toObjectId(value),
                status: {
                  $in: [SubscriptionStatus.PENDING, SubscriptionStatus.ACTIVE]
                }
              })
              
              if (!subscription) {
                throw new ErrorWithStatus({
                  message: RESERVATIONS_MESSAGE.SUBSCRIPTION_NOT_FOUND,
                  status: HTTP_STATUS.NOT_FOUND
                })
              }
              req.subscription = subscription
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

const checkReservationBeforeCancel = async (reservationId: string, req: any) => {
  const reservation = await databaseService.reservations.findOne({ _id: toObjectId(reservationId) })

  if (!reservation) {
    throw new ErrorWithStatus({
      message: RESERVATIONS_MESSAGE.NOT_FOUND.replace('%s', reservationId),
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  if (reservation.status !== ReservationStatus.Pending) {
    throw new ErrorWithStatus({
      message: RESERVATIONS_MESSAGE.CANNOT_CANCEL_THIS_RESERVATION,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }

  const now = getLocalTime()
  if (reservation.end_time && reservation.end_time < now) {
    throw new ErrorWithStatus({
      message: RESERVATIONS_MESSAGE.CANNOT_CANCEL_EXPIRED_RESERVATION,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }

  req.reservation = reservation
  return reservation
}

const ReasonValidationSchema = (requiredMessage: string): ParamSchema => ({
  in: ['body'],
  notEmpty: { errorMessage: requiredMessage },
  isString: { errorMessage: RESERVATIONS_MESSAGE.INVALID_REASON },
  isLength: {
    options: { min: 5, max: 255 },
    errorMessage: RESERVATIONS_MESSAGE.INVALID_REASON_LENGTH
  }
})

export const userCancelReservationValidator = validate(
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
          const reservation = await checkReservationBeforeCancel(value, req)

          const { user_id } = req.decoded_authorization as TokenPayLoad

          if (!reservation.user_id.equals(user_id)) {
            throw new ErrorWithStatus({
              message: RESERVATIONS_MESSAGE.CANNOT_CANCEL_OTHER_RESERVATION,
              status: HTTP_STATUS.FORBIDDEN
            })
          }

          return true
        }
      }
    },
    reason: ReasonValidationSchema(RESERVATIONS_MESSAGE.REQUIRED_CANCELLED_REASON)
  })
)

export const staffCancelReservationValidator = validate(
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
          await checkReservationBeforeCancel(value, req)
          return true
        }
      }
    },
    reason: ReasonValidationSchema(RESERVATIONS_MESSAGE.REQUIRED_CANCELLED_REASON)
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
    reason: ReasonValidationSchema(RESERVATIONS_MESSAGE.REQUIRED_CONFIRM_REASON)
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

export const filterByDateValidator = (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate, groupBy } = req.query

  const errors: string[] = []

  const validGroupByValues = Object.values(GroupByOptions)
  const normalizedGroupBy = (groupBy as string)?.toUpperCase()

  if (groupBy && !validGroupByValues.includes(normalizedGroupBy as GroupByOptions)) {
    errors.push(RESERVATIONS_MESSAGE.INVALID_GROUP_BY.replace('%s', validGroupByValues.join(', ')))
  }

  if (startDate && typeof startDate === 'string') {
    if (!VALID_DATE_REGEX.test(startDate)) {
      errors.push(RESERVATIONS_MESSAGE.INVALID_START_DATE_FORMAT)
    } else {
      const date = new Date(startDate)
      if (isNaN(date.getTime())) {
        errors.push(RESERVATIONS_MESSAGE.INVALID_START_DATE.replace('%s', startDate))
      }
    }
  }

  if (endDate && typeof endDate === 'string') {
    if (!VALID_DATE_REGEX.test(endDate)) {
      errors.push(RESERVATIONS_MESSAGE.INVALID_END_DATE_FORMAT)
    } else {
      const date = new Date(endDate)
      if (isNaN(date.getTime())) {
        errors.push(RESERVATIONS_MESSAGE.INVALID_END_DATE.replace('%s', endDate))
      }
    }
  }

  if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (start > end) {
      errors.push(RESERVATIONS_MESSAGE.START_DATE_AFTER_END_DATE)
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: RESERVATIONS_MESSAGE.INVALID_INPUT,
      errors
    })
  }

  if (groupBy) {
    req.query.groupBy = normalizedGroupBy
  } else {
    req.query.groupBy = GroupByOptions.Date
  }

  next()
}

export const getReservationDetailValidator = validate(
  checkSchema({
    id: {
      in: ['params'],
      notEmpty: { errorMessage: RESERVATIONS_MESSAGE.REQUIRED_ID },
      isMongoId: { errorMessage: RESERVATIONS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'Id') },
      custom: {
        options: async (value, { req }) => {
          const { user_id } = req.decoded_authorization as TokenPayLoad
          const user = await databaseService.users.findOne({ _id: toObjectId(user_id) })
          if (!user) {
            throw new ErrorWithStatus({
              message: RESERVATIONS_MESSAGE.USER_NOT_FOUND.replace('%s', user_id),
              status: HTTP_STATUS.NOT_FOUND
            })
          }

          const reservation = await databaseService.reservations.findOne({ _id: toObjectId(value) })
          if (!reservation) {
            throw new ErrorWithStatus({
              message: RESERVATIONS_MESSAGE.NOT_FOUND.replace('%s', value),
              status: HTTP_STATUS.NOT_FOUND
            })
          }

          if (user.role === Role.User && !reservation.user_id.equals(user_id)) {
            throw new ErrorWithStatus({
              message: RESERVATIONS_MESSAGE.CANNOT_VIEW_OTHER_RESERVATION,
              status: HTTP_STATUS.FORBIDDEN
            })
          }
          return true
        }
      }
    }
  })
)

export const checkUserWalletBeforeReserve = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayLoad
    const option = req.body.reservation_option as ReservationOptions

    if (option !== ReservationOptions.ONE_TIME) {
      return next()
    }

    const minWalletBalanceToRent = Decimal128.fromString(process.env.MIN_WALLET_BALANCE_TO_RENT || '2000')
    const findWallet = await databaseService.wallets.findOne({ user_id: toObjectId(user_id) })
    if (!findWallet) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.USER_NOT_HAVE_WALLET.replace('%s', user_id),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const userBalance = BigInt(findWallet.balance.toString())
    const minBalance = BigInt(minWalletBalanceToRent.toString())
    if (userBalance < minBalance) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.NOT_ENOUGH_BALANCE_TO_RENT.replace('%s', minWalletBalanceToRent.toString()),
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    next()
  } catch (error) {
    next(error)
  }
}
