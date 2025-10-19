import type { ObjectId } from 'mongodb'

import { ReservationStatus } from '~/constants/enums'
import databaseService from './database.services'

export interface ReservationFacade {
  findPendingOrActiveByUserAndBike(params: { user_id: ObjectId; bike_id: ObjectId }): Promise<{
    _id: ObjectId
    user_id: ObjectId
    bike_id: ObjectId
    station_id?: ObjectId | null
  } | null>

  activateReservation(params: { reservation_id: ObjectId }): Promise<void>

  expireActiveForUserAndBike(params: { user_id: ObjectId; bike_id: ObjectId }): Promise<void>
}

class ProtoReservationAdapter implements ReservationFacade {
  async findPendingOrActiveByUserAndBike({ user_id, bike_id }: { user_id: ObjectId; bike_id: ObjectId }) {
    const reservation = await databaseService.reservations.findOne({
      user_id,
      bike_id,
      status: { $in: [ReservationStatus.Pending, ReservationStatus.Active] }
    })

    if (!reservation) return null as any
    return {
      _id: reservation._id!,
      user_id: reservation.user_id,
      bike_id: reservation.bike_id,
      station_id: reservation.station_id
    } as any
  }

  async activateReservation({ reservation_id }: { reservation_id: ObjectId }) {
    const now = new Date()
    await databaseService.reservations.updateOne(
      { _id: reservation_id },
      { $set: { status: ReservationStatus.Active, updated_at: now } }
    )
  }

  async expireActiveForUserAndBike({ user_id, bike_id }: { user_id: ObjectId; bike_id: ObjectId }) {
    const now = new Date()
    await databaseService.reservations.updateMany(
      { user_id, bike_id, status: ReservationStatus.Active },
      { $set: { status: ReservationStatus.Expired, updated_at: now } }
    )
  }
}

export function getReservationFacade(): ReservationFacade {
  const impl = (process.env.RESERVATION_IMPL || 'proto').toLowerCase()
  switch (impl) {
    case 'proto':
    default:
      return new ProtoReservationAdapter()
  }
}

