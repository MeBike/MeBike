import { ObjectId } from 'mongodb'
import { getLocalTime } from '~/utils/date-time'

type RentalLogType = {
  _id?: ObjectId
  rental_id: ObjectId
  user_id: ObjectId
  changes?: Object
  reason?: string
  created_at?: Date
}

export default class RentalLog {
  _id?: ObjectId
  rental_id: ObjectId
  user_id: ObjectId
  changes: Object
  reason?: string
  created_at?: Date

  constructor(log: RentalLogType) {
    const localTime = getLocalTime()

    this._id = log._id || new ObjectId()
    this.rental_id = log.rental_id
    this.user_id = log.user_id
    this.changes = log.changes ?? {}
    this.reason = log.reason ?? ''
    this.created_at = log.created_at || localTime
  }
}
