import { NextFunction, Request, Response } from 'express'

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

import { WALLETS_MESSAGE, WITHDRAWLS_MESSAGE } from '~/constants/messages'
import walletService from '~/services/wallets.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { CreateRefundReqBody } from '~/models/requests/refunds.request'
import { TokenPayLoad } from '~/models/requests/users.requests'

export async function createWalletController(req: Request<any, any, any>, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad

  const result = await walletService.createWallet(user_id)

  res.json({
    message: WALLETS_MESSAGE.CREATE_SUCCESS,
    result
  })
}

export async function increateBalanceController(req: Request<any, any, IncreaseBalanceWalletReqBody>, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad

  const result = await walletService.increaseBalance({ payload: req.body })

  res.json({
    message: WALLETS_MESSAGE.INCREASE_BALANCE_SUCCESS.replace('%s', `${req.body.amount}`).replace('%s', user_id),
    result
  })
}

export async function decreaseBalanceController(req: Request<any, any, DecreaseBalanceWalletReqBody>, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad

  const result = await walletService.decreaseBalance({ payload: req.body })

  res.json({
    message: WALLETS_MESSAGE.DECRESE_BALANCE_SUCCESS.replace('%s', `${req.body.amount}`).replace('%s', user_id),
    result
  })
}

export async function changeStatusController(req: Request<ParamsDictionary, any, any>, res: Response) {
  const { id } = req.params
  console.log(id)

  const result = await walletService.changeWalletStatus(id, req.body.newStatus)

  res.json({
    message: WALLETS_MESSAGE.CHANGE_STATUS_SUCCESS.replace('%s', id),
    result
  })
}

export async function getUserWalletController(req: Request<any, any, any>, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad

  const result = await walletService.getUserWallet(user_id)

  res.json({
    message: WALLETS_MESSAGE.GET_USER_WALLET_SUCCESS.replace('%s', user_id),
    result
  })
}

export async function getWalletOverviewController(req: Request<any, any, any>, res: Response) {
  const result = await walletService.getWalletOverview()

  res.json({
    message: WALLETS_MESSAGE.GET_WALLET_OVERVIEW_SUCCESS,
    result
  })
}

export async function getUserTransactionController(
  req: Request<ParamsDictionary, any, any, GetTransactionReqQuery>,
  res: Response,
  next: NextFunction
) {
  const query = req.query

  await walletService.getUserTransaction(res, next, query)
}

export async function getUserWalletHistoryController(
  req: Request<ParamsDictionary, any, any, GetWalletReqQuery>,
  res: Response,
  next: NextFunction
) {
  const query = req.query

  await walletService.getUserWalletHistory(res, next, query)
}

export async function getUserWalletHistoryDetailController(
  req: Request<ParamsDictionary, any, any, GetTransactionReqQuery>,
  res: Response,
  next: NextFunction
) {
  const query = req.query
  const user_id = req.params.user_id

  await walletService.getWalletHistory(res, next, query, user_id)
}

export async function getUserTransactionWalletController(
  req: Request<ParamsDictionary, any, any, GetTransactionReqQuery>,
  res: Response,
  next: NextFunction
) {
  const { user_id } = req.decoded_authorization as TokenPayLoad

  const query = req.query

  await walletService.getWalletHistory(res, next, query, user_id)
}

export async function getTransactionDetailController(req: Request<any, any, any>, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad

  const transaction_id = req.params.id as string

  const result = await walletService.getTransactionDetail(user_id, transaction_id)

  res.json({
    message: WALLETS_MESSAGE.TRANSACTION_DETAIL_SUCCESS,
    result
  })
}

export async function refundController(req: Request<any, any, CreateRefundReqBody>, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad

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
  const { user_id } = req.decoded_authorization as TokenPayLoad

  const result = await walletService.createWithdrawal(user_id, req.body)

  res.json({
    message: WALLETS_MESSAGE.CREATE_WITHDRAWL_SUCCESS,
    result
  })
}

export async function updateWithdrawStatusController(
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

export async function getWithdrawDetailController(req: Request<ParamsDictionary, any, any>, res: Response) {
  const { id } = req.params
  const { user_id } = req.decoded_authorization as TokenPayLoad

  const result = await walletService.getWithdrawRequestDetail(id, user_id)

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

export async function getAllUserWithdrawController(
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

export async function getAllUserRefundController(
  req: Request<ParamsDictionary, any, any, GetAllRefundReqQuery>,
  res: Response,
  next: NextFunction
) {
  const { user_id } = req.decoded_authorization as TokenPayLoad
  const query = req.query

  await walletService.getAllUserRefund(res, next, query, user_id)
}

export async function getRefundDetailController(
  req: Request<ParamsDictionary, any, any, GetAllRefundReqQuery>,
  res: Response
) {
  const { user_id } = req.decoded_authorization as TokenPayLoad
  const { id } = req.params

  const result = await walletService.getRefundDetail(id, user_id)

  res.json({
    message: WALLETS_MESSAGE.REFUND_DETAIL_SUCCESS,
    result
  })
}
