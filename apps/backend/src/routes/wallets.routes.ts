import { Router } from 'express'

import {
  changeStatusController,
  decreaseBalanceController,
  getTransactionDetailController,
  getUserTransactionController,
  getUserTransactionWalletController,
  getUserWalletController,
  getUserWalletHistoryController,
  increateBalanceController
} from '~/controllers/wallet.controllers'
import { isAdminValidator } from '~/middlewares/admin.middlewares'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import {
  decreaseBalanceValidator,
  increaseBalanceValidator,
  updateWalletStatusValidator
} from '~/middlewares/wallet.middlewares'
import { DecreaseBalanceWalletReqBody, IncreaseBalanceWalletReqBody } from '~/models/requests/wallets.requests'
import { wrapAsync } from '~/utils/handler'

const walletsRouter = Router()

// lấy thông tin ví cho user
walletsRouter.get('/', accessTokenValidator, wrapAsync(getUserWalletController))
// lấy thông tin giao dịch của user cho admin
walletsRouter.get(
  '/manage-transactions',
  accessTokenValidator,
  isAdminValidator,
  wrapAsync(getUserTransactionController)
)
// lấy thông tin lịch sử ví cho admin
walletsRouter.get('/manage-wallet', accessTokenValidator, isAdminValidator, wrapAsync(getUserWalletHistoryController))
// lấy thông tin lịch sử ví của user cụ thể cho admin
walletsRouter.get('/manage-wallet/:user_id', accessTokenValidator, isAdminValidator, wrapAsync(getUserWalletHistoryController))
// lấy các thông tin transaction trong ví chưa có lịch sử rental của user (cộng tiền, rút tiền)
walletsRouter.get('/transaction', accessTokenValidator, wrapAsync(getUserTransactionWalletController))
walletsRouter.get('/transaction/:id', accessTokenValidator, wrapAsync(getTransactionDetailController))
walletsRouter.put(
  '/increase',
  accessTokenValidator,
  isAdminValidator,
  increaseBalanceValidator,
  filterMiddleware<IncreaseBalanceWalletReqBody>([
    'amount',
    'description',
    'fee',
    'message',
    'transaction_hash',
    'user_id'
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
    'user_id'
  ]),
  wrapAsync(decreaseBalanceController)
)
walletsRouter.patch(
  '/:id',
  accessTokenValidator,
  isAdminValidator,
  updateWalletStatusValidator,
  filterMiddleware(['newStatus']),
  wrapAsync(changeStatusController)
)

export default walletsRouter
