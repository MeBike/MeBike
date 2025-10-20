import { Decimal128, ObjectId } from 'mongodb'
import { BikeStatus, RentalStatus, ReservationStatus, Role } from '~/constants/enums'
import Rental from '~/models/schemas/rental.schema'
import Reservation from '~/models/schemas/reservation.schema'
import { getLocalTime } from '~/utils/date'
import databaseService from './database.services'
import { ErrorWithStatus } from '~/models/errors'
import { RENTALS_MESSAGE, RESERVATIONS_MESSAGE } from '~/constants/messages'
import HTTP_STATUS from '~/constants/http-status'
import RentalLog from '~/models/schemas/rental-audit-logs.schema'
import walletService from './wallets.services'
import Bike from '~/models/schemas/bike.schema'

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

    const expiring = await databaseService.reservations
      .find({
        status: ReservationStatus.Pending,
        end_time: { $lte: threshold, $gte: now }
      })
      .toArray()

    for (const r of expiring) {
      // TODO: send notification to user (e.g. push/email)
      console.log(`Notify user ${r.user_id}: reservation ${r._id} expires soon`)
    }

    return { count: expiring.length }
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
    .find(
      { _id: { $in: [source_id, destination_id] } },
      { projection: { name: 1 } }
    )
    .toArray()

  const sourceStation = stations.find(s => s._id.equals(source_id))
  const destinationStation = stations.find(s => s._id.equals(destination_id)) 

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
