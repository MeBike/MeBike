import type { ClientSession, Document, ObjectId } from 'mongodb'

import { Decimal128, Int32 } from 'mongodb'

import { BikeStatus, GroupByOptions, RentalStatus, ReservationStatus, Role, TrendValue } from '~/constants/enums'
import HTTP_STATUS from '~/constants/http-status'
import { AUTH_MESSAGE, RENTALS_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import Rental from '~/models/schemas/rental.schema'
import { toObjectId } from '~/utils/string'

import databaseService from './database.services'
import { fromMinutesToMs, getLocalTime } from '~/utils/date-time'
import {
  CancelRentalReqBody,
  EndRentalByAdminOrStaffReqBody,
  UpdateRentalReqBody
} from '~/models/requests/rentals.requests'
import RentalLog from '~/models/schemas/rental-audit-logs.schema'
import walletService from './wallets.services'
import Bike from '~/models/schemas/bike.schema'
import { IotServiceSdk } from '@mebike/shared'
import { IotBookingCommand } from '@mebike/shared/sdk/iot-service'

const PENALTY_HOURS = parseInt(process.env.RENTAL_PENALTY_HOURS || '24', 10)
const PENALTY_AMOUNT = parseInt(process.env.RENTAL_PENALTY_AMOUNT || '50000', 10)
class RentalsService {
  async createRentalSession({
    user_id,
    start_station,
    bike
  }: {
    user_id: ObjectId | string
    start_station: ObjectId
    bike: Bike
  }) {
    const session = databaseService.getClient().startSession()

    try {
      let rental: Rental | null = null
      const now = getLocalTime()

      await session.withTransaction(async () => {
        const bike_id = bike._id as ObjectId
        rental = new Rental({
          user_id: toObjectId(user_id),
          start_station,
          bike_id,
          start_time: now,
          status: RentalStatus.Rented
        })

        await Promise.all([
          databaseService.rentals.insertOne(rental, { session }),
          databaseService.bikes.updateOne(
            { _id: bike_id },
            {
              $set: {
                station_id: null,
                status: BikeStatus.Booked,
                updated_at: now
              }
            },
            { session }
          )
        ])
      })
      if (!rental) {
        throw new ErrorWithStatus({
          message: RENTALS_MESSAGE.CREATE_SESSION_FAILED,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

      try {
        await IotServiceSdk.postV1DevicesDeviceIdCommandsBooking(bike.chip_id, {
          command: IotBookingCommand.book
        })
        console.log(`[IoT] Sent booking command for bike ${bike.chip_id}`)
      } catch (error) {
        console.warn(`[IoT] Failed to send booking command for bike ${bike.chip_id}:`, error)
      }

      return {
        ...(rental as any),
        total_price: 0
      }
    } catch (error) {
      throw error
    } finally {
      await session.endSession()
    }
  }

  async endRentalSession({ user_id, rental }: { user_id: ObjectId; rental: Rental }) {
    const end_station = rental.start_station
    const now = getLocalTime()

    if (!user_id.equals(rental.user_id)) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.CANNOT_END_OTHER_RENTAL,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    const session = databaseService.getClient().startSession()
    try {
      let endedRental: Rental = rental
      let logData: any = null

      await session.withTransaction(async () => {
        const result = await this.processRentalEndCore(rental, user_id, end_station, now, session)
        endedRental = result.rental
        logData = result.logData
      })

      await this.afterRentalEnd(endedRental, logData)

      return {
        ...endedRental,
        total_price: Number.parseFloat(endedRental.total_price.toString())
      }
    } catch (error) {
      throw error
    } finally {
      await session.endSession()
    }
  }

  async endRentalByAdminOrStaff({
    user_id,
    rental,
    payload
  }: {
    user_id: ObjectId
    rental: Rental
    payload: EndRentalByAdminOrStaffReqBody
  }) {
    const { end_station, end_time, reason } = payload
    const objStationId = toObjectId(end_station)
    const now = getLocalTime()
    const endTime = end_time ? new Date(end_time) : now

    if (endTime > now) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.END_DATE_CANNOT_BE_IN_FUTURE,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    if (endTime < rental.start_time) {
      throw new ErrorWithStatus({
        message: RENTALS_MESSAGE.END_TIME_MUST_GREATER_THAN_START_TIME,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const session = databaseService.getClient().startSession()
    try {
      let endedRental: Rental = rental
      let logData: any = null

      await session.withTransaction(async () => {
        const result = await this.processRentalEndCore(rental, user_id, objStationId, endTime, session, reason)
        endedRental = result.rental
        logData = result.logData
      })

      await this.afterRentalEnd(endedRental, logData)

      return {
        ...endedRental,
        total_price: Number.parseFloat(endedRental.total_price.toString())
      }
    } catch (error) {
      throw error
    } finally {
      await session.endSession()
    }
  }

  async processRentalEndCore(
    rental: Rental,
    user_id: ObjectId,
    end_station_id: ObjectId,
    effective_end_time: Date,
    session: ClientSession,
    reason?: string
  ): Promise<{ rental: Rental; logData?: any }> {
    const now = getLocalTime()
    const result: any = {}

    const duration = this.generateDuration(rental.start_time, effective_end_time)
    let totalPrice = this.generateTotalPrice(duration)

    const reservation = await databaseService.reservations.findOneAndUpdate(
      { _id: rental._id },
      {
        $set: {
          status: ReservationStatus.Expired,
          updated_at: now
        }
      },
      { returnDocument: 'before', session }
    )

    if (reservation) {
      totalPrice = Math.max(0, totalPrice - parseFloat(reservation.prepaid.toString()))
      result.is_reservation = true
      result.prepaid = parseFloat(reservation.prepaid.toString())
    }

    const hours = duration / 60
    if (hours > PENALTY_HOURS) {
      result.origin_price = totalPrice
      result.penalty_amount = PENALTY_AMOUNT
      totalPrice += PENALTY_AMOUNT
      console.log(
        `[Penalty] Added ${PENALTY_AMOUNT}₫ for exceeding ${PENALTY_HOURS} hours (duration: ${hours.toFixed(2)}h)`
      )
    }

    const decimalTotalPrice = Decimal128.fromString(totalPrice.toString())

    const updatedData: any = {
      end_station: end_station_id,
      end_time: effective_end_time,
      duration: new Int32(duration),
      total_price: decimalTotalPrice,
      status: RentalStatus.Completed,
      updated_at: now
    }

    const [rentalResult, bike] = await Promise.all([
      databaseService.rentals.findOneAndUpdate(
        { _id: rental._id },
        { $set: updatedData },
        { returnDocument: 'after', session }
      ),
      databaseService.bikes.findOneAndUpdate(
        { _id: rental.bike_id },
        {
          $set: {
            station_id: end_station_id,
            status: BikeStatus.Available,
            updated_at: now
          }
        },
        { returnDocument: 'after', session }
      )
    ])

    if (!rentalResult || !bike) {
      throw new ErrorWithStatus({
        message: !rentalResult ? RENTALS_MESSAGE.RENTAL_UPDATE_FAILED : RENTALS_MESSAGE.BIKE_UPDATE_FAILED,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }

    const logData = reason
      ? {
          rental_id: rental._id!,
          user_id,
          changes: updatedData,
          reason
        }
      : null

    return { rental: { ...rentalResult, ...result }, logData }
  }

  async afterRentalEnd(endedRental: Rental, logData?: any) {
    const tasks: Promise<any>[] = []
    const description = RENTALS_MESSAGE.PAYMENT_DESCRIPTION.replace('%s', endedRental.bike_id.toString())

    if (endedRental.total_price && Number(endedRental.total_price) > 0) {
      tasks.push(
        walletService.paymentRental(
          endedRental.user_id.toString(),
          Decimal128.fromString(endedRental.total_price.toString()),
          description,
          endedRental._id as ObjectId
        )
      )
    }

    if (logData) {
      const log = new RentalLog(logData)
      tasks.push(databaseService.rentalLogs.insertOne(log))
    }

    tasks.push(
      (async () => {
        try {
          const bike = await databaseService.bikes.findOne({ _id: endedRental.bike_id })
          if (bike?.chip_id) {
            await IotServiceSdk.postV1DevicesDeviceIdCommandsBooking(bike.chip_id, {
              command: IotBookingCommand.release
            })
            console.log(`[IoT] Released bike ${bike.chip_id}`)
          }
        } catch (error) {
          console.warn(`[IoT] Failed to release bike for rental ${endedRental._id}:`, error)
        }
      })()
    )

    await Promise.allSettled(tasks)
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

    // const { password, email_verify_token, forgot_password_token, ...insensitiveUserData } = user
    const { password, ...insensitiveUserData } = user
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
    const { end_station, end_time, status, total_price, reason } = payload
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

        if (end_time) {
          if (!end_station && !rental.end_station) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.CANNOT_END_WITHOUT_END_STATION,
              status: HTTP_STATUS.BAD_REQUEST
            })
          }
          const end = new Date(end_time)
          if (end > now) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.END_DATE_CANNOT_BE_IN_FUTURE,
              status: HTTP_STATUS.BAD_REQUEST
            })
          }
          if (end < rental.start_time) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.END_TIME_MUST_GREATER_THAN_START_TIME,
              status: HTTP_STATUS.BAD_REQUEST
            })
          }

          updateData.end_time = end
          updateData.duration = this.generateDuration(rental.start_time, end)

          if (status !== undefined) {
            updateData.status = status
          } else if (rental.status === RentalStatus.Rented) {
            updateData.status = RentalStatus.Completed
          }
        }

        if (end_station) {
          if (!rental.end_time && !end_time) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.CANNOT_END_WITHOUT_END_TIME,
              status: HTTP_STATUS.BAD_REQUEST
            })
          }
          updateData.end_station = toObjectId(end_station)
        }

        if (total_price !== undefined) {
          updateData.total_price = total_price
        } else if (end_time) {
          updateData.total_price = this.generateTotalPrice(updateData.duration)
        }

        const objResult = await databaseService.rentals.findOneAndUpdate(
          { _id: objRentalId },
          { $set: updateData },
          { returnDocument: 'after', session }
        )

        if (objResult) {
          const { total_price, created_at, updated_at, ...restResult } = objResult
          result = {
            ...restResult,
            total_price: Number(total_price),
            created_at,
            updated_at
          }
        }

        const { updated_at, ...changedFields } = updateData

        const log = new RentalLog({
          rental_id: rental._id,
          user_id: toObjectId(admin_id),
          reason: reason || RENTALS_MESSAGE.NO_REASON,
          changes: changedFields
        })

        await databaseService.rentalLogs.insertOne({ ...log }, { session })
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
            message: RENTALS_MESSAGE.NOT_FOUND.replace('%s', rental_id),
            status: HTTP_STATUS.NOT_FOUND
          })
        }

        const updateData: any = {
          end_time: now,
          end_station: rental.start_station,
          status: RentalStatus.Cancelled,
          updated_at: now
        }

        const updatedBikeStatus = bikeStatus ? bikeStatus : BikeStatus.Available

        const { updated_at, ...changedFields } = updateData

        const log = new RentalLog({
          rental_id: rental._id,
          user_id: toObjectId(admin_id),
          reason: reason || RENTALS_MESSAGE.NO_REASON,
          changes: changedFields
        })

        const [rentalResult] = await Promise.all([
          databaseService.rentals.findOneAndUpdate(
            { _id: objRentalId },
            { $set: updateData },
            { returnDocument: 'after', session }
          ),
          databaseService.bikes.updateOne(
            { _id: rental.bike_id },
            {
              $set: {
                station_id: rental.start_station,
                status: updatedBikeStatus,
                updated_at: now
              }
            },
            { session }
          ),
          databaseService.rentalLogs.insertOne({ ...log }, { session })
        ])

        if (!rentalResult) {
          throw new ErrorWithStatus({
            message: RENTALS_MESSAGE.RENTAL_UPDATE_FAILED,
            status: HTTP_STATUS.NOT_FOUND
          })
        }

        result = rentalResult
        total_price = Number(rentalResult.total_price.toString() || '0')
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

  async getRentalsByStationIdPipeline({
    stationId,
    status,
    expired_within
  }: {
    stationId: string
    status: RentalStatus
    expired_within: string
  }) {
    const objStationId = toObjectId(stationId)
    const matchQuery: any = {
      start_station: objStationId
    }
    if (status) {
      matchQuery.status = status
    }

    const now = getLocalTime()
    if (status === RentalStatus.Reserved && expired_within) {
      const minutes = parseInt(expired_within, 10)
      if (!isNaN(minutes)) {
        const expiryLimit = new Date(now.getTime() + fromMinutesToMs(minutes))

        matchQuery.start_time = {
          $gt: now,
          $lte: expiryLimit
        }
      }
    }

    const pipeline: Document[] = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'bikes',
          localField: 'bike_id',
          foreignField: '_id',
          as: 'bikeInfo'
        }
      },
      { $unwind: '$bikeInfo' },
      {
        $addFields: {
          timeRemainingMinutes: {
            $cond: {
              if: { $eq: ['$status', RentalStatus.Reserved] },
              then: {
                $max: [0, { $round: [{ $divide: [{ $subtract: ['$start_time', now] }, 60000] }] }]
              },
              else: '$$REMOVE'
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          user_id: 1,
          bike: '$bikeInfo',
          status: 1,
          timeRemainingMinutes: 1,
          start_station: 1,
          end_station: 1,
          start_time: 1,
          end_time: 1,
          duration: 1,
          total_price: { $toDouble: { $ifNull: ['$total_price', '0'] } },
          created_at: 1,
          updated_at: 1
        }
      },
      {
        $sort: {
          timeRemainingMinutes: -1
        }
      }
    ]

    return pipeline
  }

  async getTodayRevenueSummary() {
    const now = getLocalTime()

    const startOfToday = new Date(now)
    startOfToday.setUTCHours(0, 0, 0, 0)
    const endOfToday = new Date(now)
    endOfToday.setUTCHours(23, 59, 59, 999)

    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)
    const endOfYesterday = new Date(startOfToday)
    endOfYesterday.setMilliseconds(-1)


    const pipeline = (start: Date, end: Date) => [
      {
        $match: {
          status: RentalStatus.Completed,
          end_time: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $toDouble: '$total_price' } },
          totalRentals: { $sum: 1 }
        }
      }
    ]

    const [todayAgg, yesterdayAgg] = await Promise.all([
      databaseService.rentals.aggregate(pipeline(startOfToday, endOfToday)).toArray(),
      databaseService.rentals.aggregate(pipeline(startOfYesterday, endOfYesterday)).toArray()
    ])

    const today = todayAgg[0] || { totalRevenue: 0, totalRentals: 0 }
    const yesterday = yesterdayAgg[0] || { totalRevenue: 0, totalRentals: 0 }

    const compare = (todayVal: number, yesterdayVal: number) => {
      if (yesterdayVal === 0) return todayVal > 0 ? 100 : 0
      return ((todayVal - yesterdayVal) / yesterdayVal) * 100
    }

    const revenueChange = compare(today.totalRevenue, yesterday.totalRevenue)
    const rentalChange = compare(today.totalRentals, yesterday.totalRentals)

    return {
      today: {
        totalRevenue: today.totalRevenue,
        totalRentals: today.totalRentals
      },
      yesterday: {
        totalRevenue: yesterday.totalRevenue,
        totalRentals: yesterday.totalRentals
      },
      revenueChange,
      revenueTrend: revenueChange > 0 ? TrendValue.Up : revenueChange < 0 ? TrendValue.Down : TrendValue.NoChange,
      rentalChange,
      rentalTrend: rentalChange > 0 ? TrendValue.Up : rentalChange < 0 ? TrendValue.Down : TrendValue.NoChange
    }
  }

  async getTodayRentalPerHour() {
    const now = getLocalTime()

    const startOfToday = new Date(now)
    startOfToday.setUTCHours(0, 0, 0, 0)

    const endOfToday = new Date(now)
    endOfToday.setUTCHours(23, 59, 59, 999)

    const pipeline = [
      {
        $match: {
          status: RentalStatus.Completed,
          end_time: { $gte: startOfToday, $lte: endOfToday }
        }
      },
      {
        $group: {
          _id: { $hour: '$end_time' },
          totalRentals: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          hour: '$_id',
          totalRentals: 1
        }
      }
    ]

    const result = await databaseService.rentals.aggregate(pipeline).toArray()

    const fullDay = Array.from({ length: 24 }, (_, hour) => {
      const found = result.find(r => r.hour === hour)
      return { hour, totalRentals: found ? found.totalRentals : 0 }
    })

    return fullDay
  }

  generateDuration(start: Date, end: Date) {
    return Math.ceil((end.getTime() - start.getTime()) / 60000)
  }

  generateTotalPrice(minutes: number) {
    // eslint-disable-next-line node/prefer-global/process
    const halfHourUnit = Math.max(1, Math.ceil(minutes / 30))
    const pricePer30Min = Number(process.env.PRICE_PER_30_MINS || '2000')
    return pricePer30Min * halfHourUnit
  }
}

const rentalsService = new RentalsService()
export default rentalsService
