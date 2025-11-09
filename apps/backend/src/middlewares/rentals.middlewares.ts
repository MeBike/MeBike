import { checkSchema } from 'express-validator'

import { BikeStatus, RentalStatus, ReservationOptions } from '~/constants/enums'
import HTTP_STATUS from '~/constants/http-status'
import { RENTALS_MESSAGE, WALLETS_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'
import { isAvailability } from './bikes.middlewares'
import { toObjectId } from '~/utils/string'
import { NextFunction, Request, Response } from 'express'
import { TokenPayLoad } from '~/models/requests/users.requests'
import { Decimal128 } from 'mongodb'

const createRentalValidator = (includeUserIdField = false) => {
  const baseSchema: any = {
    bike_id: {
      in: ['body'],
      notEmpty: {
        errorMessage: RENTALS_MESSAGE.REQUIRED_BIKE_ID,
        bail: true
      },
      isMongoId: {
        errorMessage: RENTALS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'bike_id'),
        bail: true
      },
      custom: {
        options: async (value: string, { req }:{req: Request}) => {
          const bikeId = toObjectId(value)
          const bike = await databaseService.bikes.findOne({ _id: bikeId })
          if (!bike) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.BIKE_NOT_FOUND.replace('%s', value),
              status: HTTP_STATUS.NOT_FOUND
            })
          }
          isAvailability(bike.status as BikeStatus)

          const stationId = bike.station_id
          if (!stationId) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.UNAVAILABLE_BIKE,
              status: HTTP_STATUS.BAD_REQUEST
            })
          }
          const station = await databaseService.stations.findOne({ _id: stationId })
          if (!station) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.STATION_NOT_FOUND.replace('%s', stationId.toString()),
              status: HTTP_STATUS.NOT_FOUND
            })
          }

          req.station = station
          req.bike = bike
          return true
        }
      }
    }
  }

  if(includeUserIdField){
    baseSchema.user_id = {
      in: ['body'],
      notEmpty: {
        errorMessage: RENTALS_MESSAGE.REQUIRED_USER_ID,
        bail: true
      },
      isMongoId: {
        errorMessage: RENTALS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'user_id'),
        bail: true
      },
      custom: {
        options: async(value: string, {req}:{req: Request}) => {
          const user = await databaseService.users.findOne({_id: toObjectId(value)})
          if(!user){
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.USER_NOT_FOUND.replace("%s", value),
              status: HTTP_STATUS.NOT_FOUND
            })
          }

          req.user = user
          return true
        }
      }
    }
  }

  return validate(checkSchema(baseSchema, ['body']))
}

export const createRentalSessionValidator = createRentalValidator(false)

export const createRentalSessionByStaffValidator = createRentalValidator(true)

export const endRentalSessionValidator = validate(
  checkSchema({
    id: {
      in: ['params'],
      notEmpty: {
        errorMessage: RENTALS_MESSAGE.REQUIRED_ID,
        bail: true
      },
      isMongoId: {
        errorMessage: RENTALS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'Rental Id'),
        bail: true
      },
      custom: {
        options: async (value, { req }) => {
          const currentRental = await databaseService.rentals.findOne({
            _id: toObjectId(value),
            status: RentalStatus.Rented
          })

          if (!currentRental) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.NOT_FOUND_RENTED_RENTAL.replace('%s', value),
              status: HTTP_STATUS.NOT_FOUND
            })
          }

          req.rental = currentRental
          return true
        },
        bail: true
      }
    }
  })
)

export const endRentalByAdminOrStaffValidator = validate(
  checkSchema({
    id: {
      in: ['params'],
      notEmpty: {
        errorMessage: RENTALS_MESSAGE.REQUIRED_ID,
        bail: true
      },
      isMongoId: {
        errorMessage: RENTALS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'Rental Id'),
        bail: true
      },
      custom: {
        options: async (value, { req }) => {
          const currentRental = await databaseService.rentals.findOne({
            _id: toObjectId(value),
            status: RentalStatus.Rented
          })

          if (!currentRental) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.NOT_FOUND_RENTED_RENTAL.replace('%s', value),
              status: HTTP_STATUS.NOT_FOUND
            })
          }

          req.rental = currentRental
          return true
        },
        bail: true
      }
    },
    end_station: {
      in: ['body'],
      notEmpty: {
        errorMessage: RENTALS_MESSAGE.REQUIRED_END_STATION
      },
      isMongoId: {
        errorMessage: RENTALS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'end_station'),
        bail: true
      },
      custom: {
        options: async (value, { req }) => {
          const station = await databaseService.stations.findOne({ _id: toObjectId(value) })
          if (!station) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.STATION_NOT_FOUND.replace('%s', value),
              status: HTTP_STATUS.NOT_FOUND
            })
          }
          req.station = station
          return true
        }
      }
    },

    end_time: {
      in: ['body'],
      optional: true,
      isISO8601: {
        errorMessage: RENTALS_MESSAGE.INVALID_END_TIME_FORMAT
      }
    },
    reason: {
      in: ['body'],
      notEmpty: {
        errorMessage: RENTALS_MESSAGE.REQUIRED_UPDATED_REASON
      },
      isString: {
        errorMessage: RENTALS_MESSAGE.INVALID_REASON
      },
      isLength: {
        options: { max: 255 },
        errorMessage: RENTALS_MESSAGE.REASON_TOO_LONG
      }
    }
  })
)

export const updateDetailRentalValidator = validate(
  checkSchema(
    {
      id: {
        in: ['params'],
        notEmpty: {
          errorMessage: RENTALS_MESSAGE.REQUIRED_ID,
          bail: true
        },
        isMongoId: {
          errorMessage: RENTALS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'rental_id'),
          bail: true
        },
        custom: {
          options: async (value, { req }) => {
            const rental = await databaseService.rentals.findOne({ _id: toObjectId(value) })
            if (!rental) {
              throw new ErrorWithStatus({
                message: RENTALS_MESSAGE.NOT_FOUND.replace('%s', value),
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            if (rental.status === RentalStatus.Cancelled) {
              throw new ErrorWithStatus({
                message: RENTALS_MESSAGE.CANNOT_EDIT_THIS_RENTAL_WITH_STATUS.replace('%s', rental.status),
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            req.rental = rental
            return true
          }
        }
      },

      end_station: {
        in: ['body'],
        optional: true,
        isMongoId: {
          errorMessage: RENTALS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'end_station'),
          bail: true
        },
        custom: {
          options: async (value, { req }) => {
            const station = await databaseService.stations.findOne({ _id: toObjectId(value) })
            if (!station) {
              throw new ErrorWithStatus({
                message: RENTALS_MESSAGE.STATION_NOT_FOUND.replace('%s', value),
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            req.station = station
            return true
          }
        }
      },

      end_time: {
        in: ['body'],
        optional: true,
        isISO8601: {
          errorMessage: RENTALS_MESSAGE.INVALID_END_TIME_FORMAT
        }
      },

      status: {
        in: ['body'],
        optional: true,
        isIn: {
          options: Object.values(RentalStatus),
          errorMessage: RENTALS_MESSAGE.INVALID_STATUS
        }
      },

      total_price: {
        in: ['body'],
        optional: true,
        isFloat: {
          options: { min: 0 },
          errorMessage: RENTALS_MESSAGE.INVALID_TOTAL_PRICE
        }
      },

      reason: {
        in: ['body'],
        notEmpty: {
          errorMessage: RENTALS_MESSAGE.REQUIRED_UPDATED_REASON
        },
        isString: {
          errorMessage: RENTALS_MESSAGE.INVALID_REASON
        },
        isLength: {
          options: { max: 255 },
          errorMessage: RENTALS_MESSAGE.REASON_TOO_LONG
        },
        custom: {
          options: (value, { req }) => {
            const { end_station, end_time, status, total_price } = req.body
            if (
              end_station === undefined &&
              end_time === undefined &&
              status === undefined &&
              total_price === undefined
            ) {
              throw new ErrorWithStatus({
                message: RENTALS_MESSAGE.PROVIDE_AT_LEAST_ONE_UPDATED_FIELD_BESIDES_REASON,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            return true
          }
        }
      }
    },
    ['body', 'params']
  )
)

export const cancelRentalValidator = validate(
  checkSchema(
    {
      id: {
        in: ['params'],
        notEmpty: {
          errorMessage: RENTALS_MESSAGE.REQUIRED_ID,
          bail: true
        },
        isMongoId: {
          errorMessage: RENTALS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'rental_id'),
          bail: true
        },
        custom: {
          options: async (value, { req }) => {
            const rental = await databaseService.rentals.findOne({ _id: toObjectId(value) })
            if (!rental) {
              throw new ErrorWithStatus({
                message: RENTALS_MESSAGE.NOT_FOUND.replace('%s', value),
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            if ([RentalStatus.Cancelled, RentalStatus.Completed].includes(rental.status)) {
              throw new ErrorWithStatus({
                message: RENTALS_MESSAGE.CANNOT_CANCEL_THIS_RENTAL_WITH_STATUS.replace('%s', rental.status),
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const bike = await databaseService.bikes.findOne({ _id: rental.bike_id })
            if (!bike) {
              throw new ErrorWithStatus({
                message: RENTALS_MESSAGE.BIKE_NOT_FOUND.replace('%s', rental.bike_id.toString()),
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            if (![BikeStatus.Booked, BikeStatus.Reserved].includes(bike.status)) {
              throw new ErrorWithStatus({
                message: RENTALS_MESSAGE.CANNOT_CANCEL_WITH_BIKE_STATUS.replace('%s', bike.status),
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            req.rental = rental
            return true
          }
        }
      },
      bikeStatus: {
        in: ['body'],
        optional: true,
        trim: true,
        custom: {
          options: (value) => {
            if (!value) return true
            if (![BikeStatus.Available, BikeStatus.Broken].includes(value)) {
              throw new ErrorWithStatus({
                message: RENTALS_MESSAGE.CANNOT_EDIT_BIKE_STATUS_TO.replace('%s', value),
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            return true
          }
        }
      },
      reason: {
        in: ['body'],
        notEmpty: {
          errorMessage: RENTALS_MESSAGE.REQUIRED_CANCELLED_REASON
        },
        isString: {
          errorMessage: RENTALS_MESSAGE.INVALID_REASON
        },
        isLength: {
          options: { max: 255 },
          errorMessage: RENTALS_MESSAGE.REASON_TOO_LONG
        }
      }
    },
    ['body', 'params']
  )
)

export const checkUserWalletBeforeRentOrReserve = async (req: Request, res: Response, next: NextFunction) => {
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
