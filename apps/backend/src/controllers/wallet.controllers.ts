import type { NextFunction, Request, Response } from 'express'

import type {
  CreateWithdrawlReqBody,
  DecreaseBalanceWalletReqBody,
  GetAllRefundReqQuery,
  GetTransactionReqQuery,
  GetWithdrawReqQuery,
  IncreareBalanceWalletReqBody,
  UpdateWithdrawStatusReqBody
} from '~/models/requests/wallets.requests'

import { WALLETS_MESSAGE, WITHDRAWLS_MESSAGE } from '~/constants/messages'
import walletService from '~/services/wallets.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { CreateRefundReqBody } from '~/models/requests/refunds.request'
import { TokenPayLoad } from '~/models/requests/users.requests'

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

export async function decreaseBalanceController(req: Request<any, any, DecreaseBalanceWalletReqBody>, res: Response) {
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

export async function getUserTransactionWalletController(
  req: Request<ParamsDictionary, any, any, GetTransactionReqQuery>,
  res: Response,
  next: NextFunction
) {
  const user = req.decoded_authorization
  const user_id = user?._id as string

  const query = req.query

  await walletService.getWalletHistory(res, next, query, user_id)
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

export async function refundController(req: Request<any, any, CreateRefundReqBody>, res: Response) {
  const user = req.decoded_authorization
  const user_id = user?._id as string

  const result = await walletService.refundTransaction(user_id, req.body)

  res.json({
    message: WALLETS_MESSAGE.CREATE_REFUND_SUCCESS,
    result
  })
}

export async function updateRefundController(req: Request<ParamsDictionary, any, any>, res: Response) {
  const { id } = req.params
  const newStatus = req.body.newStatus

  const result = await walletService.updateStatusRefund(id.toString(), newStatus)

  res.json({
    message: WALLETS_MESSAGE.UPDATE_REFUND_SUCCESS,
    result
  })
}

export async function createWithdrawalRequestController(
  req: Request<ParamsDictionary, any, CreateWithdrawlReqBody>,
  res: Response
) {
  const user = req.decoded_authorization
  const user_id = user?._id as string

  const result = await walletService.createWithdrawal(user_id, req.body)

  res.json({
    message: WALLETS_MESSAGE.CREATE_WITHDRAWL_SUCCESS,
    result
  })
}

export async function updateWithDrawStatusController(
  req: Request<ParamsDictionary, any, UpdateWithdrawStatusReqBody>,
  res: Response
) {
  const { id } = req.params

  const result = await walletService.updateWithDrawStatus(id, req.body)

  res.json({
    message: WITHDRAWLS_MESSAGE.UPDATE_SUCCESS.replace('%s', id),
    result
  })
}

export async function getWithDrawDetailController(req: Request<ParamsDictionary, any, any>, res: Response) {
  const { id } = req.params
  const { role, user_id } = req.decoded_authorization as TokenPayLoad

  const result = await walletService.getWithdrawRequestDetail(id, role, user_id)

  res.json({
    message: WITHDRAWLS_MESSAGE.GET_DETAIL_SUCCESS,
    result
  })
}

export async function getAllWithDrawController(
  req: Request<ParamsDictionary, any, any, GetWithdrawReqQuery>,
  res: Response,
  next: NextFunction
) {
  const query = req.query

  await walletService.getAllWithDrawRequest(res, next, query)
}

export async function getAllUserWithDrawController(
  req: Request<ParamsDictionary, any, any, GetWithdrawReqQuery>,
  res: Response,
  next: NextFunction
) {
  const query = req.query
  const { user_id } = req.decoded_authorization as TokenPayLoad

  await walletService.getAllUserWithDrawRequest(res, next, query, user_id)
}

export async function getAllRefundController(
  req: Request<ParamsDictionary, any, any, GetAllRefundReqQuery>,
  res: Response,
  next: NextFunction
) {
  const query = req.query

  await walletService.getAllRefund(res, next, query)
}

export async function getRefundDetailController(
  req: Request<ParamsDictionary, any, any, GetAllRefundReqQuery>,
  res: Response
) {
  const { role, user_id } = req.decoded_authorization as TokenPayLoad
  const { id } = req.params

  const result = await walletService.getRefundDetail(id, role, user_id)

  res.json({
    message: WALLETS_MESSAGE.REFUND_DETAIL_SUCCESS,
    result
  })
}
