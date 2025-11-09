// src/services/subscription.service.ts
import { Decimal128, Document, ObjectId } from 'mongodb'
import { formatUTCDateToVietnamese, fromDaysToMs, fromHoursToMs, getLocalTime } from '~/utils/date-time'
import databaseService from './database.services'
import Subscription from '~/models/schemas/subscription.schema'
import { SubscriptionPackage, SubscriptionStatus } from '~/constants/enums'
import {
  subscriptionActivationQueue,
  subscriptionConfirmEmailQueue,
  subscriptionExpireQueue
} from '~/lib/queue/reservation.queue'
import { ErrorWithStatus } from '~/models/errors'
import { RESERVATIONS_MESSAGE } from '~/constants/messages'
import HTTP_STATUS from '~/constants/http-status'
import walletService from './wallets.services'
import reservationsService from './reservations.services'
import User from '~/models/schemas/user.schema'
import { FilterQuery } from 'mongoose'
import { toObjectId } from '~/utils/string'

interface CreateSubscriptionParams {
  user_id: ObjectId
  package_name: SubscriptionPackage
  price: string | Decimal128
  max_reservations_per_month?: number | null
}

class SubscriptionService {
  async create(params: CreateSubscriptionParams) {
    const now = getLocalTime()
    const price = params.price instanceof Decimal128 ? params.price : Decimal128.fromString(params.price)

    const sub = new Subscription({
      user_id: params.user_id,
      package_name: params.package_name,
      max_reservations_per_month: params.max_reservations_per_month,
      used_reservations: 0,
      price,
      created_at: now
    })

    const { insertedId } = await databaseService.subscriptions.insertOne(sub)
    const paymentDescription = RESERVATIONS_MESSAGE.SUBSCRIPTION_PAYMENT_DESCRIPTION.replace(
      '%s',
      insertedId.toString()
    )

    await walletService.paymentReservation(params.user_id.toString(), price, paymentDescription, insertedId)
    await subscriptionConfirmEmailQueue.add(
      'send-subscription-confirm-email',
      {
        user_id: sub.user_id.toString(),
        package_name: sub.package_name,
        max_reservations_per_month: sub.max_reservations_per_month?.toString() ?? null,
        price: sub.price.toString(),
        created_at: now
      },
      { jobId: `confirm-subscription-email-${insertedId.toString()}` }
    )
    console.log(`[Reservation] Enqueued email for ${insertedId.toString()}`)

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

  async getDetail(subscription: Subscription) {
    const user = await databaseService.users.findOne({ _id: subscription.user_id })
    if (!user) {
      throw new ErrorWithStatus({
        message: RESERVATIONS_MESSAGE.USER_NOT_FOUND.replace('%s', subscription.user_id.toString()),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const price = parseFloat(subscription.price.toString())
    return {
      subscription: {
        ...subscription,
        price,
        created_at: subscription.created_at,
        updated_at: subscription.updated_at
      },
      user: {
        fullname: user.fullname,
        email: user.email
      }
    }
  }

  async sendSuccessSubscribingEmail(data: any, toUser: User) {
    data.created_at = formatUTCDateToVietnamese(data.created_at)

    return await reservationsService.sendReservationEmailFormat(
      'success-subscription.html',
      RESERVATIONS_MESSAGE.EMAIL_SUBJECT_SUCCESS_SUBSCRIBING,
      data,
      toUser
    )
  }

  async getSubscriptionListPipeline(matchQuery: FilterQuery<Subscription>) {
    const pipeline: Document[] = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 1,
          user: {
            _id: '$userInfo._id',
            fullname: '$userInfo.fullname'
          },
          package_name: 1,
          activated_at: 1,
          expires_at: 1,
          max_reservations_per_month: 1,
          used_reservations: 1,
          price: { $toDouble: { $ifNull: ['$price', '0'] } },
          status: 1,
          created_at: 1,
          updated_at: 1
        }
      },
      {
        $sort: { created_at: -1 }
      }
    ]

    return pipeline
  }
}

const subscriptionService = new SubscriptionService()
export default subscriptionService
