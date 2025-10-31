import databaseService from '~/services/database.services'
import { connection } from './connection'
import { Queue, Worker } from 'bullmq'
import { ErrorWithStatus } from '~/models/errors'
import { RESERVATIONS_MESSAGE } from '~/constants/messages'
import HTTP_STATUS from '~/constants/http-status'
import reservationsService from '~/services/reservations.services'
import { ReservationStatus } from '~/constants/enums'
import { toObjectId } from '~/utils/string'

export const reservationNotifyQueue = new Queue('reservation-notify', { connection })
export const reservationExpireQueue = new Queue('reservation-expire', { connection })

export const reservationNotifyWorker = new Worker(
  'reservation-notify',
  async (job) => {
    const { reservationId, userId } = job.data
    const [reservation, user] = await Promise.all([
      databaseService.reservations.findOne({ _id: toObjectId(reservationId) }),
      databaseService.users.findOne({ _id: toObjectId(userId) })
    ])

    if (!reservation || reservation.status !== ReservationStatus.Pending) {
      console.log(`[NotifyWorker] Reservation ${reservationId} already processed.`)
      return
    }

    if (!user) {
      console.log(`[NotifyWorker] User ${userId} not found.`)
      return
    }

    const result = await reservationsService.sendExpiringNotification(reservation, user)
    console.log(`[NotifyWorker] Notification result for ${reservationId}:`, result)
  },
  { connection }
)

export const reservationExpireWorker = new Worker(
  'reservation-expire',
  async (job) => {
    const { reservationId, bikeId } = job.data

    const [reservation, bike] = await Promise.all([
      databaseService.reservations.findOne({ _id: toObjectId(reservationId) }),
      databaseService.bikes.findOne({ _id: toObjectId(bikeId) })
    ])

    if (!reservation || reservation.status !== ReservationStatus.Pending) {
      console.log(`[ExpireWorker] Reservation ${reservationId} already processed.`)
      return
    }

    if (!bike) {
      console.log(`[ExpireWorker] Bike ${bikeId} not found.`)
      return
    }

    const result = await reservationsService.expireReservationAndReleaseBike(reservation, bike)
    console.log(`[ExpireWorker] Expiration result for ${reservationId}:`, result)
  },
  { connection }
)
