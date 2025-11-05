import { Router } from 'express'
import {
  createWithdrawalRequestController,
  getAllUserWithdrawController,
  getAllWithDrawController,
  getWithdrawDetailController,
  getWithdrawOverviewController,
  updateWithdrawStatusController
} from '~/controllers/wallet.controllers'

import { isAdminValidator } from '~/middlewares/admin.middlewares'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { createWithdrawRequestValidator, updateWithdrawStatusValidator } from '~/middlewares/withdraw.middlewares'
import { CreateWithdrawlReqBody } from '~/models/requests/wallets.requests'
import { wrapAsync } from '~/utils/handler'

const withdrawsRouter = Router()

withdrawsRouter.post(
  '/',
  accessTokenValidator,
  createWithdrawRequestValidator,
  filterMiddleware<CreateWithdrawlReqBody>(['account', 'account_owner', 'bank', 'amount', 'note']),
  wrapAsync(createWithdrawalRequestController)
)
// admin get all withdraw
withdrawsRouter.get('/manage-withdrawal', accessTokenValidator, isAdminValidator, wrapAsync(getAllWithDrawController))
// user get all withdraw
withdrawsRouter.get('/', accessTokenValidator, wrapAsync(getAllUserWithdrawController))
withdrawsRouter.get('/overview', accessTokenValidator, isAdminValidator,wrapAsync(getWithdrawOverviewController))
withdrawsRouter.get('/:id', accessTokenValidator, wrapAsync(getWithdrawDetailController))
withdrawsRouter.put(
  '/:id',
  accessTokenValidator,
  isAdminValidator,
  updateWithdrawStatusValidator,
  filterMiddleware(['newStatus']),
  wrapAsync(updateWithdrawStatusController)
)

export default withdrawsRouter
