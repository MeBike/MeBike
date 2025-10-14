import { Router } from 'express'

import {
  changeStatusController,
  decreaseBalanceController,
  getTransactionDetailController,
  getUserTransactionController,
  getUserWalletController,
  increateBalanceController,
  refundController,
  updateRefundController
} from '~/controllers/wallet.controllers'
import { isAdminValidator } from '~/middlewares/admin.middlewares'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { decreaseBalanceValidator, increaseBalanceValidator } from '~/middlewares/wallet.middlewares'
import { CreateRefundReqBody } from '~/models/requests/refunds.request'
import { DecreaseBalanceWalletReqBody, IncreareBalanceWalletReqBody } from '~/models/requests/wallets.requests'
import { wrapAsync } from '~/utils/handler'

const walletsRouter = Router()

// lấy thông tin ví cho user
walletsRouter.get('/', accessTokenValidator, wrapAsync(getUserWalletController))
// lấy các thông tin transaction của user
walletsRouter.get('/transaction', accessTokenValidator, wrapAsync(getUserTransactionController))
walletsRouter.get('/transaction/:id', accessTokenValidator, wrapAsync(getTransactionDetailController))
walletsRouter.post(
  '/',
  accessTokenValidator,
  filterMiddleware<CreateRefundReqBody>(['amount', 'transaction_id']),
  wrapAsync(refundController)
)
walletsRouter.put(
  '/increase',
  accessTokenValidator,
  isAdminValidator,
  increaseBalanceValidator,
  filterMiddleware<IncreareBalanceWalletReqBody>([
    'amount',
    'description',
    'fee',
    'message',
    'transaction_hash',
    'type'
  ]),
  wrapAsync(increateBalanceController)
)
walletsRouter.put(
  '/decrease',
  accessTokenValidator,
  isAdminValidator,
  decreaseBalanceValidator,
  filterMiddleware<DecreaseBalanceWalletReqBody>([
    'amount',
    'description',
    'fee',
    'message',
    'transaction_hash',
    'type'
  ]),
  wrapAsync(decreaseBalanceController)
)
walletsRouter.put(
  '/:id',
  accessTokenValidator,
  isAdminValidator,
  filterMiddleware(['newStatus']),
  wrapAsync(updateRefundController)
)
walletsRouter.patch(
  '/',
  accessTokenValidator,
  isAdminValidator,
  filterMiddleware(['newStatus']),
  wrapAsync(changeStatusController)
)

export default walletsRouter
