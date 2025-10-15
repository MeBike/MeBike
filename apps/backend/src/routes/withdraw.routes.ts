import { Router } from 'express'
import {
  createWithdrawalRequestController,
  getAllWithDrawController,
  getWithDrawDetailController,
  updateRefundController
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

withdrawsRouter.get('/', accessTokenValidator, isAdminValidator, wrapAsync(getAllWithDrawController))
withdrawsRouter.get('/:id', accessTokenValidator, wrapAsync(getWithDrawDetailController))
withdrawsRouter.put(
  '/:id',
  accessTokenValidator,
  isAdminValidator,
  updateWithdrawStatusValidator,
  filterMiddleware(['newStatus']),
  wrapAsync(updateRefundController)
)

export default withdrawsRouter
