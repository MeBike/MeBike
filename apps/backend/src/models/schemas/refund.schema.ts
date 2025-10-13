import { Decimal128, ObjectId } from 'mongodb'
import { RefundStatus } from '~/constants/enums'

export type RefundType = {
  _id?: ObjectId
  transaction_id?: ObjectId
  user_id?: ObjectId
  amount: Decimal128
  status?: RefundStatus
  created_at?: Date
}

export default class Refund {
  _id?: ObjectId
  transaction_id?: ObjectId
  user_id?: ObjectId
  amount: Decimal128
  status: RefundStatus
  created_at?: Date

  constructor(refund: RefundType) {
    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

    this._id = refund._id || new ObjectId()
    this.transaction_id = refund.transaction_id
    this.user_id = refund.user_id
    this.amount = refund.amount || Decimal128.fromString('0')
    this.status = refund.status || RefundStatus.Pending
    this.created_at = refund.created_at || localTime
  }
}
