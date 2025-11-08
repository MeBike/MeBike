import databaseService from '~/services/database.services'
import { connection } from './connection'
import { Queue, Worker } from 'bullmq'
import reservationsService from '~/services/reservations.services'
import { BikeStatus, ReservationStatus } from '~/constants/enums'
import { toObjectId } from '~/utils/string'
import { getLocalTime } from '~/utils/date-time'
import fixedSlotService from '~/services/fixed-slot.services'
import { applySlotToDate } from '~/utils/reservation.helper'

export const reservationNotifyQueue = new Queue('reservation-notify', { connection })
export const reservationExpireQueue = new Queue('reservation-expire', { connection })
export const generateFixedSlotQueue = new Queue('generate-fixed-slot-reservations', {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false
  }
})

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

// src/queues/fixed-slot.queue.ts (tiếp)
export const generateFixedSlotWorker = new Worker(
  'generate-fixed-slot-reservations',
  async (job) => {
    const today = getLocalTime()
    today.setHours(0, 0, 0, 0) // 00:00:00 hôm nay
    console.log("today: ", today)

    const templates = await fixedSlotService.getActiveTemplatesForDate(today)

    for (const template of templates) {
      if (!template.days_of_week.includes(today.getDay())) continue

      const { start, end } = applySlotToDate(today, template.slot_start, template.slot_end)

      // Kiểm tra xe trống tại trạm
      const availableBike = await databaseService.bikes.findOne({
        station_id: template.station_id,
        status: { $in: [BikeStatus.Available, BikeStatus.Reserved] },
        _id: {
          $nin: await fixedSlotService.getReservedBikeIdsAtTime(template.station_id, start)
        }
      })

      const user = await databaseService.users.findOne({ _id: template.user_id })
      if (!user) continue

      if (!availableBike) {
        // Gửi email: Không có xe
        await reservationsService.sendReservationEmailFormat(
          'no-bike-available', // template file: no-bike-available.html
          'Không có xe khả dụng cho khung giờ cố định',
          {
            user_id: template.user_id,
            fullname: user.fullname,
            station_name: (await databaseService.stations.findOne({ _id: template.station_id }))?.name,
            slot_time: `${template.slot_start} - ${template.slot_end}`,
            date: today.toLocaleDateString('vi-VN')
          },
          user
        )
        continue
      }

      // Có xe → tạo Reservation
      try {
        const reservation = await reservationsService.reserveOneTime({
          user_id: template.user_id,
          bike_id: availableBike._id,
          station_id: template.station_id,
          start_time: start
        })

        // Gửi email: Đặt thành công
        await reservationsService.sendReservationEmailFormat(
          'fixed-slot-success',
          'Đặt xe tự động thành công',
          {
            ...reservation,
            station_name: (await databaseService.stations.findOne({ _id: template.station_id }))?.name,
            slot_time: `${template.slot_start} - ${template.slot_end}`
          },
          user
        )

        console.log(`[FixedSlot] Created reservation ${reservation._id} for user ${template.user_id}`)
      } catch (error) {
        console.error(`[FixedSlot] Failed to create reservation for template ${template._id}:`, error)
      }
    }
  },
  { connection }
)
