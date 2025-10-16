import type { Decimal128 } from 'mongodb'

export type CreateRefundReqBody = {
  transaction_id: string
  amount: Decimal128
}
