import { ObjectId } from 'mongodb'

export type RatingType = {
  _id?: ObjectId
  user_id: ObjectId
  rental_id: ObjectId
  rating: number
  reason_ids: ObjectId[]
  comment?: string
  created_at?: Date
  updated_at?: Date
}

export default class Rating {
  _id?: ObjectId
  user_id: ObjectId
  rental_id: ObjectId
  rating: number
  reason_ids: ObjectId[]
  comment?: string
  created_at?: Date
  updated_at?: Date

  constructor(rating: RatingType) {
    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

    this._id = rating._id || new ObjectId()
    this.user_id = rating.user_id
    this.rental_id = rating.rental_id
    this.rating = rating.rating
    this.reason_ids = rating.reason_ids || []
    this.comment = rating.comment || ''
    this.created_at = rating.created_at || localTime
    this.updated_at = rating.updated_at || localTime
  }
}
