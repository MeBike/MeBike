import { Decimal128, ObjectId } from 'mongodb'
import { WithDrawalStatus } from '~/constants/enums'

export type WithdrawType = {
  _id?: ObjectId
  user_id: ObjectId
  amount: Decimal128,
  bank: string,
  account_owner: string,
  account: string
  reason?: string
  note?: string
  status: WithDrawalStatus
  created_at?: Date
  updated_at?: Date
}

export default class Withdraw {
  _id?: ObjectId
  user_id: ObjectId
  amount: Decimal128
  bank: string
  account_owner: string
  account: string
  reason?: string
  note?: string
  status: WithDrawalStatus
  created_at?: Date
  updated_at?: Date

  constructor(withdraw: WithdrawType) {
    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

    this._id = withdraw._id || new ObjectId()
    this.user_id = withdraw.user_id
    this.reason = withdraw.reason
    this.note = withdraw.note || ''
    this.amount = Decimal128.fromString(withdraw.amount.toString())
    this.bank = withdraw.bank
    this.account_owner = withdraw.account_owner
    this.account = withdraw.account
    this.status = withdraw.status || WithDrawalStatus.Pending
    this.created_at = withdraw.created_at || localTime
    this.updated_at = withdraw.updated_at || localTime
  }
}
