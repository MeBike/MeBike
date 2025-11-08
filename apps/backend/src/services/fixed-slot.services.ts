// src/services/fixed-slot.service.ts
import { ObjectId } from 'mongodb'
import { FixedSlotStatus, ReservationStatus } from '~/constants/enums'
import FixedSlotTemplate from '~/models/schemas/fixed-slot.schema'
import databaseService from './database.services'
import { getLocalTime } from '~/utils/date-time'

interface CreateFixedSlotTemplateParams {
  user_id: ObjectId
  station_id: ObjectId
  slot_start: string
  slot_end: string
  days_of_week: number[]
  start_date: Date
  end_date: Date
}

class FixedSlotService {
  async createTemplate(params: CreateFixedSlotTemplateParams) {
    if (params.days_of_week.some((d) => d < 0 || d > 6)) {
      throw new Error('days_of_week chỉ từ 0 đến 6')
    }

    const template = new FixedSlotTemplate({
      user_id: params.user_id,
      station_id: params.station_id,
      slot_start: params.slot_start,
      slot_end: params.slot_end,
      days_of_week: params.days_of_week,
      start_date: params.start_date,
      end_date: params.end_date,
      status: FixedSlotStatus.ACTIVE
    })

    const { insertedId } = await databaseService.fixedSlotTemplates.insertOne(template)
    return { ...template, _id: insertedId }
  }

  async getActiveTemplatesForDate(date: Date) {
  return await databaseService.fixedSlotTemplates.find({
    status: FixedSlotStatus.ACTIVE,
    start_date: { $lte: date },
    end_date: { $gte: date }
  }).toArray()
}

  async getReservedBikeIdsAtTime(station_id: ObjectId, time: Date): Promise<ObjectId[]> {
    const reservations = await databaseService.reservations
      .find({
        station_id,
        start_time: { $lte: time },
        end_time: { $gt: time },
        status: ReservationStatus.Pending
      })
      .toArray()

    return reservations.map((r) => r.bike_id!).filter(Boolean)
  }
}

const fixedSlotService = new FixedSlotService()
export default fixedSlotService
