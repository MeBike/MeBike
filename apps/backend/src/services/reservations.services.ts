import nodemailer from 'nodemailer'
import { Decimal128, ObjectId } from 'mongodb'
import { BikeStatus, GroupByOptions, RentalStatus, ReservationStatus, Role } from '~/constants/enums'
import Rental from '~/models/schemas/rental.schema'
import Reservation from '~/models/schemas/reservation.schema'
import { fromHoursToMs, fromMinutesToMs, getLocalTime } from '~/utils/date-time'
import databaseService from './database.services'
import { ErrorWithStatus } from '~/models/errors'
import { COMMON_MESSAGE, RENTALS_MESSAGE, RESERVATIONS_MESSAGE } from '~/constants/messages'
import HTTP_STATUS from '~/constants/http-status'
import RentalLog from '~/models/schemas/rental-audit-logs.schema'
import walletService from './wallets.services'
import Bike from '~/models/schemas/bike.schema'
import { readEmailTemplate } from '~/utils/email-templates'
import { sleep } from '~/utils/timeout'
import iotService from './iot.services'
import { IotBookingCommand, IotReservationCommand } from '@mebike/shared/sdk/iot-service'
import { reservationExpireQueue, reservationNotifyQueue } from '~/lib/queue/reservation.queue'
import User from '~/models/schemas/user.schema'

class ReservationsService {
  async reserveBike({
    user_id,
    bike,
    station_id,
    start_time
  }: {
    user_id: ObjectId
    bike: Bike
    station_id: ObjectId
    start_time: string
  }) {
    const now = getLocalTime()
    const prepaid = Decimal128.fromString(process.env.PREPAID_VALUE ?? '2000')
    const reservationId = new ObjectId()
    const bike_id = bike._id as ObjectId

    const startTime = new Date(start_time)
    const endTime = this.generateEndTime(start_time)

    const session = databaseService.getClient().startSession()
    try {
      const reservation = new Reservation({
        _id: reservationId,
        user_id,
        bike_id,
        station_id,
        start_time: startTime,
        end_time: endTime,
        status: ReservationStatus.Pending,
        prepaid
      })

      const rental = new Rental({
        _id: reservationId,
        user_id,
        bike_id,
        start_station: station_id,
        start_time: reservation.start_time,
        status: RentalStatus.Reserved
      })
      await session.withTransaction(async () => {
        await Promise.all([
          databaseService.reservations.insertOne(reservation, { session }),
          databaseService.rentals.insertOne(rental, { session }),
          databaseService.bikes.updateOne(
            { _id: bike_id },
            { $set: { status: BikeStatus.Reserved, updated_at: now } },
            { session }
          )
        ])
      })

      const beforeExpirationMin = Number(process.env.EXPIRY_NOTIFY_MINUTES || '15')
      const beforeExpirationMs = fromMinutesToMs(beforeExpirationMin)

      const delayToExpiry = Math.max(0, endTime.getTime() - now.getTime())
      const delayToNotify = Math.max(0, delayToExpiry - beforeExpirationMs)

      await Promise.all([
        reservationNotifyQueue.add(
          'reservation-notify',
          { reservationId: reservation._id, userId: user_id },
          { delay: delayToNotify, removeOnComplete: true, removeOnFail: false }
        ),
        reservationExpireQueue.add(
          'reservation-expire',
          { reservationId: reservation._id, bikeId: bike._id },
          { delay: delayToExpiry, removeOnComplete: true, removeOnFail: false }
        )
      ])

      console.log(
        `[Scheduler] Jobs added: notify in ${Math.round(delayToNotify / 60000)}m, expire in ${Math.round(
          delayToExpiry / 60000
        )}m`
      )

      const description = RESERVATIONS_MESSAGE.PAYMENT_DESCRIPTION.replace('%s', bike_id.toString())
      await walletService.paymentReservation(user_id.toString(), prepaid, description, reservationId)

      void iotService.sendReservationCommand(bike.chip_id ?? bike_id.toString(), IotReservationCommand.reserve)

      return {
        ...reservation,
        prepaid: Number.parseFloat(prepaid.toString())
      }
    } catch (error) {
      throw error
    } finally {
      await session.endSession()
    }
  }

  async cancelReservation({
    user_id,
    reservation,
    reason
  }: {
    user_id: ObjectId
    reservation: Reservation
    reason: string
  }) {
    const now = getLocalTime()
    const session = databaseService.getClient().startSession()
    try {
      const bike_id = reservation.bike_id
      const bike = await databaseService.bikes.findOne({ _id: bike_id })

      let reservationResult: Reservation | null = null
      let isRefund = false
      let refundAmount = 0

      await session.withTransaction(async () => {
        const updatedData: Partial<Reservation> = {
          status: ReservationStatus.Cancelled
        }
        if (reservation.created_at && this.isRefundable(reservation.created_at)) {
          isRefund = true
          refundAmount = parseFloat(reservation.prepaid.toString())
        }

        const log = new RentalLog({
          rental_id: reservation._id!,
          user_id,
          changes: updatedData,
          reason: reason || RESERVATIONS_MESSAGE.NO_REASON_PROVIDED
        })

        const [updatedResult] = await Promise.all([
          databaseService.reservations.findOneAndUpdate(
            { _id: reservation._id },
            {
              $set: {
                ...updatedData,
                updated_at: now
              }
            },
            { returnDocument: 'after', session }
          ),
          databaseService.rentals.updateOne(
            { _id: reservation._id },
            {
              $set: {
                status: RentalStatus.Cancelled,
                updated_at: now
              }
            },
            { session }
          ),
          databaseService.bikes.updateOne(
            { _id: reservation.bike_id },
            {
              $set: {
                status: BikeStatus.Available,
                updated_at: now
              }
            },
            { session }
          ),
          databaseService.rentalLogs.insertOne({ ...log }, { session })
        ])

        if (!updatedResult) {
          throw new ErrorWithStatus({
            message: RESERVATIONS_MESSAGE.RESERVATION_UPDATE_FAILED,
            status: HTTP_STATUS.BAD_REQUEST
          })
        }

        reservationResult = updatedResult
      })

      if (isRefund) {
        const description = RESERVATIONS_MESSAGE.REFUND_DESCRIPTION.replace('%s', reservation.bike_id.toString())
        void walletService
          .refundReservation(reservation.user_id.toString(), reservation.prepaid, description, reservation._id!)
          .catch((err) => console.warn(`[Wallet] Refund failed for reservation ${reservation._id}:`, err))
      }

      if (bike?.chip_id) {
        void iotService.sendReservationCommand(bike.chip_id, IotReservationCommand.cancel)
      }

      if (reservationResult) {
        return {
          ...(reservationResult as any),
          is_refund: isRefund,
          refund_amount: refundAmount
        }
      }
    } catch (error) {
      throw error
    } finally {
      await session.endSession()
    }
  }

  async confirmReservationCore({
    user_id,
    reservation,
    reason
  }: {
    user_id: ObjectId
    reservation: Reservation
    reason?: string
  }) {
    const now = getLocalTime()
    const session = databaseService.getClient().startSession()
    try {
      const bike_id = reservation.bike_id

      const [user, bike] = await Promise.all([
        databaseService.users.findOne({ _id: user_id }),
        databaseService.bikes.findOne({ _id: bike_id })
      ])

      let result: Rental | null = null

      await session.withTransaction(async () => {
        const rental = await databaseService.rentals.findOne(
          {
            _id: reservation._id,
            status: RentalStatus.Reserved
          },
          { session }
        )
        if (!rental) {
          throw new ErrorWithStatus({
            message: RENTALS_MESSAGE.NOT_FOUND_RESERVED_RENTAL.replace('%s', reservation._id!.toString()),
            status: HTTP_STATUS.NOT_FOUND
          })
        }

        const updatedData: any = {
          start_time: now,
          status: RentalStatus.Rented
        }

        const [rentalUpdateResult] = await Promise.all([
          databaseService.rentals.findOneAndUpdate(
            { _id: reservation._id },
            {
              $set: {
                ...updatedData,
                updated_at: now
              }
            },
            { returnDocument: 'after', session }
          ),
          databaseService.reservations.updateOne(
            { _id: reservation._id },
            { $set: { status: ReservationStatus.Active, updated_at: now } },
            { session }
          ),
          databaseService.bikes.updateOne(
            { _id: reservation.bike_id },
            { $set: { status: BikeStatus.Booked, updated_at: now } },
            { session }
          ),
          ...(user && user.role === Role.Staff && rental._id
            ? [
                databaseService.rentalLogs.insertOne(
                  new RentalLog({
                    rental_id: rental._id,
                    user_id,
                    changes: updatedData,
                    reason: reason || RESERVATIONS_MESSAGE.NO_REASON_PROVIDED
                  }),
                  { session }
                )
              ]
            : [])
        ])

        if (!rentalUpdateResult) {
          throw new ErrorWithStatus({
            message: RENTALS_MESSAGE.RENTAL_UPDATE_FAILED.replace('%s', reservation._id!.toString()),
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR
          })
        }

        result = rentalUpdateResult
      })

      if (bike?.chip_id) {
        void iotService.sendBookingCommand(bike.chip_id, IotBookingCommand.claim)
      }

      return result
    } catch (error) {
      throw error
    } finally {
      await session.endSession()
    }
  }

  async confirmReservation({ user_id, reservation }: { user_id: ObjectId; reservation: Reservation }) {
    if (!reservation.user_id.equals(user_id)) {
      throw new ErrorWithStatus({
        message: RESERVATIONS_MESSAGE.CANNOT_CONFIRM_OTHER_RESERVATION,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    return await this.confirmReservationCore({ user_id, reservation })
  }

  async staffConfirmReservation({
    staff_id,
    reservation,
    reason
  }: {
    staff_id: ObjectId
    reservation: Reservation
    reason: string
  }) {
    return await this.confirmReservationCore({ user_id: staff_id, reservation, reason })
  }

  async notifyExpiringReservations() {
    const now = getLocalTime()
    const threshold = new Date(now.getTime() + 15 * 60 * 1000)

    const expiringReservations = await databaseService.reservations
      .find({
        status: ReservationStatus.Pending,
        end_time: { $lte: threshold, $gte: now }
      })
      .toArray()

    if (expiringReservations.length === 0) {
      return { count: 0 }
    }

    const userIds = [...new Set(expiringReservations.map((r) => r.user_id))]

    const users = await databaseService.users
      .find({
        _id: { $in: userIds }
      })
      .toArray()

    const userMap = new Map(users.map((u) => [u._id.toString(), u]))

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_APP,
        pass: process.env.EMAIL_PASSWORD_APP
      }
    })

    const notificationPromises = expiringReservations.map(async (r) => {
      const userIdString = r.user_id.toString()
      const user = userMap.get(userIdString)

      if (!user || !user.email) {
        console.error(RESERVATIONS_MESSAGE.SKIPPING_USER_NOT_FOUND(userIdString))
        return null
      }

      try {
        const htmlContent = readEmailTemplate('neer-expiry-reservation.html', {
          fullname: user.fullname
        })

        const mailOptions = {
          from: `"MeBike" <${process.env.EMAIL_APP}>`,
          to: user.email,
          subject: RESERVATIONS_MESSAGE.EMAIL_SUBJECT_NEAR_EXPIRY,
          html: htmlContent
        }
        const mailPromise = transporter.sendMail(mailOptions)
        await mailPromise

        const bufferMs = 60 * 1000
        const timeUntilExpiryMs = r.end_time?.getTime()! - now.getTime()
        const totalDelayMs = timeUntilExpiryMs + bufferMs

        this.scheduleDelayedExpiration(r, totalDelayMs)
        return true
      } catch (error) {
        console.error(RESERVATIONS_MESSAGE.ERROR_SENDING_EMAIL(userIdString), error)
        return null
      }
    })

    await Promise.all(notificationPromises.filter((p) => p !== null))
    return { count: expiringReservations.length }
  }

  async dispatchSameStation({
    source_id,
    destination_id,
    bike_ids,
    bikes
  }: {
    source_id: ObjectId
    destination_id: ObjectId
    bike_ids: ObjectId[]
    bikes: Bike[]
  }) {
    const now = getLocalTime()

    const stations = await databaseService.stations
      .find({ _id: { $in: [source_id, destination_id] } }, { projection: { name: 1 } })
      .toArray()

    const sourceStation = stations.find((s) => s._id.equals(source_id))
    const destinationStation = stations.find((s) => s._id.equals(destination_id))

    const updateResult = await databaseService.bikes.updateMany(
      { _id: { $in: bike_ids }, station_id: source_id },
      {
        $set: {
          station_id: destination_id,
          updated_at: now
        }
      }
    )

    if (updateResult.modifiedCount !== bike_ids.length) {
      throw new ErrorWithStatus({
        message: RESERVATIONS_MESSAGE.PARTIAL_UPDATE_FAILURE.replace(
          '%s',
          updateResult.modifiedCount.toString()
        ).replace('%s', bike_ids.length.toString()),
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }

    return {
      dispatched_count: bike_ids.length,
      from_station: sourceStation,
      to_station: destinationStation,
      dispatched_bikes: bikes
    }
  }

  async getReservationReport(startDateStr?: string, endDateStr?: string, groupBy?: GroupByOptions) {
    let dateFilter: { $gte?: Date; $lte?: Date } = {}
    let twelveMonthsAgo = getLocalTime()
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)
    twelveMonthsAgo.setDate(1)

    dateFilter.$gte = startDateStr ? new Date(startDateStr) : twelveMonthsAgo

    if (endDateStr) {
      const endDate = new Date(endDateStr)
      endDate.setUTCHours(23, 59, 59, 999)

      dateFilter.$lte = endDate
    } else {
      dateFilter.$lte = getLocalTime()
    }

    const dateFormatMap: Record<GroupByOptions, string> = {
      [GroupByOptions.Date]: '%Y-%m-%d',
      [GroupByOptions.Month]: '%Y-%m',
      [GroupByOptions.Year]: '%Y'
    }
    const dateFormat = dateFormatMap[groupBy || GroupByOptions.Date]

    const pipeline = [
      {
        $match: {
          created_at: dateFilter,
          status: { $in: [ReservationStatus.Active, ReservationStatus.Cancelled, ReservationStatus.Expired] }
        }
      },
      {
        $lookup: {
          from: 'rentals',
          localField: '_id',
          foreignField: '_id',
          as: 'rental_info'
        }
      },
      {
        $addFields: {
          hasCompletedRental: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: '$rental_info',
                    as: 'r',
                    cond: { $eq: ['$$r.status', RentalStatus.Completed] }
                  }
                }
              },
              0
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: '$created_at'
            }
          },
          count: { $sum: 1 },
          successCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$status', ReservationStatus.Active] },
                    { $and: [{ $eq: ['$status', ReservationStatus.Expired] }, '$hasCompletedRental'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$status', ReservationStatus.Cancelled] }, 1, 0] }
          },
          expiredCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', ReservationStatus.Expired] }, { $not: '$hasCompletedRental' }] },
                1,
                0
              ]
            }
          },
          totalPrepaidRevenue: { $sum: '$prepaid' }
        }
      },
      {
        $project: {
          _id: 0,
          group_key: '$_id',
          total: '$count',
          success: '$successCount',
          cancelled: '$cancelledCount',
          expired: '$expiredCount',
          revenue: '$totalPrepaidRevenue'
        }
      },
      { $sort: { year: 1, month: 1, day: 1 } }
    ]

    const stats = await databaseService.reservations.aggregate(pipeline).toArray()

    return stats.map((item) => {
      const successRate = item.total > 0 ? (item.success / item.total) * 100 : 0
      const cancelRate = item.total > 0 ? (item.cancelled / item.total) * 100 : 0
      const expireRate = item.total > 0 ? (item.expired / item.total) * 100 : 0

      const keyName = groupBy === GroupByOptions.Year ? 'year' : groupBy === GroupByOptions.Month ? 'month' : 'date'

      return {
        [keyName]: item.group_key,
        total_reservations: item.total,
        successed_count: item.success,
        cancelled_count: item.cancelled,
        expired_count: item.expired,
        total_prepaid_revenue: Number(item.revenue.toString() || '0'),
        successed_rate: successRate.toFixed(2) + '%',
        cancelled_rate: cancelRate.toFixed(2) + '%',
        expired_rate: expireRate.toFixed(2) + '%'
      }
    })
  }

  async expireReservations() {
    const now = getLocalTime()

    const expiredReservations = await databaseService.reservations
      .find({
        status: ReservationStatus.Pending,
        end_time: { $lt: now }
      })
      .toArray()

    if (expiredReservations.length === 0) {
      return { expired_count: 0 }
    }

    const releasedBikeIds = expiredReservations.map((r) => r.bike_id)
    const releasedBikes = await databaseService.bikes.find({ _id: { $in: releasedBikeIds } }).toArray()
    const bikeMap = new Map(releasedBikes.map((b) => [b._id.toString(), b]))

    let expiredCount = 0

    const concurrencyLimit = 5
    const batches = []

    for (let i = 0; i < expiredReservations.length; i += concurrencyLimit) {
      const batch = expiredReservations.slice(i, i + concurrencyLimit)

      const results = await Promise.allSettled(
        batch.map(async (r) => {
          const bike = bikeMap.get(r.bike_id.toString())
          if (!bike) {
            console.warn(RESERVATIONS_MESSAGE.BIKE_NOT_FOUND.replace('%s', r.bike_id.toString()))
            return
          }

          const result = await this.expireReservationAndReleaseBike(r, bike)

          if (result.success) {
            expiredCount++
            console.log(RESERVATIONS_MESSAGE.EXPIRE_SUCCESS(r._id.toString(), r.user_id.toString()))
          } else {
            console.error(
              RESERVATIONS_MESSAGE.EXPIRE_FAILURE(r._id.toString(), result.error || COMMON_MESSAGE.UNKNOWN_ERROR)
            )
          }
        })
      )

      batches.push(results)
    }
    return { expired_count: expiredCount }
  }

  async scheduleDelayedExpiration(reservation: Reservation, delayMs: number) {
    const effectiveDelayMs = Math.max(1000, delayMs)
    console.log(
      RESERVATIONS_MESSAGE.SCHEDULING_EXPIRE_TASK(reservation._id!.toString(), Math.round(effectiveDelayMs / 60000))
    )

    await sleep(effectiveDelayMs)

    const currentReservation = await databaseService.reservations.findOne({
      _id: reservation._id,
      status: ReservationStatus.Pending
    })

    if (currentReservation) {
      const bike = await databaseService.bikes.findOne({ _id: currentReservation.bike_id })
      if (!bike) {
        throw new ErrorWithStatus({
          message: RESERVATIONS_MESSAGE.BIKE_NOT_FOUND.replace('%s', currentReservation.bike_id.toString()),
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      const result = await this.expireReservationAndReleaseBike(currentReservation, bike)

      if (result.success) {
        console.log(
          RESERVATIONS_MESSAGE.EXPIRE_SUCCESS(currentReservation._id.toString(), currentReservation.user_id.toString())
        )
      } else {
        console.error(
          RESERVATIONS_MESSAGE.EXPIRE_FAILURE(
            currentReservation._id.toString(),
            result.error || COMMON_MESSAGE.UNKNOWN_ERROR
          )
        )
      }
    }
  }

  async expireReservationAndReleaseBike(reservation: Reservation, bike: Bike) {
    const now = getLocalTime()
    const session = databaseService.getClient().startSession()

    try {
      await session.withTransaction(async () => {
        const [resUpdate, bikeUpdate] = await Promise.all([
          databaseService.reservations.updateOne(
            { _id: reservation._id, status: ReservationStatus.Pending },
            { $set: { status: ReservationStatus.Expired, updated_at: now } },
            { session }
          ),
          databaseService.bikes.updateOne(
            { _id: reservation.bike_id, status: BikeStatus.Reserved },
            { $set: { status: BikeStatus.Available, updated_at: now } },
            { session }
          )
        ])

        if (resUpdate.modifiedCount === 0) {
          throw new ErrorWithStatus({
            message: RESERVATIONS_MESSAGE.RESERVATION_NOT_UPDATED.replace('%s', reservation._id!.toString()),
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR
          })
        }
        if (bikeUpdate.modifiedCount === 0) {
          throw new ErrorWithStatus({
            message: RESERVATIONS_MESSAGE.BIKE_NOT_RELEASED.replace('%s', reservation.bike_id.toString()),
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR
          })
        }
      })
      await iotService.sendReservationCommand(bike.chip_id, IotReservationCommand.cancel)

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : COMMON_MESSAGE.UNKNOWN_ERROR }
    } finally {
      await session.endSession()
    }
  }

  generateEndTime(startTime: string) {
    const holdTimeMs = fromMinutesToMs(Number(process.env.HOLD_MINUTES_RESERVATION || '30'))
    return new Date(new Date(startTime).getTime() + holdTimeMs)
  }

  isRefundable(createdTime: Date) {
    const now = getLocalTime()
    const refundPeriodMs = fromHoursToMs(Number(process.env.REFUND_PERIOD_HOURS || '24'))
    return new Date(createdTime.getTime() + refundPeriodMs) > now
  }

  async getStationReservations({ stationId }: { stationId: ObjectId }) {
    const station = await databaseService.stations.findOne(
      { _id: stationId },
      {
        projection: {
          name: 1
        }
      }
    )

    if (!station) {
      throw new ErrorWithStatus({
        message: RESERVATIONS_MESSAGE.STATION_NOT_FOUND.replace('%s', stationId.toString()),
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    const reservations = await databaseService.reservations
      .find({
        station_id: stationId
      })
      .sort({ end_time: 1 })
      .toArray()

    if (reservations.length === 0) {
      return {
        station,
        total_count: 0,
        status_counts: {},
        reserving_bikes: []
      }
    }

    const statusCounts = reservations.reduce(
      (counts, r) => {
        const statusKey = r.status as string
        counts[statusKey] = (counts[statusKey] || 0) + 1
        return counts
      },
      {} as Record<string, number>
    )

    const bikeIds = reservations.filter((r) => r.status === ReservationStatus.Pending).map((r) => r.bike_id)

    const bikes = await databaseService.bikes.find({ _id: { $in: bikeIds } }).toArray()

    const bikeMap = new Map(bikes.map((b) => [b._id.toString(), b]))

    return {
      station,
      total_count: reservations.length,
      status_counts: statusCounts,
      reserving_bikes: reservations
        .filter((r) => r.status === ReservationStatus.Pending)
        .map((r) => ({
          ...bikeMap.get(r.bike_id.toString())
        }))
    }
  }

  async sendExpiringNotification(expiringReservation: Reservation, toUser: User) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_APP,
        pass: process.env.EMAIL_PASSWORD_APP
      }
    })

    const userIdString = expiringReservation.user_id.toString()

    if (!toUser || !toUser.email) {
      console.error(RESERVATIONS_MESSAGE.SKIPPING_USER_NOT_FOUND(userIdString))
      return { success: false }
    }

    try {
      const htmlContent = readEmailTemplate('neer-expiry-reservation.html', {
        fullname: toUser.fullname
      })

      const mailOptions = {
        from: `"MeBike" <${process.env.EMAIL_APP}>`,
        to: toUser.email,
        subject: RESERVATIONS_MESSAGE.EMAIL_SUBJECT_NEAR_EXPIRY,
        html: htmlContent
      }
      await transporter.sendMail(mailOptions)
      return { success: true }
    } catch (error) {
      console.error(RESERVATIONS_MESSAGE.ERROR_SENDING_EMAIL(userIdString), error)
      return { success: false }
    }
  }

  async getReservationDetail(id: string) {
    const objectId = new ObjectId(id)

    const pipeline = [
      { $match: { _id: objectId } },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'bikes',
          localField: 'bike_id',
          foreignField: '_id',
          as: 'bike'
        }
      },
      { $unwind: { path: '$bike', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'stations',
          localField: 'station_id',
          foreignField: '_id',
          as: 'station'
        }
      },
      { $unwind: { path: '$station', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          // reservation info
          _id: 1,
          start_time: 1,
          end_time: 1,
          prepaid: { $toDouble: '$prepaid' },
          status: 1,
          created_at: 1,
          updated_at: 1,

          // insensitive user info
          'user._id': 1,
          'user.fullname': 1,
          'user.username': 1,
          'user.email': 1,
          'user.phone_number': 1,
          'user.avatar': 1,
          'user.role': 1,

          // bike info
          'bike._id': 1,
          'bike.chip_id': 1,
          'bike.status': 1,

          // station info
          'station._id': 1,
          'station.name': 1,
          'station.address': 1,
          'station.latitude': 1,
          'station.longitude': 1
        }
      }
    ]

    const [result] = await databaseService.reservations.aggregate(pipeline).toArray()

    if (!result) {
      throw new ErrorWithStatus({
        message: RESERVATIONS_MESSAGE.NOT_FOUND.replace("%s", id),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return result
  }
}

const reservationsService = new ReservationsService()
export default reservationsService
