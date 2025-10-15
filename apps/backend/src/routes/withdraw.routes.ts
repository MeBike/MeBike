import { Router } from 'express'
import {
  createWithdrawalRequestController,
  getAllUserWithDrawController,
  getAllWithDrawController,
  getWithDrawDetailController,
  updateWithDrawStatusController
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
  filterMiddleware<CreateWithdrawlReqBody>(['account', 'amount', 'note']),
  wrapAsync(createWithdrawalRequestController)
)
// admin get all withdraw
withdrawsRouter.get('/manage-withdrawal', accessTokenValidator, isAdminValidator, wrapAsync(getAllWithDrawController))
// user get all withdraw
withdrawsRouter.get('/', accessTokenValidator, wrapAsync(getAllUserWithDrawController))
withdrawsRouter.get('/:id', accessTokenValidator, wrapAsync(getWithDrawDetailController))
withdrawsRouter.put(
  '/:id',
  accessTokenValidator,
  isAdminValidator,
  updateWithdrawStatusValidator,
  filterMiddleware(['newStatus']),
  wrapAsync(updateWithDrawStatusController)
)

export default withdrawsRouter
