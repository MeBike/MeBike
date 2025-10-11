import type { Decimal128 } from 'mongodb'

import type { TransactionTypeEnum } from '~/constants/enums'

export type IncreareBalanceWalletReqBody = {
  amount: Decimal128 | number
  type: TransactionTypeEnum
  fee: Decimal128 | number
  description: string
  transaction_hash?: string
  message: string
}

export type DecreaseBalanceWalletReqBody = {
  amount: Decimal128 | number
  type: TransactionTypeEnum
  fee: Decimal128 | number
  description: string
  transaction_hash?: string
  message: string
}

export type GetTransactionReqQuery = {
  limit?: string
  page?: string
}
