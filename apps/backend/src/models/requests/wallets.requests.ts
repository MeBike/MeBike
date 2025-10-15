import type { Decimal128 } from 'mongodb'

import type { TransactionTypeEnum, WithDrawalStatus } from '~/constants/enums'

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

export type CreateWithdrawlReqBody = {
  amount: number
  account: string
  note?: string
}

export type UpdateWithdrawStatusReqBody = {
  newStatus: WithDrawalStatus
  reason?: string
}

export type GetWithdrawReqQuery = {
  limit?: string
  page?: string
  status?: WithDrawalStatus
}
