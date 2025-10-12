import type { NextFunction, Request, Response } from 'express'

import type { GetTransactionReqQuery, IncreareBalanceWalletReqBody } from '~/models/requests/wallets.requests'

import { WALLETS_MESSAGE } from '~/constants/messages'
import walletService from '~/services/wallets.services'
import { ParamsDictionary } from 'express-serve-static-core'

export async function createWalletController(req: Request<any, any, any>, res: Response) {
  const user = req.decoded_authorization
  const user_id = user?._id as string

  const result = await walletService.createWallet(user_id)

  res.json({
    message: WALLETS_MESSAGE.CREATE_SUCCESS,
    result
  })
}

export async function increateBalanceController(req: Request<any, any, IncreareBalanceWalletReqBody>, res: Response) {
  const user = req.decoded_authorization
  const user_id = user?._id as string

  const result = await walletService.increaseBalance({ user_id, payload: req.body })

  res.json({
    message: WALLETS_MESSAGE.INCREASE_BALANCE_SUCCESS.replace('%s', `${req.body.amount}`).replace('%s', user_id),
    result
  })
}

export async function decreaseBalanceController(req: Request<any, any, IncreareBalanceWalletReqBody>, res: Response) {
  const user = req.decoded_authorization
  const user_id = user?._id as string

  const result = await walletService.decreaseBalance({ user_id, payload: req.body })

  res.json({
    message: WALLETS_MESSAGE.INCREASE_BALANCE_SUCCESS.replace('%s', `${req.body.amount}`).replace('%s', user_id),
    result
  })
}

export async function changeStatusController(req: Request<any, any, any>, res: Response) {
  const user = req.decoded_authorization
  const user_id = user?._id as string

  const result = await walletService.changeWalletStatus(user_id, req.body.newStatus)

  res.json({
    message: WALLETS_MESSAGE.CHANGE_STATUS_SUCCESS.replace('%s', user_id),
    result
  })
}

export async function getUserWalletController(req: Request<any, any, any>, res: Response) {
  const user = req.decoded_authorization
  const user_id = user?._id as string

  const result = await walletService.getUserWallet(user_id)

  res.json({
    message: WALLETS_MESSAGE.GET_USER_WALLET_SUCCESS.replace('%s', user_id),
    result
  })
}

export async function getUserTransactionController(
  req: Request<ParamsDictionary, any, any, GetTransactionReqQuery>,
  res: Response,
  next: NextFunction
) {
  const user = req.decoded_authorization
  const user_id = user?._id as string

  const query = req.query

  await walletService.getPaymentHistory(res, next, query, user_id)
}

export async function getTransactionDetailController(req: Request<any, any, any>, res: Response) {
  const user = req.decoded_authorization
  const user_id = user?._id as string

  const transaction_id = req.params.id as string

  const result = await walletService.getTransactionDetail(user_id, transaction_id)

  res.json({
    message: WALLETS_MESSAGE.TRANSACTION_DETAIL_SUCCESS,
    result
  })
}
