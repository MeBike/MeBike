import { ClientSession, Decimal128, Filter, ObjectId } from 'mongodb'

import type {
  CreateWithdrawlReqBody,
  DecreaseBalanceWalletReqBody,
  GetAllRefundReqQuery,
  GetTransactionReqQuery,
  GetWalletReqQuery,
  GetWithdrawReqQuery,
  IncreaseBalanceWalletReqBody,
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
import { normalizeDecimal } from '~/utils/string'

class WalletService {
  async createWallet(user_id: string, session?: ClientSession) {
    const findWallet = await databaseService.wallets.findOne({ user_id: new ObjectId(user_id) }, { session })

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

    //nguyen them session vao insertOne
    const result = await databaseService.wallets.insertOne(new Wallet(walletData), { session })

    return result
  }

  async increaseBalance({ payload }: { payload: IncreaseBalanceWalletReqBody }) {
    const findWallet = await databaseService.wallets.findOne({ user_id: new ObjectId(payload.user_id) })
    if (!findWallet) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.USER_NOT_HAVE_WALLET.replace('%s', payload.user_id),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const amount = Number.parseFloat(payload.amount.toString())

    if (amount <= 0) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.AMOUNT_NEGATIVE,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const netChange = Number.parseFloat(payload.amount.toString()) - Number.parseFloat(payload.fee.toString())
    if (netChange <= 0) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.FEE_EXCEEDS_AMOUNT,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
    
    const wallet = await databaseService.wallets.findOneAndUpdate(
      { _id: new ObjectId(findWallet._id) },
      { $inc: { balance: Decimal128.fromString(netChange.toString()) } },
      { returnDocument: 'after' }
    )

    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

    const transactionID = new ObjectId()
    const transactionData: TransactionType = {
      _id: transactionID,
      wallet_id: new ObjectId(findWallet._id),
      amount: Decimal128.fromString(payload.amount.toString()),
      fee: Decimal128.fromString(payload.fee.toString()),
      description: payload.description,
      transaction_hash: payload.transaction_hash || '',
      type: TransactionTypeEnum.Deposit,
      status: TransactionStaus.Success,
      created_at: localTime
    }

    await databaseService.transactions.insertOne(transactionData)
    return wallet
  }

  async decreaseBalance({ payload }: { payload: DecreaseBalanceWalletReqBody }) {
    const findWallet = await databaseService.wallets.findOne({ user_id: new ObjectId(payload.user_id) })
    if (!findWallet) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.USER_NOT_HAVE_WALLET.replace('%s', payload.user_id),
        status: HTTP_STATUS.NOT_FOUND
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
        message: WALLETS_MESSAGE.INSUFFICIENT_BALANCE.replace('%s', payload.user_id),
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
      description: payload.description || 'Admin decrease balance',
      transaction_hash: payload.transaction_hash || '',
      type: TransactionTypeEnum.DECREASE,
      status: TransactionStaus.Success
    }

    await databaseService.transactions.insertOne(transactionData)
    return wallet
  }

  async changeWalletStatus(id: string, newStatus: WalletStatus) {
    const result = await databaseService.wallets.findOneAndUpdate(
      { _id: new ObjectId(id) },
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

  async getWalletOverview() {
    const result = await databaseService.wallets
      .aggregate([
        {
          $group: {
            _id: null,
            totalBalance: { $sum: '$balance' }
          }
        },
        {
          $lookup: {
            from: 'transactions',
            pipeline: [
              {
                $group: {
                  _id: null,
                  totalTransactions: { $sum: 1 },
                  totalDeposit: {
                    $sum: {
                      $cond: [{ $eq: ['$type', TransactionTypeEnum.Deposit] }, '$amount', 0]
                    }
                  },
                  totalDecrease: {
                    $sum: {
                      $cond: [{ $eq: ['$type', TransactionTypeEnum.DECREASE] }, '$amount', 0]
                    }
                  }
                }
              }
            ],
            as: 'transactionStats'
          }
        },
        {
          $unwind: {
            path: '$transactionStats',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 0,
            totalWallets: '$totalWallets',
            totalBalance: '$totalBalance',
            totalTransactions: { $ifNull: ['$transactionStats.totalTransactions', 0] },
            totalDeposit: { $ifNull: ['$transactionStats.totalDeposit', 0] },
            totalDecrease: { $ifNull: ['$transactionStats.totalDecrease', 0] }
          }
        }
      ])
      .toArray()

    return (
      result[0] || {
        totalWallets: 0,
        totalBalance: 0,
        totalTransactions: 0,
        totalDeposit: 0,
        totalDecrease: 0
      }
    )
  }

  async getRefundOverview() {
    const result = await databaseService.refunds
      .aggregate([
        {
          $facet: {
            totalCompleteAmount: [
              { $match: { status: RefundStatus.Completed } },
              { $group: { _id: null, total: { $sum: '$amount' } } }
            ],
            totalRefunds: [{ $count: 'total' }],
            totalCompleteRefund: [{ $match: { status: RefundStatus.Completed } }, { $count: 'total' }],
            totalApproveRefund: [{ $match: { status: RefundStatus.Approved } }, { $count: 'total' }],
            totalRejectRefund: [{ $match: { status: RefundStatus.Rejected } }, { $count: 'total' }],
            totalPendingRefund: [{ $match: { status: RefundStatus.Pending } }, { $count: 'total' }]
          }
        },
        {
          $project: {
            _id: 0,
            totalCompletedRefundAmount: {
              $ifNull: [{ $arrayElemAt: ['$totalCompleteAmount.total', 0] }, Decimal128.fromString('0')]
            },
            totalRefunds: {
              $ifNull: [{ $arrayElemAt: ['$totalRefunds.total', 0] }, 0]
            },
            totalCompleteRefund: {
              $ifNull: [{ $arrayElemAt: ['$totalCompleteRefund.total', 0] }, 0]
            },
            totalApproveRefund: {
              $ifNull: [{ $arrayElemAt: ['$totalApproveRefund.total', 0] }, 0]
            },
            totalRejectRefund: {
              $ifNull: [{ $arrayElemAt: ['$totalRejectRefund.total', 0] }, 0]
            },
            totalPendingRefund: {
              $ifNull: [{ $arrayElemAt: ['$totalPendingRefund.total', 0] }, 0]
            }
          }
        }
      ])
      .toArray()

    return (
      result[0] || {
        totalCompletedRefundAmount: Decimal128.fromString('0'),
        totalRefunds: 0,
        totalCompleteRefund: 0,
        totalApproveRefund: 0,
        totalRejectRefund: 0,
        totalPendingRefund: 0
      }
    )
  }

  async getWithdrawOverview() {
    const result = await databaseService.withdraws
      .aggregate([
        {
          $facet: {
            totalCompletedWithdrawAmount: [
              { $match: { status: WithDrawalStatus.Completed } },
              { $group: { _id: null, total: { $sum: '$amount' } } }
            ],
            totalWithdraw: [{ $count: 'total' }],
            totalCompleteWithdraw: [{ $match: { status: WithDrawalStatus.Completed } }, { $count: 'total' }],
            totalApproveWithdraw: [{ $match: { status: WithDrawalStatus.Approved } }, { $count: 'total' }],
            totalRejectWithdraw: [{ $match: { status: WithDrawalStatus.Rejected } }, { $count: 'total' }],
            totalPendingWithdraw: [{ $match: { status: WithDrawalStatus.Pending } }, { $count: 'total' }]
          }
        },
        {
          $project: {
            _id: 0,
            totalCompletedWithdrawAmount: {
              $ifNull: [{ $arrayElemAt: ['$totalCompletedWithdrawAmount.total', 0] }, Decimal128.fromString('0')]
            },
            totalWithdraw: {
              $ifNull: [{ $arrayElemAt: ['$totalWithdraw.total', 0] }, 0]
            },
            totalCompleteWithdraw: {
              $ifNull: [{ $arrayElemAt: ['$totalCompleteWithdraw.total', 0] }, 0]
            },
            totalApproveWithdraw: {
              $ifNull: [{ $arrayElemAt: ['$totalApproveWithdraw.total', 0] }, 0]
            },
            totalRejectWithdraw: {
              $ifNull: [{ $arrayElemAt: ['$totalRejectWithdraw.total', 0] }, 0]
            },
            totalPendingWithdraw: {
              $ifNull: [{ $arrayElemAt: ['$totalPendingWithdraw.total', 0] }, 0]
            }
          }
        }
      ])
      .toArray()

    return (
      result[0] || {
        totalCompletedWithdrawAmount: Decimal128.fromString('0'),
        totalWithdraw: 0,
        totalCompleteWithdraw: 0,
        totalApproveWithdraw: 0,
        totalRejectWithdraw: 0,
        totalPendingWithdraw: 0
      }
    )
  }

  async getUserTransaction(res: Response, next: NextFunction, query: GetTransactionReqQuery) {
    const filter: Filter<Transaction> = {}
    if (query.type) {
      filter.type = query.type
    }

    if (query.user_id) {
      const findWallet = await databaseService.wallets.findOne({
        user_id: new ObjectId(query.user_id)
      })
      if (!findWallet) {
        throw new ErrorWithStatus({
          message: WALLETS_MESSAGE.USER_NOT_HAVE_WALLET.replace('%s', query.user_id),
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

      filter.wallet_id = new ObjectId(findWallet._id)
    }

    await sendPaginatedResponse(res, next, databaseService.transactions, query, filter)
  }

  async getUserWalletHistory(res: Response, next: NextFunction, query: GetWalletReqQuery) {
    try {
      const page = Number.parseInt(query.page as string) || 1
      const limit = Number.parseInt(query.limit as string) || 10
      const skip = (page - 1) * limit

      const filter: Filter<Wallet> = {}
      if (query.status) {
        filter.status = query.status
      }
      if (query.user_id) {
        filter.user_id = new ObjectId(query.user_id)
      }
      if (query.wallet_id) {
        filter._id = new ObjectId(query.wallet_id)
      }

      const aggregationPipeline: any[] = [
        { $match: filter },
        { $sort: { created_at: -1 } },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_info'
          }
        },
        {
          $unwind: {
            path: '$user_info',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            fullname: { $ifNull: ['$user_info.fullname', 'Unknown User'] }
          }
        }
      ]

      if (query.email) {
        aggregationPipeline.push({
          $match: {
            email: { $regex: query.email, $options: 'i' }
          }
        })
      }
      aggregationPipeline.push(
        {
          $project: {
            user_info: 0
          }
        },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            totalCount: [{ $count: 'count' }]
          }
        }
      )

      const result = await databaseService.wallets.aggregate(aggregationPipeline).toArray()

      const data = result[0]?.data || []
      const totalRecords = result[0]?.totalCount[0]?.count || 0

      const normalized = data.map(normalizeDecimal)
      const totalPages = Math.ceil(totalRecords / limit)

      const response = {
        data: normalized,
        pagination: {
          limit,
          currentPage: page,
          totalPages,
          totalRecords
        }
      }

      return res.status(200).json(response)
    } catch (error) {
      next(error)
    }
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
      if (query.type) {
        filter.type = query.type
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

    const existingRefund = await databaseService.refunds.findOne({
      transaction_id: new ObjectId(findTransaction._id)
    })
    if (existingRefund) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.REFUND_ALREADY_REQUESTED.replace('%s', payload.transaction_id),
        status: HTTP_STATUS.BAD_REQUEST
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
      bank: payload.bank,
      account_owner: payload.account_owner,
      reason: '',
      note: payload.note || '',
      status: WithDrawalStatus.Pending,
      created_at: localTime,
      updated_at: localTime
    }

    const result = Promise.all([await databaseService.withdraws.insertOne(new Withdraw(withdrawData))])

    return result
  }

  async updateWithDrawStatus(withdrawID: string, payload: UpdateWithdrawStatusReqBody) {
    const allowedStatuses: Record<WithDrawalStatus, WithDrawalStatus[]> = {
      [WithDrawalStatus.Pending]: [WithDrawalStatus.Approved, WithDrawalStatus.Rejected],
      [WithDrawalStatus.Approved]: [WithDrawalStatus.Completed],
      [WithDrawalStatus.Completed]: [],
      [WithDrawalStatus.Rejected]: []
    }

    const findWithDraw = await databaseService.withdraws.findOne({ _id: new ObjectId(withdrawID) })
    if (!findWithDraw) {
      throw new ErrorWithStatus({
        message: WITHDRAWLS_MESSAGE.WITHDRAWL_NOT_FOUND.replace('%s', withdrawID),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const user_id = findWithDraw.user_id
    const findWallet = await databaseService.wallets.findOne({ user_id: new ObjectId(user_id) })
    if (!findWallet) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.USER_NOT_HAVE_WALLET.replace('%s', user_id.toString()),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (findWallet.status === WalletStatus.Frozen) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.WALLET_HAS_BEEN_FROZEN,
        status: HTTP_STATUS.BAD_REQUEST
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
      if (!payload.reason || payload.reason.trim() === '') {
        throw new ErrorWithStatus({
          message: WITHDRAWLS_MESSAGE.REASON_IS_REQUIRED,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    }

    if (newStatusTyped === WithDrawalStatus.Completed) {
      const currentDate = new Date()
      const vietnamTimezoneOffset = 7 * 60
      const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

      await databaseService.wallets.findOneAndUpdate(
        { _id: findWallet?._id },
        { $inc: { balance: Decimal128.fromString((-findWithDraw.amount).toString()) } },
        { returnDocument: 'after' }
      )

      const transactionID = new ObjectId()
      const transactionData: TransactionType = {
        _id: transactionID,
        wallet_id: findWallet?._id,
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

    const result = await databaseService.withdraws.findOneAndUpdate(
      { _id: new ObjectId(withdrawID) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  }

  async getWithdrawRequestDetail(withdrawID: string, user_id: string) {
    const findUser = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    if (!findUser) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const [result] = await databaseService.withdraws
      .aggregate([
        {
          $match: { _id: new ObjectId(withdrawID) }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_info'
          }
        },
        {
          $unwind: '$user_info'
        },
        {
          $project: {
            'user_info.password': 0,
            'user_info.email_verify_otp': 0,
            'user_info.email_verify_otp_expires': 0,
            'user_info.forgot_password_otp': 0,
            'user_info.forgot_password_otp_expires': 0,
            'user_info.nfc_card_uid': 0
          }
        }
      ])
      .toArray()

    if (!result) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.WITHDRAW_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (findUser.role !== Role.Admin) {
      if (result.user_id.toString() !== user_id) {
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

  async getRefundDetail(refund_id: string, user_id: string) {
    const findUser = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    if (!findUser) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const [findRefund] = await databaseService.refunds
      .aggregate([
        {
          $match: { _id: new ObjectId(refund_id) }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_info'
          }
        },
        {
          $unwind: {
            path: '$user_info',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            'user_info.password': 0,
            'user_info.email_verify_otp': 0,
            'user_info.email_verify_otp_expires': 0,
            'user_info.forgot_password_otp': 0,
            'user_info.forgot_password_otp_expires': 0,
            'user_info.nfc_card_uid': 0
          }
        }
      ])
      .toArray()

    if (!findRefund) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.REFUND_NOT_FOUND.replace('%s', refund_id),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (findUser.role !== Role.Admin) {
      if (user_id !== findRefund.user_id.toString()) {
        throw new ErrorWithStatus({
          message: WALLETS_MESSAGE.FORBIDDEN_ACCESS,
          status: HTTP_STATUS.FORBIDDEN
        })
      }
    }

    return findRefund
  }

  async paymentRental(user_id: string, amount: Decimal128, description: string, rental_id: ObjectId) {
    const findWallet = await databaseService.wallets.findOne({ user_id: new ObjectId(user_id) })
    if (!findWallet) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.USER_NOT_HAVE_WALLET.replace('%s', user_id),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const currentBalance = Number.parseFloat(findWallet.balance.toString())
    const amountNumber = Number.parseFloat(amount.toString())
    if (currentBalance < amountNumber) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.INSUFFICIENT_BALANCE.replace('%s', user_id),
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const wallet = await databaseService.wallets.findOneAndUpdate(
      { _id: new ObjectId(findWallet._id) },
      { $inc: { balance: Decimal128.fromString((-amountNumber).toString()) } },
      { returnDocument: 'after' }
    )
    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

    const transactionID = new ObjectId()
    const transactionData: TransactionType = {
      _id: transactionID,
      wallet_id: new ObjectId(findWallet._id),
      rental_id: rental_id,
      amount: Decimal128.fromString(amountNumber.toString()),
      fee: Decimal128.fromString('0'),
      description: description,
      transaction_hash: '',
      type: TransactionTypeEnum.PAYMENT,
      status: TransactionStaus.Success,
      created_at: localTime
    }

    await databaseService.transactions.insertOne(transactionData)
    return wallet
  }

  async paymentReservation(user_id: string, amount: Decimal128, description: string, rental_id: ObjectId) {
    const findWallet = await databaseService.wallets.findOne({ user_id: new ObjectId(user_id) })
    if (!findWallet) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.USER_NOT_HAVE_WALLET.replace('%s', user_id),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const currentBalance = Number.parseFloat(findWallet.balance.toString())
    const amountNumber = Number.parseFloat(amount.toString())
    if (currentBalance < amountNumber) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.INSUFFICIENT_BALANCE.replace('%s', user_id),
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const wallet = await databaseService.wallets.findOneAndUpdate(
      { _id: new ObjectId(findWallet._id) },
      { $inc: { balance: Decimal128.fromString((-amountNumber).toString()) } },
      { returnDocument: 'after' }
    )

    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

    const transactionID = new ObjectId()
    const transactionData: TransactionType = {
      _id: transactionID,
      wallet_id: new ObjectId(findWallet._id),
      rental_id: rental_id,
      amount: Decimal128.fromString(amountNumber.toString()),
      fee: Decimal128.fromString('0'),
      description: description,
      transaction_hash: '',
      type: TransactionTypeEnum.RESERVATION,
      status: TransactionStaus.Success,
      created_at: localTime
    }

    await databaseService.transactions.insertOne(transactionData)
    return wallet
  }

  async refundReservation(user_id: string, amount: Decimal128, description: string, rental_id: ObjectId) {
    const findWallet = await databaseService.wallets.findOne({ user_id: new ObjectId(user_id) })
    if (!findWallet) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.USER_NOT_HAVE_WALLET.replace('%s', user_id),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const wallet = await databaseService.wallets.findOneAndUpdate(
      { _id: new ObjectId(findWallet._id) },
      { $inc: { balance: amount } },
      { returnDocument: 'after' }
    )

    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

    const transactionID = new ObjectId()
    const transactionData: TransactionType = {
      _id: transactionID,
      wallet_id: new ObjectId(findWallet._id),
      rental_id: rental_id,
      amount: Decimal128.fromString(amount.toString()),
      fee: Decimal128.fromString('0'),
      description: description,
      transaction_hash: '',
      type: TransactionTypeEnum.Refund,
      status: TransactionStaus.Success,
      created_at: localTime
    }

    await databaseService.transactions.insertOne(transactionData)
    return wallet
  }
}

const walletService = new WalletService()
export default walletService
