import { Decimal128, Filter, ObjectId } from 'mongodb'

import type {
  DecreaseBalanceWalletReqBody,
  GetTransactionReqQuery,
  IncreareBalanceWalletReqBody
} from '~/models/requests/wallets.requests'
import type { TransactionType } from '~/models/schemas/transaction.schema'
import type { WalletType } from '~/models/schemas/wallet.schemas'

import { Role, TransactionStaus, TransactionTypeEnum, WalletStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/http-status'
import { USERS_MESSAGES, WALLETS_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import Wallet from '~/models/schemas/wallet.schemas'

import databaseService from './database.services'
import Transaction from '~/models/schemas/transaction.schema'
import { sendPaginatedResponse } from '~/utils/pagination.helper'
import { NextFunction, Response } from 'express'

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

  async getPaymentHistory(res: Response, next: NextFunction, query: GetTransactionReqQuery, user_id: string) {
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
}

const walletService = new WalletService()
export default walletService
