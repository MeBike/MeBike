import { ObjectId } from 'mongodb'
import { FixedSlotStatus } from '~/constants/enums'
import { getLocalTime } from '~/utils/date-time'

export type FixedSlotTemplateType = {
  _id?: ObjectId
  user_id: ObjectId
  station_id: ObjectId
  slot_start: string
  days_of_week: number[]
  status: FixedSlotStatus
  created_at?: Date
  updated_at?: Date
}

export default class FixedSlotTemplate {
  _id?: ObjectId
  user_id: ObjectId
  station_id: ObjectId
  slot_start: string
  days_of_week: number[]
  status: FixedSlotStatus
  created_at?: Date
  updated_at?: Date

  constructor(data: FixedSlotTemplateType) {
    const now = getLocalTime()
    this._id = data._id ?? new ObjectId()
    this.user_id = data.user_id
    this.station_id = data.station_id
    this.slot_start = data.slot_start
    this.days_of_week = data.days_of_week
    this.status = data.status ?? FixedSlotStatus.ACTIVE
    this.created_at = data.created_at ?? now
    this.updated_at = data.updated_at ?? now
  }
}