import { Router } from 'express'

import {
  changeStatusController,
  decreaseBalanceController,
  increateBalanceController
} from '~/controllers/wallet.controllers'
import { isAdminValidator } from '~/middlewares/admin.middlewares'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { decreaseBalanceValidator, increaseBalanceValidator } from '~/middlewares/wallet.middlewares'
import { wrapAsync } from '~/utils/handler'

const walletsRouter = Router()

walletsRouter.get('/')
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
