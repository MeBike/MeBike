// src/services/subscription.service.ts
import { Decimal128, ObjectId } from 'mongodb'
import { getLocalTime } from '~/utils/date-time'
import databaseService from './database.services'
import Subscription from '~/models/schemas/subscription.schema'
import { SubscriptionStatus } from '~/constants/enums'

interface CreateSubscriptionParams {
  user_id: ObjectId
  package_name: string
  start_date: Date
  end_date: Date
  price: string | Decimal128
  max_reservations?: number | null
}

class SubscriptionService {
  async create(params: CreateSubscriptionParams) {
    const sub = new Subscription({
      user_id: params.user_id,
      package_name: params.package_name,
      start_date: params.start_date,
      end_date: params.end_date,
      max_reservations_per_month: params.max_reservations,
      used_reservations: 0,
      price: params.price instanceof Decimal128 ? params.price : Decimal128.fromString(params.price)
    })

    await databaseService.subscriptions.insertOne(sub)
    return sub
  }

  async useOne(subscription_id: ObjectId) {
    const sub = await databaseService.subscriptions.findOne({ _id: subscription_id, status: SubscriptionStatus.ACTIVE })
    if (!sub) throw new Error('Gói tháng không tồn tại hoặc đã hết hạn')

    const now = getLocalTime()
    if (now > sub.end_date) throw new Error('Gói tháng đã hết hạn')

    if (sub.max_reservations_per_month != null && sub.used_reservations >= sub.max_reservations_per_month) {
      throw new Error('Đã dùng hết số lần đặt trong tháng')
    }

    await databaseService.subscriptions.updateOne(
      { _id: subscription_id },
      { $inc: { used_reservations: 1 }, $set: { updated_at: now } }
    )
  }

  async getActiveByUser(user_id: ObjectId) {
    const now = getLocalTime()
    return await databaseService.subscriptions.findOne({
      user_id,
      status: SubscriptionStatus.ACTIVE,
      start_date: { $lte: now },
      end_date: { $gte: now }
    })
  }
}

const subscriptionService = new SubscriptionService()
export default subscriptionService
