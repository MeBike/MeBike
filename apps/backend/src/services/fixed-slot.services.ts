import { ObjectId } from 'mongodb'
import { FixedSlotStatus, ReservationStatus } from '~/constants/enums'
import FixedSlotTemplate from '~/models/schemas/fixed-slot.schema'
import databaseService from './database.services'
import { getLocalTime } from '~/utils/date-time'

interface CreateFixedSlotTemplateParams {
  user_id: ObjectId
  station_id: ObjectId
  slot_start: string
  selected_dates: string[]
}

class FixedSlotTemplateService {
  async create(params: CreateFixedSlotTemplateParams) {
    const template = new FixedSlotTemplate({
      user_id: params.user_id,
      station_id: params.station_id,
      slot_start: params.slot_start,
      selected_dates: params.selected_dates,
      status: FixedSlotStatus.ACTIVE
    })

    const { insertedId } = await databaseService.fixedSlotTemplates.insertOne(template)
    return { ...template, _id: insertedId }
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
