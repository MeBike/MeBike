import { Decimal128, ObjectId } from 'mongodb'
import { FixedSlotStatus, ReservationOptions, ReservationStatus, SubscriptionStatus } from '~/constants/enums'
import FixedSlotTemplate from '~/models/schemas/fixed-slot.schema'
import databaseService from './database.services'
import { generateDateTimeWithTimeAndDate, getLocalTime } from '~/utils/date-time'
import Reservation from '~/models/schemas/reservation.schema'
import reservationsService from './reservations.services'

interface CreateFixedSlotTemplateParams {
  user_id: ObjectId
  station_id: ObjectId
  slot_start: string
  selected_dates: string[]
}

class FixedSlotTemplateService {
  async create(params: CreateFixedSlotTemplateParams) {
    const { user_id, station_id, slot_start, selected_dates } = params
    const templateId = new ObjectId()

    const template = new FixedSlotTemplate({
      _id: templateId,
      user_id,
      station_id,
      slot_start,
      selected_dates
    })
    const prepaid = Decimal128.fromString(process.env.PREPAID_VALUE ?? '2000')
    const sub = await databaseService.subscriptions.findOne({
      user_id,
      status: { $in: [SubscriptionStatus.PENDING, SubscriptionStatus.ACTIVE] }
    })

    let remainingUsages = 0
    let unlimited = false

    if (sub) {
      if (sub.max_usages == null) {
        unlimited = true
      } else {
        remainingUsages = sub.max_usages - sub.usage_count
      }
    }

    const usedCount = remainingUsages
    const reservations = params.selected_dates.map((date) => {
      const useSubscription = sub && (unlimited || remainingUsages > 0)
      if (!unlimited && useSubscription) remainingUsages--

      return new Reservation({
        user_id,
        station_id,
        start_time: generateDateTimeWithTimeAndDate(slot_start, date),
        prepaid: useSubscription ? Decimal128.fromString('0') : prepaid,
        reservation_option: ReservationOptions.FIXED_SLOT,
        fixed_slot_template_id: templateId,
        subscription_id: useSubscription ? sub._id : undefined
      })
    })

    const totalReservation = selected_dates.length
    const totalUsage = !unlimited ? (totalReservation <= usedCount ? totalReservation : usedCount) : totalReservation
    const totalPrepaid =
      totalUsage < totalReservation
        ? reservations.reduce((sum, r) => {
            return sum + Number(r.prepaid.toString())
          }, 0)
        : 0

    const canPay = totalPrepaid > 0 && reservationsService.isEnoughBalanceToPay(totalPrepaid, user_id)
    const session = databaseService.getClient().startSession()
    try {
      await session.withTransaction(async () => {
        await Promise.all([
          databaseService.fixedSlotTemplates.insertOne(template, { session }),
          databaseService.reservations.insertMany(reservations, { session })
        ])

        if (sub && totalUsage > 0) {
          await databaseService.subscriptions.updateOne(
            { _id: sub._id },
            { $inc: { usage_count: totalUsage }, $set: { updated_at: getLocalTime() } },
            { session }
          )
        }
      })
      if(canPay){
        // TODO: handle payment
      }
    } catch (error) {
      throw error
    } finally {
      await session.endSession()
    }
    return { ...template, _id: templateId }
  }

  async getDetail(template: FixedSlotTemplate) {
    const [user, station] = await Promise.all([
      databaseService.users.findOne({ _id: template.user_id }),
      databaseService.stations.findOne({ _id: template.station_id })
    ])

    return {
      ...template,
      user: { fullname: user?.fullname, email: user?.email },
      station_name: station?.name
    }
  }

  getListPipeline(match: any) {
    return [
      { $match: match },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'stations',
          localField: 'station_id',
          foreignField: '_id',
          as: 'station'
        }
      },
      { $unwind: { path: '$station', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          station_name: '$station.name',
          slot_start: 1,
          selected_dates: 1,
          status: 1,
          created_at: 1,
          user: { fullname: 1, email: 1 }
        }
      }
    ]
  }

  async update(template_id: ObjectId, updates: Partial<FixedSlotTemplate>) {
    const now = getLocalTime()
    const result = await databaseService.fixedSlotTemplates.findOneAndUpdate(
      { _id: template_id },
      { $set: { ...updates, updated_at: now } },
      { returnDocument: 'after' }
    )
    return result
  }

  async updateStatus(template_id: ObjectId, status: FixedSlotStatus) {
    const now = getLocalTime()
    const result = await databaseService.fixedSlotTemplates.findOneAndUpdate(
      { _id: template_id },
      { $set: { status, updated_at: now } },
      { returnDocument: 'after' }
    )
    return result
  }

  // Lấy tất cả template ACTIVE
  async getActiveTemplatesWithDetails() {
    const pipeline = [
      { $match: { status: FixedSlotStatus.ACTIVE } },
      {
        $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' }
      },
      { $unwind: '$user' },
      {
        $lookup: { from: 'stations', localField: 'station_id', foreignField: '_id', as: 'station' }
      },
      { $unwind: '$station' },
      {
        $project: {
          _id: 1,
          user_id: 1,
          station_id: 1,
          slot_start: 1,
          selected_dates: 1,
          'user.fullname': 1,
          'user.email': 1,
          'station.name': 1
        }
      }
    ]

    return await databaseService.fixedSlotTemplates.aggregate(pipeline).toArray()
  }

  // Lấy xe đã đặt trong ngày tại các trạm
  async getReservedBikeMapByStations(stationIds: string[], date: Date) {
    const startOfDay = new Date(date)
    const endOfDay = new Date(date)
    endOfDay.setUTCHours(23, 59, 59, 999)

    const reservations = await databaseService.reservations
      .find({
        station_id: { $in: stationIds.map((id) => new ObjectId(id)) },
        start_time: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: [ReservationStatus.Pending, ReservationStatus.Active] }
      })
      .toArray()

    const map = new Map<string, ObjectId[]>()

    for (const res of reservations) {
      const stationKey = res.station_id.toString()
      if (!map.has(stationKey)) map.set(stationKey, [])
      map.get(stationKey)!.push(res.bike_id!)
    }

    return map
  }
}

export const fixedSlotTemplateService = new FixedSlotTemplateService()
