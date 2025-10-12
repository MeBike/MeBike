import { Router } from 'express'

import {
  changeStatusController,
  decreaseBalanceController,
  getTransactionDetailController,
  getUserTransactionController,
  getUserWalletController,
  increateBalanceController
} from '~/controllers/wallet.controllers'
import { isAdminValidator } from '~/middlewares/admin.middlewares'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { decreaseBalanceValidator, increaseBalanceValidator } from '~/middlewares/wallet.middlewares'
import { wrapAsync } from '~/utils/handler'

const walletsRouter = Router()

// lấy thông tin ví cho user
walletsRouter.get('/', accessTokenValidator, wrapAsync(getUserWalletController))
// lấy các thông tin transaction của user
walletsRouter.get('/transaction', accessTokenValidator, wrapAsync(getUserTransactionController))
walletsRouter.get('/transaction/:id', accessTokenValidator, wrapAsync(getTransactionDetailController))
walletsRouter.put(
  '/increase',
  accessTokenValidator,
  isAdminValidator,
  increaseBalanceValidator,
  wrapAsync(increateBalanceController)
)
walletsRouter.put(
  '/decrease',
  accessTokenValidator,
  isAdminValidator,
  decreaseBalanceValidator,
  wrapAsync(decreaseBalanceController)
)
walletsRouter.patch('/', accessTokenValidator, isAdminValidator, wrapAsync(changeStatusController))

export default walletsRouter
