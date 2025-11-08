// src/services/subscription.service.ts
import { Decimal128, ObjectId } from 'mongodb'
import { fromDaysToMs, fromHoursToMs, getLocalTime } from '~/utils/date-time'
import databaseService from './database.services'
import Subscription from '~/models/schemas/subscription.schema'
import { SubscriptionPackage, SubscriptionStatus } from '~/constants/enums'
import { subscriptionActivationQueue, subscriptionExpireQueue } from '~/lib/queue/reservation.queue'
import { ErrorWithStatus } from '~/models/errors'
import { RESERVATIONS_MESSAGE } from '~/constants/messages'
import HTTP_STATUS from '~/constants/http-status'
import walletService from './wallets.services'

interface CreateSubscriptionParams {
  user_id: ObjectId
  package_name: SubscriptionPackage
  price: string | Decimal128
  max_reservations_per_month?: number | null
}

class SubscriptionService {
  async create(params: CreateSubscriptionParams) {
    const price = params.price instanceof Decimal128 ? params.price : Decimal128.fromString(params.price)
    const sub = new Subscription({
      user_id: params.user_id,
      package_name: params.package_name,
      max_reservations_per_month: params.max_reservations_per_month,
      used_reservations: 0,
      price
    })

    const { insertedId } = await databaseService.subscriptions.insertOne(sub)
    const paymentDescription = RESERVATIONS_MESSAGE.SUBSCRIPTION_PAYMENT_DESCRIPTION.replace(
      '%s',
      insertedId.toString()
    )

    void walletService.paymentReservation(params.user_id.toString(), price, paymentDescription, insertedId)

    // Lên lịch kích hoạt sau 10 ngày
    const AUTO_ACTIVATED_TIME = Number(process.env.AUTO_ACTIVATE_IN_DAYS || '10')
    const delayMs = fromDaysToMs(AUTO_ACTIVATED_TIME)
    await subscriptionActivationQueue.add(
      'activate-subscription',
      { subscription_id: insertedId },
      { delay: delayMs, jobId: `activate-${insertedId}` }
    )

    return { _id: insertedId, ...sub }
  }

  async activate(subscription_id: ObjectId) {
    const sub = await databaseService.subscriptions.findOne({
      _id: subscription_id,
      status: SubscriptionStatus.PENDING
    })
    if (!sub) return // đã kích hoạt hoặc hủy

    const now = getLocalTime()
    const activated_at = now
    const EXPIRED_DAYS = Number(process.env.EXPIRE_AFTER_DAYS || '30')
    const expireDelayMs = fromDaysToMs(EXPIRED_DAYS)
    const expires_at = new Date(now.getTime() + expireDelayMs)

    await databaseService.subscriptions.updateOne(
      { _id: subscription_id },
      {
        $set: {
          status: SubscriptionStatus.ACTIVE,
          activated_at,
          expires_at,
          updated_at: now
        }
      }
    )

    // Lên lịch hết hạn
    await subscriptionExpireQueue.add(
      'expire-subscription',
      { subscription_id },
      { delay: expireDelayMs, jobId: `expire-${subscription_id}` }
    )

    console.log(`[Subscription] Activated ${subscription_id}`)
  }

  async useOne(subscription_id: ObjectId) {
    const sub = await databaseService.subscriptions.findOne({
      _id: subscription_id,
      status: { $in: [SubscriptionStatus.PENDING, SubscriptionStatus.ACTIVE] }
    })
    if (!sub)
      throw new ErrorWithStatus({
        message: RESERVATIONS_MESSAGE.SUBSCRIPTION_NOT_FOUND,
        status: HTTP_STATUS.BAD_REQUEST
      })

    const now = getLocalTime()
    if (sub.expires_at && now > sub.expires_at) {
      await this.expire(subscription_id)
      throw new ErrorWithStatus({
        message: RESERVATIONS_MESSAGE.SUB_ALREADY_EXPIRED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    if (sub.max_reservations_per_month != null && sub.used_reservations >= sub.max_reservations_per_month) {
      throw new ErrorWithStatus({
        message: RESERVATIONS_MESSAGE.SUB_USE_LIMIT_EXCEEDED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    await databaseService.subscriptions.updateOne(
      { _id: subscription_id },
      { $inc: { used_reservations: 1 }, $set: { updated_at: now } }
    )

    // Nếu là lần đầu dùng -> kích hoạt ngay
    if (sub.status === SubscriptionStatus.PENDING) {
      await this.activate(subscription_id)
    }
  }

  async expire(subscription_id: ObjectId) {
    await databaseService.subscriptions.updateOne(
      { _id: subscription_id },
      { $set: { status: SubscriptionStatus.EXPIRED, updated_at: getLocalTime() } }
    )
    console.log(`[Subscription] Expired ${subscription_id}`)
  }

  async getActiveByUser(user_id: ObjectId) {
    const now = getLocalTime()
    return await databaseService.subscriptions.findOne({
      user_id,
      status: SubscriptionStatus.ACTIVE,
      expires_at: { $gte: now }
    })
  }
}

const subscriptionService = new SubscriptionService()
export default subscriptionService
