import databaseService from '~/services/database.services'
import { connection } from './connection'
import { Queue, Worker } from 'bullmq'
import reservationsService from '~/services/reservations.services'
import { BikeStatus, ReservationStatus } from '~/constants/enums'
import { toObjectId } from '~/utils/string'
import { getLocalTime } from '~/utils/date-time'
import { applySlotToDate } from '~/utils/reservation.helper'
import subscriptionService from '~/services/subscription.services'
import { fixedSlotTemplateService } from '~/services/fixed-slot.services'

export const reservationNotifyQueue = new Queue('reservation-notify', { connection })
export const reservationExpireQueue = new Queue('reservation-expire', { connection })
export const reservationConfirmEmailQueue = new Queue('send-confirm-email', { connection })
export const generateFixedSlotQueue = new Queue('generate-fixed-slot', {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false
  }
})
export const subscriptionConfirmEmailQueue = new Queue('send-subscription-confirm-email', { connection })
export const subscriptionActivationQueue = new Queue('subscription-activation', { connection })
export const subscriptionExpireQueue = new Queue('subscription-expire', { connection })

export const emailQueue = new Queue('email-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
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

export const generateFixedSlotWorker = new Worker(
  'generate-fixed-slot',
  async (job) => {
    const startTime = Date.now()
    const today = getLocalTime()
    today.setUTCHours(0, 0, 0, 0)

    console.log(`[FixedSlot] Starting generation for ${today.toISOString()}`)

    const templates = await fixedSlotTemplateService.getActiveTemplatesWithDetails(today)
    if (templates.length === 0) {
      console.log('[FixedSlot] No active templates found.')
      return
    }

    let successCount = 0
    let noBikeCount = 0
    let errorCount = 0

    const stationIds = [...new Set(templates.map(t => t.station_id.toString()))]
    const reservedBikeMap = await fixedSlotTemplateService.getReservedBikeMapByStations(stationIds, today)

    for (const template of templates) {
      try {
        if (!template.days_of_week.includes(today.getDay())) continue

        const { start, end } = applySlotToDate(today, template.slot_start, template.slot_end)

        const reservedBikeIds = reservedBikeMap.get(template.station_id.toString())?.get(start.getTime()) || []

        const availableBike = await databaseService.bikes.findOne({
          station_id: template.station_id,
          status: { $in: [BikeStatus.Available, BikeStatus.Reserved] },
          _id: { $nin: reservedBikeIds }
        })

        const emailData = {
          user_id: template.user_id,
          fullname: template.user.fullname,
          station_name: template.station.name,
          slot_time: `${template.slot_start} - ${template.slot_end}`,
          date: today.toLocaleDateString('vi-VN')
        }

        if (!availableBike) {
          // Gửi email: Không có xe
          await emailQueue.add('no-bike', {
            template: 'no-bike-available.html',
            subject: 'Không có xe khả dụng cho khung giờ cố định',
            data: emailData,
            user: template.user
          })
          noBikeCount++
          continue
        }

        // Tạo đặt chỗ
        const reservation = await reservationsService.reserveOneTime({
          user_id: template.user_id,
          bike_id: availableBike._id,
          station_id: template.station_id,
          start_time: start
        })

        // Gửi email: Thành công
        await emailQueue.add('success', {
          template: 'fixed-slot-success.html',
          subject: 'Đặt xe tự động thành công',
          data: {
            ...reservation,
            ...emailData
          },
          user: template.user
        })

        successCount++
        console.log(`[FixedSlot] Created: ${reservation._id} (user: ${template.user_id})`)
      } catch (error: any) {
        errorCount++
        console.error(`[FixedSlot] Failed template ${template._id}:`, error.message)
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(
      `[FixedSlot] Completed: ${successCount} success, ${noBikeCount} no bike, ${errorCount} errors in ${duration}s`
    )
  },
  {
    connection,
    concurrency: 1,
    limiter: { max: 1, duration: 5000 }
  }
)

new Worker(
  'send-confirm-email',
  async (job) => {
    const { reservation_id, user_id, station_id } = job.data

    const [reservation, station, user] = await Promise.all([
      databaseService.reservations.findOne({ _id: toObjectId(reservation_id) }),
      databaseService.stations.findOne({ _id: toObjectId(station_id) }, { projection: { name: 1 } }),
      databaseService.users.findOne({ _id: toObjectId(user_id) }, { projection: { fullname: 1, email: 1 } })
    ])

    const data = {
      ...reservation,
      station_name: station!.name
    }

    await reservationsService.sendSuccessReservingEmail(data, user!)
  },
  { connection }
)

new Worker(
  'send-subscription-confirm-email',
  async (job) => {
    const userId = job.data.user_id
    const user = await databaseService.users.findOne(
      { _id: toObjectId(userId) },
      {
        projection: {
          fullname: 1,
          email: 1
        }
      }
    )

    const result = await subscriptionService.sendSuccessSubscribingEmail(job.data, user!)
    console.log(`[Subscription] Send confirmation email for user ${userId}:`, result)
  },
  { connection }
)

// Kích hoạt sau 10 ngày
new Worker(
  'subscription-activation',
  async (job) => {
    await subscriptionService.activate(job.data.subscription_id)
  },
  { connection }
)

// Hết hạn sau 30 ngày
new Worker(
  'subscription-expire',
  async (job) => {
    await subscriptionService.expire(job.data.subscription_id)
  },
  { connection }
)

new Worker(
  'email-queue',
  async (job) => {
    const { template, subject, data, user } = job.data
    await reservationsService.sendReservationEmailFormat(template, subject, data, user)
  },
  { connection }
)
