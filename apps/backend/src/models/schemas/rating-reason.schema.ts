import { ObjectId } from 'mongodb'
import { AppliesToEnum, RatingReasonTypeEnum } from '~/constants/enums'

type RatingReasonType = {
  _id?: ObjectId
  type: RatingReasonTypeEnum
  applies_to: AppliesToEnum
  messages: string
}

export default class RatingReason {
  _id?: ObjectId
  type: RatingReasonTypeEnum
  applies_to: AppliesToEnum
  messages: string

  constructor(ratingReason: RatingReasonType) {
    this._id = ratingReason._id || new ObjectId()
    this.type = ratingReason.type
    this.applies_to = ratingReason.applies_to
    this.messages = ratingReason.messages
  }
}
