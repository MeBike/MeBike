import type { Decimal128 } from 'mongodb'

import type { RefundStatus, TransactionTypeEnum, WalletStatus, WithDrawalStatus } from '~/constants/enums'

export type IncreaseBalanceWalletReqBody = {
  user_id: string
  amount: Decimal128 | number
  fee: Decimal128 | number
  description: string
  transaction_hash?: string
  message: string
}

export type DecreaseBalanceWalletReqBody = {
  user_id: string
  amount: Decimal128 | number
  fee: Decimal128 | number
  description: string
  transaction_hash?: string
  message: string
}

export type GetTransactionReqQuery = {
  limit?: string
  page?: string
  type?: TransactionTypeEnum,
  user_id?: string
}

export type GetWalletReqQuery = {
  limit?: string
  page?: string
  status?: WalletStatus,
  user_id?: string
}

export type CreateWithdrawlReqBody = {
  amount: Decimal128
  bank: string
  account: string
  account_owner: string
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

export type GetAllRefundReqQuery = {
  limit?: string
  page?: string
  status?: RefundStatus
}

export type UpdateRefundReqBody = {}
