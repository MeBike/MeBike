import nodemailer from 'nodemailer'
import { Decimal128, ObjectId } from 'mongodb'
import { BikeStatus, RentalStatus, ReservationStatus, Role } from '~/constants/enums'
import Rental from '~/models/schemas/rental.schema'
import Reservation from '~/models/schemas/reservation.schema'
import { fromHoursToMs, getLocalTime } from '~/utils/date-time'
import databaseService from './database.services'
import { ErrorWithStatus } from '~/models/errors'
import { COMMON_MESSAGE, RENTALS_MESSAGE, RESERVATIONS_MESSAGE } from '~/constants/messages'
import HTTP_STATUS from '~/constants/http-status'
import RentalLog from '~/models/schemas/rental-audit-logs.schema'
import walletService from './wallets.services'
import Bike from '~/models/schemas/bike.schema'
import { readEmailTemplate } from '~/utils/email-templates'
import { sleep } from '~/utils/timeout'
import { IotServiceSdk } from '@mebike/shared'
import { IotBookingCommand, IotReservationCommand } from '@mebike/shared/sdk/iot-service'

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
    const prepaid = Decimal128.fromString(process.env.PREPAID_VALUE ?? '0')
    const reservationId = new ObjectId()
    const bike_id = bike._id as ObjectId
    const description = RESERVATIONS_MESSAGE.PAYMENT_DESCRIPTION.replace('%s', bike_id.toString())

    await walletService.paymentReservation(user_id.toString(), prepaid, description, reservationId)

    const session = databaseService.getClient().startSession()
    try {
      let reservation
      await session.withTransaction(async () => {
        reservation = new Reservation({
          _id: reservationId,
          user_id,
          bike_id,
          station_id,
          start_time: new Date(start_time),
          end_time: this.generateEndTime(start_time),
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
      try {
        await IotServiceSdk.postV1DevicesDeviceIdCommandsReservation(bike.chip_id, {
          command: IotReservationCommand.reserve
        })
        console.log(`[IoT] Sent reservation command for bike ${bike.chip_id}`)
      } catch (error) {
        console.warn(`[IoT] Failed to send reservation command for bike ${bike.chip_id}:`, error)
      }
      return {
        ...(reservation as any),
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
    const session = databaseService.getClient().startSession()
    try {
      let result: Reservation | null = null
      const now = getLocalTime()

      const bike = await databaseService.bikes.findOne({ _id: reservation.bike_id })

      await session.withTransaction(async () => {
        const updatedData: Partial<Reservation> = {
          status: ReservationStatus.Cancelled
        }
        if (reservation.created_at && this.isRefundable(reservation.created_at)) {
          const description = RESERVATIONS_MESSAGE.REFUND_DESCRIPTION.replace('%s', reservation.bike_id.toString())
          walletService.refundReservation(
            reservation.user_id.toString(),
            reservation.prepaid,
            description,
            reservation._id!
          )
        }

        const log = new RentalLog({
          rental_id: reservation._id!,
          user_id,
          changes: updatedData,
          reason: reason || RESERVATIONS_MESSAGE.NO_REASON_PROVIDED
        })

        const [reservationResult] = await Promise.all([
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

        if (!reservationResult) {
          throw new ErrorWithStatus({
            message: RESERVATIONS_MESSAGE.RESERVATION_UPDATE_FAILED,
            status: HTTP_STATUS.BAD_REQUEST
          })
        }

        result = reservationResult
      })
      if (bike?.chip_id) {
        try {
          await IotServiceSdk.postV1DevicesDeviceIdCommandsReservation(bike.chip_id, {
            command: IotReservationCommand.cancel
          })
          console.log(`[IoT] Sent cancellation command for bike ${bike.chip_id}`)
        } catch (error) {
          console.warn(`[IoT] Failed to send cancellation command for bike ${bike.chip_id}:`, error)
        }
      }
      return result
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
    const session = databaseService.getClient().startSession()
    try {
      let result: Rental | null = null
      const now = getLocalTime()

      const [user, bike] = await Promise.all([
        databaseService.users.findOne({ _id: user_id }),
        databaseService.bikes.findOne({ _id: reservation.bike_id })
      ])

      if (!user) {
        throw new ErrorWithStatus({
          message: RESERVATIONS_MESSAGE.USER_NOT_FOUND.replace('%s', user_id.toString()),
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

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

        if (user.role === Role.User && !rental.user_id.equals(user_id)) {
          throw new ErrorWithStatus({
            message: RESERVATIONS_MESSAGE.CANNOT_CONFIRM_OTHER_RESERVATION,
            status: HTTP_STATUS.BAD_REQUEST
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
            { $set: { station_id: null, status: BikeStatus.Booked, updated_at: now } },
            { session }
          ),
          ...(user.role === Role.Staff && rental._id
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
        try {
          await IotServiceSdk.postV1DevicesDeviceIdCommandsBooking(bike.chip_id, {
            command: IotBookingCommand.claim
          })
          console.log(`[IoT] Sent confirmation command for bike ${bike.chip_id}`)
        } catch (error) {
          console.warn(`[IoT] Failed to send confirmation command for bike ${bike.chip_id}:`, error)
        }
      }

      return result
    } catch (error) {
      throw error
    } finally {
      await session.endSession()
    }
  }

  async confirmReservation({ user_id, reservation }: { user_id: ObjectId; reservation: Reservation }) {
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

  async getReservationReport(startDateStr?: string, endDateStr?: string) {
    let dateFilter: { $gte?: Date; $lte?: Date } = {}
    let twelveMonthsAgo = getLocalTime()
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)
    twelveMonthsAgo.setDate(1)

    if (startDateStr) {
      dateFilter.$gte = new Date(startDateStr)
    } else {
      dateFilter.$gte = twelveMonthsAgo
    }

    if (endDateStr) {
      const endDate = new Date(endDateStr)
      endDate.setDate(endDate.getDate() + 1)
      dateFilter.$lte = endDate
    } else {
      dateFilter.$lte = getLocalTime()
    }

    const pipeline = [
      {
        $match: {
          created_at: dateFilter,
          status: {
            $in: [ReservationStatus.Active, ReservationStatus.Cancelled, ReservationStatus.Expired]
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$created_at' },
            year: { $year: '$created_at' },
            status: '$status'
          },
          count: { $sum: 1 },
          totalPrepaidRevenue: { $sum: '$prepaid' }
        }
      },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          year: '$_id.year',
          status: '$_id.status',
          count: '$count',
          revenue: '$totalPrepaidRevenue'
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]

    const monthlyStats = await databaseService.reservations.aggregate(pipeline).toArray()

    const summaryMap = monthlyStats.reduce((acc, item) => {
      const monthKey = `${item.year}-${item.month}`
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month_year: monthKey,
          total: 0,
          success: 0,
          cancelled: 0,
          total_revenue: 0
        }
      }

      acc[monthKey].total += item.count
      acc[monthKey].total_revenue += Number(item.revenue.toString())

      if (item.status === ReservationStatus.Cancelled) {
        acc[monthKey].cancelled += item.count
      } else if (item.status === ReservationStatus.Active || item.status === ReservationStatus.Expired) {
        acc[monthKey].success += item.count
      }
      return acc
    }, {})

    const finalReport = Object.keys(summaryMap).map((key) => {
      const data = summaryMap[key]
      const successRate = data.total > 0 ? (data.success / data.total) * 100 : 0
      const cancelRate = data.total > 0 ? (data.cancelled / data.total) * 100 : 0

      return {
        month_year: key,
        total_reservations: data.total,
        success_count: data.success,
        cancelled_count: data.cancelled,
        total_prepaid_revenue: data.total_revenue,
        success_rate: successRate.toFixed(2) + '%',
        cancel_rate: cancelRate.toFixed(2) + '%'
      }
    })

    return finalReport
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
          RESERVATIONS_MESSAGE.EXPIRE_SUCCESS(
            currentReservation._id.toString(),
            currentReservation.user_id.toString()
          )
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

  private async expireReservationAndReleaseBike(reservation: Reservation, bike: Bike) {
    const session = databaseService.getClient().startSession()

    try {
      await session.withTransaction(async () => {
        const now = getLocalTime()

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
      try {
        await IotServiceSdk.postV1DevicesDeviceIdCommandsReservation(bike.chip_id, {
          command: IotReservationCommand.cancel
        })
        console.log(`[IoT] Sent cancellation command for bike ${bike.chip_id}`)
      } catch (error) {
        console.warn(`[IoT] Failed to send cancellation command for bike ${bike.chip_id}:`, error)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : COMMON_MESSAGE.UNKNOWN_ERROR }
    } finally {
      await session.endSession()
    }
  }

  generateEndTime(startTime: string) {
    const holdTimeMs = fromHoursToMs(Number(process.env.HOLD_HOURS_RESERVATION || '1'))
    return new Date(new Date(startTime).getTime() + holdTimeMs)
  }

  isRefundable(createdTime: Date) {
    const now = getLocalTime()
    const cancellableMs = fromHoursToMs(Number(process.env.CANCELLABLE_HOURS || '1'))
    return new Date(createdTime.getTime() + cancellableMs) > now
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
}

const reservationsService = new ReservationsService()
export default reservationsService
