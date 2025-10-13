import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'

import { BikeStatus, RentalStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/http-status'
import { RENTALS_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'
import { isAvailability } from './bikes.middlewares'
import { toObjectId } from '~/utils/string'

export const createRentalSessionValidator = validate(
  checkSchema(
    {
      start_station: {
        notEmpty: {
          errorMessage: RENTALS_MESSAGE.REQUIRED_START_STATION,
          bail: true
        },
        isMongoId: {
          errorMessage: RENTALS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'start_station'),
          bail: true
        }
      },
      bike_id: {
        notEmpty: {
          errorMessage: RENTALS_MESSAGE.REQUIRED_BIKE_ID,
          bail: true
        },
        isMongoId: {
          errorMessage: RENTALS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'bike_id'),
          bail: true
        },
        custom: {
          options: async (value, { req }) => {
            const stationId = toObjectId(req.body.start_station)
            const bikeId = toObjectId(value)

            const station = await databaseService.stations.findOne({ _id: stationId })
            if (!station) {
              throw new ErrorWithStatus({
                message: RENTALS_MESSAGE.STATION_NOT_FOUND.replace('%s', req.body.start_station),
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            const bikeInStation = await databaseService.bikes.findOne({
              _id: bikeId,
              station_id: station._id
            })

            if (!bikeInStation) {
              throw new ErrorWithStatus({
                message: RENTALS_MESSAGE.BIKE_NOT_FOUND_IN_STATION.replace('%s', value).replace('%s', station.name),
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            isAvailability(bikeInStation.status as BikeStatus)

            req.station = station
            req.bike = bikeInStation
            return true
          }
        }
      },
      media_urls: {
        optional: true,
        isArray: {
          errorMessage: RENTALS_MESSAGE.INVALID_MEDIA_URLS
        },
        custom: {
          options: (value: string[]) => {
            for (const url of value) {
              const urlPattern = /^(https?:\/\/)([\w\-]+\.)+[\w\-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i
              if(!urlPattern.test(url)){
                throw new ErrorWithStatus({
                  message: RENTALS_MESSAGE.INVALID_URL_FORMAT.replace("%s",url),
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

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
    },
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
