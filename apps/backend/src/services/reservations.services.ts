import { Decimal128, ObjectId } from 'mongodb'
import { BikeStatus, RentalStatus, ReservationStatus } from '~/constants/enums'
import { ReserveBikeReqBody } from '~/models/requests/reservations.requests'
import Rental from '~/models/schemas/rental.schema'
import Reservation from '~/models/schemas/reservation.schema'
import { getLocalTime } from '~/utils/date'
import { toObjectId } from '~/utils/string'
import databaseService from './database.services'

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
        reservation = new Reservation({
          user_id,
          bike_id,
          station_id,
          start_time: new Date(start_time),
          end_time: this.generateEndTime(start_time),
          status: ReservationStatus.Pending,
          prepaid
        })
        await databaseService.reservations.insertOne(reservation, { session })

        const { prepaid: pre, station_id: start_station, end_time, ...rental } = reservation

        const reservedRental = new Rental({
          ...rental,
          start_station,
          status: RentalStatus.Reserved
        })
        await databaseService.rentals.insertOne(reservedRental, { session })

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
        prepaid: Number(prepaid)
      }
    } catch (error) {
      throw error
    } finally {
      await session.endSession()
    }
  }

  async cancelReservation({user_id, reservation_id}:{user_id: ObjectId; reservation_id: ObjectId}){
    
  }

  generateEndTime(startTime: string) {
    const holdTimeMs = Number(process.env.HOLD_HOURS_RESERVATION || '1') * 60 * 60 * 1000
    return new Date(new Date(startTime).getTime() + holdTimeMs)
  }

  getCancellablePeriod(){
    
  }
}

const reservationsService = new ReservationsService()
export default reservationsService
