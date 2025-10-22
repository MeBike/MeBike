import nodemailer from 'nodemailer'
import { Decimal128, ObjectId } from 'mongodb'
import { BikeStatus, RentalStatus, ReservationStatus, Role } from '~/constants/enums'
import Rental from '~/models/schemas/rental.schema'
import Reservation from '~/models/schemas/reservation.schema'
import { getLocalTime } from '~/utils/date'
import databaseService from './database.services'
import { ErrorWithStatus } from '~/models/errors'
import { COMMON_MESSAGE, RENTALS_MESSAGE, RESERVATIONS_MESSAGE } from '~/constants/messages'
import HTTP_STATUS from '~/constants/http-status'
import RentalLog from '~/models/schemas/rental-audit-logs.schema'
import walletService from './wallets.services'
import Bike from '~/models/schemas/bike.schema'
import { readEmailTemplate } from '~/utils/email-templates'
import { sleep } from '~/utils/timeout'

class ReservationsService {
  async reserveBike({
    user_id,
    bike_id,
    station_id,
    start_time
  }: {
    user_id: ObjectId
    bike_id: ObjectId
    station_id: ObjectId
    start_time: string
  }) {
    const now = getLocalTime()
    const prepaid = Decimal128.fromString(process.env.PREPAID_VALUE ?? '0')

    const session = databaseService.getClient().startSession()
    try {
      let reservation
      await session.withTransaction(async () => {
        const reservationId = new ObjectId()
        const description = RESERVATIONS_MESSAGE.PAYMENT_DESCRIPTION.replace('%s', bike_id.toString())

        await walletService.paymentReservation(user_id.toString(), prepaid, description, reservationId)

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
        await databaseService.reservations.insertOne(reservation, { session })

        const { end_time, status, station_id: start_station, prepaid: pre, ...restReservation } = reservation

        const rental = new Rental({
          ...restReservation,
          start_station,
          status: RentalStatus.Reserved
        })

        await databaseService.rentals.insertOne(rental, { session })

        await databaseService.bikes.updateOne(
          { _id: bike_id },
          {
            $set: {
              status: BikeStatus.Reserved,
              updated_at: now
            }
          },
          { session }
        )
      })
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
    reason?: string
  }) {
    const session = databaseService.getClient().startSession()
    try {
      let result
      await session.withTransaction(async () => {
        const now = getLocalTime()
        const updatedData: any = {}
        if (reservation.created_at && this.isCancellable(reservation.created_at)) {
          // TODO: handle refund
        }
        updatedData.status = ReservationStatus.Cancelled
        result = await databaseService.reservations.findOneAndUpdate(
          { _id: reservation._id },
          {
            $set: {
              ...updatedData,
              updated_at: now
            }
          },
          { returnDocument: 'after', session }
        )

        await databaseService.rentals.updateOne(
          { _id: reservation._id },
          {
            $set: {
              status: RentalStatus.Cancelled,
              updated_at: now
            }
          },
          { session }
        )

        await databaseService.bikes.updateOne(
          { _id: reservation.bike_id },
          {
            $set: {
              status: BikeStatus.Available,
              updated_at: now
            }
          }
        )

        const user = await databaseService.users.findOne({ _id: user_id }, { session })
        if (!user) {
          throw new ErrorWithStatus({
            message: RESERVATIONS_MESSAGE.USER_NOT_FOUND.replace('%s', user_id.toString()),
            status: HTTP_STATUS.NOT_FOUND
          })
        }

        if ([Role.Admin, Role.Staff].includes(user.role)) {
          const log = new RentalLog({
            rental_id: reservation._id!,
            admin_id: user_id,
            changes: Object.keys(updatedData),
            reason: reason || RESERVATIONS_MESSAGE.NO_CANCELLED_REASON
          })
          await databaseService.rentalLogs.insertOne({ ...log }, { session })
        }
      })
      return result
    } catch (error) {
      throw error
    } finally {
      await session.endSession()
    }
  }

  async confirmReservation({ user_id, reservation }: { user_id: ObjectId; reservation: Reservation }) {
    const session = databaseService.getClient().startSession()
    try {
      let result
      await session.withTransaction(async () => {
        const now = getLocalTime()

        const rental = await databaseService.rentals.findOne(
          {
            _id: reservation._id,
            user_id,
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

        const updatedRental = await databaseService.rentals.findOneAndUpdate(
          { _id: reservation._id },
          {
            $set: {
              start_time: now,
              status: RentalStatus.Rented,
              updated_at: now
            }
          },
          { returnDocument: 'after', session }
        )

        await databaseService.reservations.updateOne(
          { _id: reservation._id },
          {
            $set: {
              status: ReservationStatus.Active,
              updated_at: now
            }
          },
          { session }
        )

        await databaseService.bikes.updateOne(
          { _id: reservation.bike_id },
          {
            $set: {
              station_id: null,
              status: BikeStatus.Booked,
              updated_at: now
            }
          },
          { session }
        )

        result = updatedRental
      })
      return result
    } catch (error) {
      throw error
    } finally {
      await session.endSession()
    }
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

        const bufferMs = 60 *  1000
        const timeUntilExpiryMs = r.end_time?.getTime()! - now.getTime()
        const totalDelayMs = timeUntilExpiryMs + bufferMs

        this.scheduleDelayedCancellation(r, totalDelayMs)
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
    user_id,
    source_id,
    destination_id,
    bike_ids,
    bikes
  }: {
    user_id: ObjectId
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

    const session = databaseService.getClient().startSession()
    try {
      await session.withTransaction(async () => {
        const updateResult = await databaseService.bikes.updateMany(
          { _id: { $in: bike_ids }, station_id: source_id },
          {
            $set: {
              station_id: destination_id,
              updated_at: now
            }
          },
          { session }
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

        // TODO: Log the dispatch action for each bike
      })

      return {
        dispatched_count: bike_ids.length,
        from_station: sourceStation,
        to_station: destinationStation,
        dispatched_bikes: bikes
      }
    } catch (error) {
      throw error
    } finally {
      await session.endSession()
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

  async cancelExpiredReservations() {
    const now = getLocalTime()

    const expired = await databaseService.reservations
      .find({
        status: ReservationStatus.Pending,
        end_time: { $lt: now }
      })
      .toArray()

    if (expired.length === 0) {
      return { cancelled_count: 0 }
    }

    let cancelledCount = 0

    for (const r of expired) {
      const result = await this.cancelReservationAndReleaseBike(r)

      if (result.success) {
        cancelledCount++
        console.log(RESERVATIONS_MESSAGE.CANCELLED_SUCCESS(r._id.toString(), r.user_id.toString()))
      } else {
        console.error(
          RESERVATIONS_MESSAGE.CANCELLED_FAILURE(r._id.toString(), result.error || COMMON_MESSAGE.UNKNOWN_ERROR)
        )
      }
    }

    return { cancelled_count: cancelledCount }
  }

  async scheduleDelayedCancellation(reservation: Reservation, delayMs: number) {
    const effectiveDelayMs = Math.max(1000, delayMs)
    console.log(RESERVATIONS_MESSAGE.SCHEDULING_CANCEL_TASK(reservation._id!.toString(), Math.round(effectiveDelayMs / 60000)))

    await sleep(effectiveDelayMs)

    const currentReservation = await databaseService.reservations.findOne({
      _id: reservation._id,
      status: ReservationStatus.Pending
    })

    if (currentReservation) {
      const result = await this.cancelReservationAndReleaseBike(currentReservation)

      if (result.success) {
        console.log(
          RESERVATIONS_MESSAGE.CANCELLED_SUCCESS(
            currentReservation._id.toString(),
            currentReservation.user_id.toString()
          )
        )
      } else {
        console.error(
          RESERVATIONS_MESSAGE.CANCELLED_FAILURE(
            currentReservation._id.toString(),
            result.error || COMMON_MESSAGE.UNKNOWN_ERROR
          )
        )
      }
    }
  }

  private async cancelReservationAndReleaseBike(reservation: Reservation) {
    const session = databaseService.getClient().startSession()

    try {
      await session.withTransaction(async () => {
        const now = getLocalTime()

        await databaseService.reservations.updateOne(
          { _id: reservation._id, status: ReservationStatus.Pending },
          { $set: { status: ReservationStatus.Cancelled, updated_at: now } },
          { session }
        )

        await databaseService.bikes.updateOne(
          { _id: reservation.bike_id, status: BikeStatus.Reserved },
          { $set: { status: BikeStatus.Available, updated_at: now } },
          { session }
        )

        // IoT Integration: Send 'cancel' command to bike
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : COMMON_MESSAGE.UNKNOWN_ERROR }
    } finally {
      await session.endSession()
    }
  }

  generateEndTime(startTime: string) {
    const holdTimeMs = Number(process.env.HOLD_HOURS_RESERVATION || '1') * 60 * 60 * 1000
    return new Date(new Date(startTime).getTime() + holdTimeMs)
  }

  isCancellable(createdTime: Date) {
    const now = getLocalTime()
    const cancellableMs = Number(process.env.CANCELLABLE_HOURS || '1') * 60 * 60 * 1000
    return new Date(createdTime.getTime() + cancellableMs) < now
  }
}

const reservationsService = new ReservationsService()
export default reservationsService
