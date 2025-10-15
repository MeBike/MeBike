import { Router } from 'express'
import {
  createWithdrawalRequestController,
  getAllWithDrawController,
  getWithDrawDetailController,
  updateWithDrawStatusController
} from '~/controllers/wallet.controllers'

import { isAdminValidator } from '~/middlewares/admin.middlewares'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { CreateWithdrawlReqBody, UpdateWithdrawStatusReqBody } from '~/models/requests/wallets.requests'
import { wrapAsync } from '~/utils/handler'

const withdrawsRouter = Router()

withdrawsRouter.post(
  '/',
  accessTokenValidator,
  filterMiddleware<CreateWithdrawlReqBody>(['account', 'amount', 'note']),
  wrapAsync(createWithdrawalRequestController)
)

withdrawsRouter.get('/', accessTokenValidator, isAdminValidator, wrapAsync(getAllWithDrawController))
withdrawsRouter.get('/:id', accessTokenValidator, isAdminValidator, wrapAsync(getWithDrawDetailController))
withdrawsRouter.put(
  '/',
  accessTokenValidator,
  isAdminValidator,
  filterMiddleware<UpdateWithdrawStatusReqBody>(['newStatus', 'reason']),
  wrapAsync(updateWithDrawStatusController)
)

export default withdrawsRouter
