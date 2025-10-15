import { Decimal128, Filter, ObjectId } from 'mongodb'

import type {
  CreateWithdrawlReqBody,
  DecreaseBalanceWalletReqBody,
  GetAllRefundReqQuery,
  GetTransactionReqQuery,
  GetWithdrawReqQuery,
  IncreareBalanceWalletReqBody,
  UpdateWithdrawStatusReqBody
} from '~/models/requests/wallets.requests'
import type { TransactionType } from '~/models/schemas/transaction.schema'
import type { WalletType } from '~/models/schemas/wallet.schemas'

import {
  RefundStatus,
  Role,
  TransactionStaus,
  TransactionTypeEnum,
  WalletStatus,
  WithDrawalStatus
} from '~/constants/enums'
import HTTP_STATUS from '~/constants/http-status'
import { USERS_MESSAGES, WALLETS_MESSAGE, WITHDRAWLS_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import Wallet from '~/models/schemas/wallet.schemas'

import databaseService from './database.services'
import Transaction from '~/models/schemas/transaction.schema'
import { sendPaginatedResponse } from '~/utils/pagination.helper'
import { NextFunction, Response } from 'express'
import { CreateRefundReqBody } from '~/models/requests/refunds.request'
import Refund, { RefundType } from '~/models/schemas/refund.schema'
import Withdraw, { WithdrawType } from '~/models/schemas/withdraw-request'

class WalletService {
  async createWallet(user_id: string) {
    const findWallet = await databaseService.wallets.findOne({ user_id: new ObjectId(user_id) })

    if (findWallet) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.USER_ALREADY_HAVE_WALLET.replace('%s', user_id),
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const walletID = new ObjectId()
    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

    const walletData: WalletType = {
      _id: walletID,
      user_id: new ObjectId(user_id),
      balance: Decimal128.fromString('0'),
      status: WalletStatus.Active,
      created_at: localTime,
      updated_at: localTime
    }

    const result = await databaseService.wallets.insertOne(new Wallet(walletData))

    return result
  }

  async increaseBalance({ user_id, payload }: { user_id: string; payload: IncreareBalanceWalletReqBody }) {
    const findWallet = await databaseService.wallets.findOne({ user_id: new ObjectId(user_id) })
    if (!findWallet) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.USER_NOT_HAVE_WALLET.replace('%s', user_id),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (!Object.values(TransactionTypeEnum).includes(payload.type)) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.TRANSACTION_TYPE_INVALID.replace('%s', payload.type),
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const amount = Number.parseFloat(payload.amount.toString())

    if (amount <= 0) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.AMOUNT_NEGATIVE,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const wallet = await databaseService.wallets.findOneAndUpdate(
      { _id: new ObjectId(findWallet._id) },
      { $inc: { balance: Decimal128.fromString(payload.amount.toString()) } },
      { returnDocument: 'after' }
    )

    const transactionID = new ObjectId()
    const transactionData: TransactionType = {
      _id: transactionID,
      wallet_id: new ObjectId(findWallet._id),
      amount: Decimal128.fromString(payload.amount.toString()),
      fee: Decimal128.fromString(payload.fee.toString()),
      description: payload.description,
      transaction_hash: payload.transaction_hash || '',
      type: TransactionTypeEnum.Deposit,
      status: TransactionStaus.Success
    }

    await databaseService.transactions.insertOne(transactionData)
    return wallet
  }

  async decreaseBalance({ user_id, payload }: { user_id: string; payload: DecreaseBalanceWalletReqBody }) {
    const findWallet = await databaseService.wallets.findOne({ user_id: new ObjectId(user_id) })
    if (!findWallet) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.USER_NOT_HAVE_WALLET.replace('%s', user_id),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (!Object.values(TransactionTypeEnum).includes(payload.type)) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.TRANSACTION_TYPE_INVALID.replace('%s', payload.type),
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const amount = Number.parseFloat(payload.amount.toString())
    if (amount <= 0) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.AMOUNT_NEGATIVE,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const currentBalance = Number.parseFloat(findWallet.balance.toString())
    if (currentBalance < amount) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.INSUFFICIENT_BALANCE.replace('%s', user_id),
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const wallet = await databaseService.wallets.findOneAndUpdate(
      { _id: new ObjectId(findWallet._id) },
      { $inc: { balance: Decimal128.fromString((-payload.amount).toString()) } },
      { returnDocument: 'after' }
    )

    const transactionID = new ObjectId()
    const transactionData: TransactionType = {
      _id: transactionID,
      wallet_id: new ObjectId(findWallet._id),
      amount: Decimal128.fromString(payload.amount.toString()),
      fee: Decimal128.fromString(payload.fee.toString()),
      description: payload.description,
      transaction_hash: payload.transaction_hash || '',
      type: TransactionTypeEnum.Deposit,
      status: TransactionStaus.Success
    }

    await databaseService.transactions.insertOne(transactionData)
    return wallet
  }

  async changeWalletStatus(user_id: string, newStatus: WalletStatus) {
    const result = await databaseService.wallets.findOneAndUpdate(
      { user_id: new ObjectId(user_id) },
      { $set: { status: newStatus } },
      { returnDocument: 'after' }
    )

    return result
  }

  async getUserWallet(user_id: string) {
    const result = await databaseService.wallets.findOne({ user_id: new ObjectId(user_id) })
    if (!result) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.USER_NOT_HAVE_WALLET.replace('%s', user_id),
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    return result
  }

  // lịch sử cộng trừ tiền của ví
  async getWalletHistory(res: Response, next: NextFunction, query: GetTransactionReqQuery, user_id: string) {
    try {
      const findWallet = await databaseService.wallets.findOne({ user_id: new ObjectId(user_id) })
      if (!findWallet) {
        throw new ErrorWithStatus({
          message: WALLETS_MESSAGE.USER_NOT_HAVE_WALLET.replace('%s', user_id),
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

      const filter: Filter<Transaction> = {
        wallet_id: new ObjectId(findWallet._id)
      }
      await sendPaginatedResponse(res, next, databaseService.transactions, query, filter)
    } catch (error) {
      next(error)
    }
  }

  async getTransactionDetail(user_id: string, transaction_id: string) {
    const findUser = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    if (!findUser) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const findWallet = await databaseService.wallets.findOne({ user_id: new ObjectId(user_id) })

    if (!findWallet && findUser.role !== Role.Admin) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.USER_NOT_HAVE_WALLET.replace('%s', user_id),
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    let transaction = null

    switch (findUser.role) {
      case Role.Admin:
        transaction = await databaseService.transactions.findOne({
          _id: new ObjectId(transaction_id)
        })
        break

      case Role.User:
        transaction = await databaseService.transactions.findOne({
          _id: new ObjectId(transaction_id),
          wallet_id: findWallet?._id
        })
        break

      default:
        throw new ErrorWithStatus({
          message: WALLETS_MESSAGE.FORBIDDEN,
          status: HTTP_STATUS.FORBIDDEN
        })
    }

    if (!transaction) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.TRANSACTION_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return transaction
  }

  async refundTransaction(user_id: string, payload: CreateRefundReqBody) {
    const findUser = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    if (!findUser) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const findTransaction = await databaseService.transactions.findOne({ _id: new ObjectId(payload.transaction_id) })
    if (!findTransaction) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.TRANSACTION_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const refundID = new ObjectId()
    const refundData: RefundType = {
      _id: refundID,
      user_id: new ObjectId(user_id),
      transaction_id: new ObjectId(findTransaction._id),
      amount: Decimal128.fromString(payload.amount.toString()),
      status: RefundStatus.Pending
    }

    const result = await databaseService.refunds.insertOne(new Refund(refundData))

    return result
  }

  async updateStatusRefund(refund_id: string, newStatus: string) {
    const allowedStatuses: Record<RefundStatus, RefundStatus[]> = {
      [RefundStatus.Pending]: [RefundStatus.Approved, RefundStatus.Rejected],
      [RefundStatus.Approved]: [RefundStatus.Completed],
      [RefundStatus.Completed]: [],
      [RefundStatus.Rejected]: []
    }

    const findRefund = await databaseService.refunds.findOne({ _id: new ObjectId(refund_id) })
    if (!findRefund) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.REFUND_NOT_FOUND.replace('%s', refund_id),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (!Object.values(RefundStatus).includes(newStatus as RefundStatus)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: WALLETS_MESSAGE.INVALID_NEW_STATUS
      })
    }

    const currentStatus = findRefund.status as RefundStatus
    const newStatusTyped = newStatus as RefundStatus

    if (!allowedStatuses[currentStatus]?.includes(newStatusTyped)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: WALLETS_MESSAGE.INVALID_NEW_STATUS
      })
    }

    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

    if (newStatusTyped === RefundStatus.Completed) {
      const user_id = findRefund.user_id
      const findWallet = await databaseService.wallets.findOne({ user_id: new ObjectId(user_id) })

      const transactionID = new ObjectId()
      const transactionData: TransactionType = {
        _id: transactionID,
        wallet_id: new ObjectId(findWallet?._id),
        amount: findRefund.amount,
        description: 'Refund',
        fee: Decimal128.fromString('0'),
        status: TransactionStaus.Success,
        transaction_hash: '',
        type: TransactionTypeEnum.Refund,
        created_at: localTime
      }

      await databaseService.transactions.insertOne(new Transaction(transactionData))
    }

    const updateData: any = {
      status: newStatusTyped,
      updated_at: localTime
    }

    const result = await databaseService.refunds.findOneAndUpdate(
      { _id: new ObjectId(refund_id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  }

  async createWithdrawal(user_id: string, payload: CreateWithdrawlReqBody) {
    const findUser = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    if (!findUser) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const findWallet = await databaseService.wallets.findOne({ user_id: new ObjectId(findUser._id) })
    if (!findWallet) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.USER_NOT_HAVE_WALLET,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (Decimal128.fromString(findWallet.balance.toString()) < Decimal128.fromString(payload.amount.toString())) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.INSUFFICIENT_BALANCE.replace('%s', user_id),
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

    const withdrawID = new ObjectId()
    const withdrawData: WithdrawType = {
      _id: withdrawID,
      user_id: new ObjectId(user_id),
      amount: Decimal128.fromString(payload.amount.toString()),
      account: payload.account,
      reason: '',
      note: payload.note || '',
      status: WithDrawalStatus.Pending,
      created_at: localTime,
      updated_at: localTime
    }

    const result = Promise.all([
      await databaseService.withdraws.insertOne(new Withdraw(withdrawData)),
      await databaseService.wallets.findOneAndUpdate(
        { _id: new ObjectId(findWallet._id) },
        { $inc: { balance: Decimal128.fromString((Number(payload.amount) * -1).toString()) } },
        { returnDocument: 'after' }
      )
    ])

    return result
  }

  async updateWithDrawStatus(withdrawID: string, payload: UpdateWithdrawStatusReqBody) {
    const allowedStatuses: Record<WithDrawalStatus, WithDrawalStatus[]> = {
      [WithDrawalStatus.Pending]: [WithDrawalStatus.Approved, WithDrawalStatus.Rejected],
      [RefundStatus.Approved]: [WithDrawalStatus.Completed],
      [RefundStatus.Completed]: [],
      [RefundStatus.Rejected]: []
    }

    const findWithDraw = await databaseService.withdraws.findOne({ _id: new ObjectId(withdrawID) })
    if (!findWithDraw) {
      throw new ErrorWithStatus({
        message: WITHDRAWLS_MESSAGE.WITHDRAWL_NOT_FOUND.replace('%s', withdrawID),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (!Object.values(WithDrawalStatus).includes(payload.newStatus as WithDrawalStatus)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: WALLETS_MESSAGE.INVALID_NEW_STATUS
      })
    }

    const currentStatus = findWithDraw.status as WithDrawalStatus
    const newStatusTyped = payload.newStatus as WithDrawalStatus

    if (!allowedStatuses[currentStatus]?.includes(newStatusTyped)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: WALLETS_MESSAGE.INVALID_NEW_STATUS
      })
    }

    if (newStatusTyped === WithDrawalStatus.Rejected) {
      if (!payload.newStatus || payload.newStatus.trim() === '') {
        throw new ErrorWithStatus({
          message: WITHDRAWLS_MESSAGE.REASON_IS_REQUIRED,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    if (newStatusTyped === WithDrawalStatus.Completed) {
      const user_id = findWithDraw.user_id
      const findWallet = await databaseService.wallets.findOne({ user_id: new ObjectId(user_id) })

      const currentDate = new Date()
      const vietnamTimezoneOffset = 7 * 60
      const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

      const transactionID = new ObjectId()
      const transactionData: TransactionType = {
        _id: transactionID,
        wallet_id: new ObjectId(findWallet?._id),
        amount: findWithDraw.amount,
        description: 'Withdrawal',
        fee: Decimal128.fromString('0'),
        status: TransactionStaus.Success,
        transaction_hash: '',
        type: TransactionTypeEnum.WithDrawal,
        created_at: localTime
      }

      await databaseService.transactions.insertOne(new Transaction(transactionData))
    }

    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

    const updateData: any = {
      status: newStatusTyped,
      reason: payload.reason || '',
      updated_at: localTime
    }

    const result = await databaseService.refunds.findOneAndUpdate(
      { _id: new ObjectId(withdrawID) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  }

  async getWithdrawRequestDetail(withdrawID: string, role: Role, user_id: string) {
    const result = await databaseService.withdraws.findOne({ _id: new ObjectId(withdrawID) })
    if (role !== Role.Admin) {
      if (result?.user_id.toString() !== user_id) {
        throw new ErrorWithStatus({
          message: WALLETS_MESSAGE.FORBIDDEN_WITHDRAW_ACCESS,
          status: HTTP_STATUS.FORBIDDEN
        })
      }
    }

    return result
  }

  async getAllWithDrawRequest(res: Response, next: NextFunction, query: GetWithdrawReqQuery) {
    const { status } = query

    const filter: any = {}

    if (status) {
      filter.status = status
    }

    await sendPaginatedResponse(res, next, databaseService.withdraws, query, filter)
  }

  async getAllUserWithDrawRequest(res: Response, next: NextFunction, query: GetWithdrawReqQuery, user_id: string) {
    const { status } = query

    const filter: any = {}

    if (status) {
      filter.status = status
    }
    filter.user_id = new ObjectId(user_id)

    await sendPaginatedResponse(res, next, databaseService.withdraws, query, filter)
  }

  async getAllRefund(res: Response, next: NextFunction, query: GetAllRefundReqQuery) {
    const { status } = query

    const filter: any = {}

    if (status) {
      filter.status = status
    }

    await sendPaginatedResponse(res, next, databaseService.refunds, query, filter)
  }

  async getAllUserRefund(res: Response, next: NextFunction, query: GetAllRefundReqQuery, user_id: string) {
    const { status } = query

    const filter: any = {}

    if (status) {
      filter.status = status
    }
    filter.user_id = new ObjectId(user_id)

    await sendPaginatedResponse(res, next, databaseService.refunds, query, filter)
  }

  async getRefundDetail(refund_id: string, role: Role, user_id: string) {
    const findRefund = await databaseService.refunds.findOne({ _id: new ObjectId(refund_id) })
    if (!findRefund) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.REFUND_NOT_FOUND.replace('%s', refund_id),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (role !== Role.Admin) {
      if (user_id !== findRefund._id.toString()) {
        throw new ErrorWithStatus({
          message: WALLETS_MESSAGE.FORBIDDEN_ACCESS,
          status: HTTP_STATUS.FORBIDDEN
        })
      }
    }

    return findRefund
  }
}

const walletService = new WalletService()
export default walletService
