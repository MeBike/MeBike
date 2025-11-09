import { ObjectId } from 'mongodb'
import { FixedSlotStatus } from '~/constants/enums'
import { getLocalTime } from '~/utils/date-time'

export type FixedSlotTemplateType = {
  _id?: ObjectId
  user_id: ObjectId
  station_id: ObjectId
  slot_start: string // "08:00"
  slot_end: string   // "09:00"
  days_of_week: number[] // [1,3,5]
  start_date: Date
  end_date: Date
  status: FixedSlotStatus
  created_at?: Date
  updated_at?: Date
}

export default class FixedSlotTemplate {
  _id?: ObjectId
  user_id: ObjectId
  station_id: ObjectId
  slot_start: string
  slot_end: string
  days_of_week: number[]
  start_date: Date
  end_date: Date
  status: FixedSlotStatus
  created_at?: Date
  updated_at?: Date

  constructor(data: FixedSlotTemplateType) {
    const now = getLocalTime()
    this._id = data._id || new ObjectId()
    this.user_id = data.user_id
    this.station_id = data.station_id
    this.slot_start = data.slot_start
    this.slot_end = data.slot_end
    this.days_of_week = data.days_of_week
    this.start_date = data.start_date
    this.end_date = data.end_date
    this.status = data.status ?? FixedSlotStatus.ACTIVE
    this.created_at = data.created_at || now
    this.updated_at = data.updated_at || now
  }
}