import type { ClientSession, ObjectId } from 'mongodb'

import { Decimal128, Int32, MongoServerError } from 'mongodb'

import { BikeStatus, GroupByOptions, RentalStatus, ReservationStatus, Role } from '~/constants/enums'
import HTTP_STATUS from '~/constants/http-status'
import { AUTH_MESSAGE, COMMON_MESSAGE, RENTALS_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import Rental from '~/models/schemas/rental.schema'
import { toObjectId } from '~/utils/string'

import databaseService from './database.services'
import { getLocalTime } from '~/utils/date'
import { CancelRentalReqBody, CardRentalReqBody, UpdateRentalReqBody } from '~/models/requests/rentals.requests'
import RentalLog from '~/models/schemas/rental-audit-logs.schema'
import { isAvailability } from '~/middlewares/bikes.middlewares'

class RentalsService {
  async createRentalSession({
    user_id,
    start_station,
    bike_id
  }: {
    user_id: ObjectId | string
    start_station: ObjectId | string
    bike_id: ObjectId | string
  }) {
    const objectedBikeId = toObjectId(bike_id)
    const session = databaseService.getClient().startSession()

    const createRentalCore = async (activeSession?: ClientSession) => {
      const rentalDocument = new Rental({
        user_id: toObjectId(user_id),
        start_station: toObjectId(start_station),
        bike_id: objectedBikeId,
        start_time: new Date(),
        status: RentalStatus.Rented
      })

      const sessionOptions = activeSession ? { session: activeSession } : undefined

      await databaseService.rentals.insertOne(rentalDocument, sessionOptions)

      await databaseService.bikes.updateOne(
        { _id: objectedBikeId },
        { $set: { status: BikeStatus.Booked } },
        sessionOptions
      )

      return rentalDocument
    }

    try {
      let rental: Rental | null = null
      try {
        await session.withTransaction(async () => {
          rental = await createRentalCore(session)
        })
      } catch (transactionError) {
        if (transactionError instanceof MongoServerError && transactionError.code === 20) {
          console.warn('Transactions unsupported, falling back to non-transactional flow.')
          rental = await createRentalCore()
        } else {
          throw transactionError
        }
      }
      if (!rental) {
        throw new ErrorWithStatus({
          message: RENTALS_MESSAGE.CREATE_SESSION_FAIL,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

      return {
        ...(rental as any),
        total_price: 0
      }
    } catch (error) {
      console.error(COMMON_MESSAGE.CREATE_SESSION_FAIL, error)
      throw error
    } finally {
      await session.endSession()
    }
  }

  async createRentalFromCard({ chip_id, card_uid }: CardRentalReqBody) {
    const user = await databaseService.users.findOne({ nfc_card_uid: card_uid })

    if (!user) {
      throw new ErrorWithStatus({
        message: 'User not found for the provided card.',
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const bike = await databaseService.bikes.findOne({ chip_id })
    if (!bike) {
      throw new ErrorWithStatus({
        message: `Bike with chip_id ${chip_id} not found or unavailable.`,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const activeRental = await databaseService.rentals.findOne({
      user_id: user._id as ObjectId,
      bike_id: bike._id as ObjectId,
      status: RentalStatus.Rented
    })

    if (activeRental) {
      const endedRental = await this.endRentalSession({
        user_id: user._id as ObjectId,
        rental: activeRental
      })

      return {
        mode: 'ended' as const,
        rental: endedRental
      }
    }

    const reservation = await databaseService.reservations.findOne({
      user_id: user._id as ObjectId,
      bike_id: bike._id as ObjectId,
      status: { $in: [ReservationStatus.Pending, ReservationStatus.Active] }
    })

    if (reservation) {
      const now = getLocalTime()
      await databaseService.reservations.updateOne(
        { _id: reservation._id },
        {
          $set: {
            status: ReservationStatus.Active,
            updated_at: now
          }
        }
      )

      const rentalSession = await this.createRentalSession({
        user_id: user._id as ObjectId,
        start_station: bike.station_id ?? reservation.station_id,
        bike_id: bike._id as ObjectId
      })

      return {
        mode: 'reservation_started' as const,
        rental: rentalSession
      }
    }

    if (!bike.station_id) {
      throw new ErrorWithStatus({
        message: `Bike with chip_id ${chip_id} not found or unavailable.`,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    isAvailability(bike.status as BikeStatus)

    const rentalSession = await this.createRentalSession({
      user_id: user._id as ObjectId,
      start_station: bike.station_id,
      bike_id: bike._id as ObjectId
    })

    return {
      mode: 'started' as const,
      rental: rentalSession
    }
  }

  async endRentalSession({ user_id, rental }: { user_id: ObjectId; rental: Rental }) {
    const session = databaseService.getClient().startSession()

    const executeEndRental = async (activeSession?: ClientSession) => {
      const findOptions = activeSession ? { session: activeSession } : undefined
      const user = await databaseService.users.findOne({ _id: user_id }, findOptions)
      if (!user) {
        throw new ErrorWithStatus({
          message: RENTALS_MESSAGE.USER_NOT_FOUND.replace('%s', user_id.toString()),
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      if (rental.user_id.toString().localeCompare(user_id.toString()) !== 0) {
        throw new ErrorWithStatus({
          message: RENTALS_MESSAGE.CANNOT_END_OTHER_RENTAL,
          status: HTTP_STATUS.FORBIDDEN
        })
      }
      const now = getLocalTime()
      const duration = this.generateDuration(rental.start_time, now)
      const totalPrice = this.generateTotalPrice(duration)

      const updatedData: Partial<Rental> = {
        end_station: rental.start_station,
        end_time: now,
        duration: new Int32(duration),
        total_price: Decimal128.fromString(totalPrice.toString()),
        status: RentalStatus.Completed
      }

      const result = await databaseService.rentals.findOneAndUpdate(
        { _id: rental._id },
        {
          $set: {
            ...updatedData,
            updated_at: now
          }
        },
        {
          returnDocument: 'after',
          ...(findOptions ?? {})
        }
      )

      const updatedRental = result ?? rental

      await databaseService.bikes.updateOne(
        { _id: updatedRental.bike_id },
        {
          $set: {
            status: BikeStatus.Available,
            updated_at: now
          }
        },
        findOptions
      )

      await databaseService.reservations.updateMany(
        {
          user_id: rental.user_id,
          bike_id: rental.bike_id,
          status: ReservationStatus.Active
        },
        {
          $set: {
            status: ReservationStatus.Expired,
            updated_at: now
          }
        },
        findOptions
      )

      return {
        ...updatedRental,
        total_price: Number(updatedRental.total_price.toString())
      }
    }

    try {
      try {
        const result = await session.withTransaction(async () => executeEndRental(session))
        if (result) {
          return result
        }
      } catch (transactionError) {
        if (transactionError instanceof MongoServerError && transactionError.code === 20) {
          console.warn('Transactions unsupported, falling back to non-transactional flow.')
          return await executeEndRental()
        }
        throw transactionError
      }
      return await executeEndRental()
    } catch (error) {
      console.error(COMMON_MESSAGE.CREATE_SESSION_FAIL, error)
      throw error
    } finally {
      await session.endSession()
    }
  }

  // for staff/admin
  async getDetailRental({ rental_id }: { rental_id: string | ObjectId }) {
    const rental = await databaseService.rentals.findOne({
      _id: toObjectId(rental_id)
    })
    if (!rental) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.NOT_FOUND.replace('%s', rental_id.toString()),
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return await this.buildDetailResponse(rental)
  }

  // for user
  async getMyDetailRental({ user_id, rental_id }: { user_id: ObjectId; rental_id: string | ObjectId }) {
    const rental = await databaseService.rentals.findOne({
      _id: toObjectId(rental_id)
    })
    if (!rental) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.NOT_FOUND.replace('%s', rental_id.toString()),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (rental.user_id.toString().localeCompare(user_id.toString()) !== 0) {
      throw new ErrorWithStatus({
        message: AUTH_MESSAGE.ACCESS_DENIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    }
    return await this.buildDetailResponse(rental)
  }

  async buildDetailResponse(rental: Rental) {
    const user = await databaseService.users.findOne({ _id: rental.user_id })
    if (!user) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.USER_NOT_FOUND.replace('%s', rental.user_id.toString()),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const bike = await databaseService.bikes.findOne({ _id: rental.bike_id })
    if (!bike) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.BIKE_NOT_FOUND.replace('%s', rental.bike_id.toString()),
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    if (bike.station_id) {
      const bikeStation = await databaseService.stations.findOne({ _id: bike.station_id })
      if (!bikeStation) {
        throw new ErrorWithStatus({
          message: RENTALS_MESSAGE.STATION_NOT_FOUND.replace('%s', rental.start_station.toString()),
          status: HTTP_STATUS.NOT_FOUND
        })
      }
    }

    const startStation = await databaseService.stations.findOne({ _id: rental.start_station })
    if (!startStation) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.STATION_NOT_FOUND.replace('%s', rental.start_station.toString()),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    let endStation = null
    if (rental.end_station) {
      endStation = await databaseService.stations.findOne({ _id: rental.end_station })
    }

    const { password, email_verify_token, forgot_password_token, ...insensitiveUserData } = user
    const { station_id, ...restBike } = bike
    const { _id, user_id, bike_id, start_station, end_station, ...restRental } = rental

    return {
      _id,
      user: insensitiveUserData,
      bike: restBike,
      start_station: startStation,
      end_station: endStation,
      ...restRental
    }
  }

  async updateDetailRental({
    rental_id,
    admin_id,
    payload
  }: {
    rental_id: string
    admin_id: string
    payload: UpdateRentalReqBody
  }) {
    const { end_station, end_time, total_price, reason } = payload
    const objRentalId = toObjectId(rental_id)
    const now = getLocalTime()

    const session = databaseService.getClient().startSession()
    try {
      let result
      await session.withTransaction(async () => {
        const rental = await databaseService.rentals.findOne({ _id: objRentalId }, { session })

        if (!rental) {
          throw new ErrorWithStatus({
            message: RENTALS_MESSAGE.NOT_FOUND,
            status: HTTP_STATUS.NOT_FOUND
          })
        }

        const updateData: any = { updated_at: now }

        if (end_station) {
          const objEndStation = toObjectId(end_station)
          const stationExists = await databaseService.stations.findOne({ _id: objEndStation }, { session })
          if (!stationExists) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.STATION_NOT_FOUND.replace('%s', end_station),
              status: HTTP_STATUS.NOT_FOUND
            })
          }
          updateData.end_station = objEndStation

          if (!rental.end_time && !end_time) {
            updateData.end_time = now
            updateData.duration = this.generateDuration(rental.start_time, now)
          }
        }

        if (end_time) {
          if (!end_station && !rental.end_station) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.CANNOT_END_WITHOUT_END_STATION,
              status: HTTP_STATUS.BAD_REQUEST
            })
          }
          const end = new Date(end_time)
          if (end < rental.start_time) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.END_TIME_GREATER_THAN_START_TIME,
              status: HTTP_STATUS.BAD_REQUEST
            })
          }

          updateData.end_time = end
          updateData.duration = this.generateDuration(rental.start_time, end)

          if (rental.status === RentalStatus.Rented) {
            updateData.status = RentalStatus.Completed
          }
        }

        if (end_time && !total_price) {
          updateData.total_price = this.generateTotalPrice(updateData.duration)
        } else if (total_price !== undefined) {
          updateData.total_price = total_price
        }

        result = await databaseService.rentals.findOneAndUpdate(
          { _id: objRentalId },
          { $set: updateData },
          { returnDocument: 'after', session }
        )

        const { updated_at, ...changedFields } = updateData

        const log = new RentalLog({
          rental_id: rental._id,
          admin_id: toObjectId(admin_id),
          reason: reason || RENTALS_MESSAGE.NO_REASON,
          changes: Object.keys(changedFields)
        })

        await databaseService.rentalLogs.insertOne(log, { session })
      })
      return result
    } catch (error) {
      throw error
    } finally {
      await session.endSession()
    }
  }

  async cancelRental({
    rental_id,
    admin_id,
    payload
  }: {
    rental_id: string
    admin_id: string
    payload: CancelRentalReqBody
  }) {
    const objRentalId = toObjectId(rental_id)
    const now = getLocalTime()
    const { bikeStatus, reason } = payload

    const session = databaseService.getClient().startSession()
    try {
      let result,
        total_price = 0
      await session.withTransaction(async () => {
        const rental = await databaseService.rentals.findOne({ _id: objRentalId })

        if (!rental) {
          throw new ErrorWithStatus({
            message: RENTALS_MESSAGE.NOT_FOUND,
            status: HTTP_STATUS.NOT_FOUND
          })
        }
        total_price = Number(rental.total_price.toString() || '0')

        const updateData: any = {
          end_time: now,
          end_station: rental.start_station,
          status: RentalStatus.Cancelled,
          updated_at: now
        }

        result = await databaseService.rentals.findOneAndUpdate(
          { _id: objRentalId },
          { $set: updateData },
          { returnDocument: 'after', session }
        )

        const updatedBikeStatus = bikeStatus ? bikeStatus : BikeStatus.Available

        await databaseService.bikes.updateOne(
          { _id: rental.bike_id },
          {
            $set: {
              status: updatedBikeStatus,
              updated_at: now
            }
          },
          { session }
        )

        const { updated_at, ...changedFields } = updateData

        const log = new RentalLog({
          rental_id: rental._id,
          admin_id: toObjectId(admin_id),
          reason: reason || RENTALS_MESSAGE.NO_REASON,
          changes: Object.keys(changedFields)
        })

        await databaseService.rentalLogs.insertOne(log, { session })
      })
      return {
        ...(result as any),
        total_price,
        reason
      }
    } catch (error) {
      throw error
    } finally {
      await session.endSession()
    }
  }

  async getRentalRevenue({ from, to, groupBy }: { from: string; to: string; groupBy: GroupByOptions }) {
    let dateFormat
    switch (groupBy) {
      case GroupByOptions.Month:
        dateFormat = '%m-%Y'
        break
      case GroupByOptions.Year:
        dateFormat = '%Y'
        break
      default:
        dateFormat = '%d-%m-%Y'
    }

    const startDate = from ? new Date(from) : new Date('2025-01-01')
    const endDate = to ? new Date(to) : getLocalTime()

    const pipeline = [
      {
        $match: {
          status: RentalStatus.Completed,
          end_time: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$end_time' }
          },
          totalRevenue: { $sum: { $toDouble: '$total_price' } },
          totalRentals: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalRevenue: 1,
          totalRentals: 1
        }
      }
    ]

    const result = await databaseService.rentals.aggregate(pipeline).toArray()
    return {
      period: { from: startDate, to: endDate },
      groupBy: groupBy ?? GroupByOptions.Day,
      data: result
    }
  }

  async getStationActivity({ from, to, stationId }: { from: string; to: string; stationId: string }) {
    const startDate = from ? new Date(from) : new Date('2025-01-01')
    const endDate = to ? new Date(to) : getLocalTime()

    const matchStage: any = {
      start_time: { $gte: startDate },
      end_time: { $lte: endDate },
      status: RentalStatus.Completed
    }

    if (stationId) {
      matchStage.start_station = toObjectId(stationId)
    }

    const pipeline = [
      {
        $match: matchStage
      },
      {
        $addFields: {
          durationHours: {
            $divide: [{ $subtract: ['$end_time', '$start_time'] }, 1000 * 60 * 60]
          }
        }
      },
      {
        $facet: {
          rentals: [
            {
              $group: {
                _id: '$start_station',
                totalUsageHours: { $sum: '$durationHours' },
                totalRentals: { $sum: 1 }
              }
            }
          ],
          returns: [
            {
              $group: {
                _id: '$end_station',
                totalReturns: { $sum: 1 }
              }
            }
          ]
        }
      },
      {
        $project: {
          all: { $concatArrays: ['$rentals', '$returns'] }
        }
      },
      { $unwind: '$all' },
      {
        $group: {
          _id: '$all._id',
          totalRentals: { $sum: '$all.totalRentals' },
          totalReturns: { $sum: '$all.totalReturns' },
          totalUsageHours: { $sum: '$all.totalUsageHours' }
        }
      },
      {
        $lookup: {
          from: 'stations',
          localField: '_id',
          foreignField: '_id',
          as: 'station'
        }
      },
      { $unwind: '$station' },
      {
        $lookup: {
          from: 'bikes',
          let: { stationId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$station_id', '$$stationId']
                }
              }
            },
            { $count: 'totalBikes' }
          ],
          as: 'bike_stats'
        }
      },
      {
        $addFields: {
          totalBikes: { $ifNull: [{ $arrayElemAt: ['$bike_stats.totalBikes', 0] }, 0] }
        }
      },
      {
        $addFields: {
          totalAvailableHours: {
            $multiply: [
              '$totalBikes',
              {
                $divide: [{ $subtract: [endDate, startDate] }, 1000 * 60 * 60]
              }
            ]
          }
        }
      },
      {
        $addFields: {
          usageRate: {
            $cond: [
              { $eq: ['$totalAvailableHours', 0] },
              0,
              {
                $divide: ['$totalUsageHours', '$totalAvailableHours']
              }
            ]
          }
        }
      },
      {
        $project: {
          _id: 0,
          station: '$station.name',
          totalBikes: 1,
          totalRentals: 1,
          totalReturns: 1,
          totalUsageHours: 1,
          totalAvailableHours: 1,
          usageRate: { $round: ['$usageRate', 2] }
        }
      },
      { $sort: { station: 1 } }
    ]

    const result = await databaseService.rentals.aggregate(pipeline).toArray()
    return {
      period: { from: startDate, to: endDate },
      data: result
    }
  }

  async getReservationsStatistic({ from, to, groupBy }: { from: string; to: string; groupBy: GroupByOptions }) {
    const startDate = from ? new Date(from) : new Date('2025-01-01')
    const endDate = to ? new Date(to) : getLocalTime()

    let dateFormat
    switch (groupBy) {
      case GroupByOptions.Month:
        dateFormat = '%m-%Y'
        break
      case GroupByOptions.Year:
        dateFormat = '%Y'
        break
      default:
        dateFormat = '%d-%m-%Y'
    }

    const pipeline = [
      {
        $match: {
          created_at: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            period: { $dateToString: { format: dateFormat, date: '$start_time' } }
          },
          totalReservations: { $sum: 1 },
          successful: {
            $sum: {
              $cond: [{ $eq: ['$status', ReservationStatus.Active] }, 1, 0]
            }
          },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ['$status', ReservationStatus.Cancelled] }, 1, 0]
            }
          },
          expired: {
            $sum: {
              $cond: [{ $eq: ['$status', ReservationStatus.Expired] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          period: '$_id.period',
          totalReservations: 1,
          successful: 1,
          cancelled: 1,
          expired: 1,
          successRate: {
            $cond: [{ $gt: ['$totalReservations', 0] }, { $divide: ['$successful', '$totalReservations'] }, 0]
          }
        }
      },
      { $sort: { period: -1 } }
    ]

    const result = await databaseService.reservations.aggregate(pipeline).toArray()
    return {
      period: { from: startDate, to: endDate },
      groupBy: groupBy ?? GroupByOptions.Day,
      data: result
    }
  }

  generateDuration(start: Date, end: Date) {
    return Math.ceil((end.getTime() - start.getTime()) / 60000)
  }

  generateTotalPrice(duration: number) {
    // eslint-disable-next-line node/prefer-global/process
    const pricePerMin = Number(process.env.PRICE_PER_MIN || '1')
    return pricePerMin * duration
  }
}

const rentalsService = new RentalsService()
export default rentalsService
