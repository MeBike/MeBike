import { Router } from 'express'
import {
  getAllRefundController,
  getAllUserRefundController,
  getRefundDetailController,
  refundController,
  updateRefundController
} from '~/controllers/wallet.controllers'

import { isAdminValidator } from '~/middlewares/admin.middlewares'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { createRefundRequestValidator, updateRefundStatusValidator } from '~/middlewares/refunds.middlewares'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { CreateRefundReqBody } from '~/models/requests/refunds.request'
import { wrapAsync } from '~/utils/handler'

const refundsRouter = Router()

refundsRouter.post(
  '/',
  accessTokenValidator,
  createRefundRequestValidator,
  filterMiddleware<CreateRefundReqBody>(['amount', 'transaction_id']),
  wrapAsync(refundController)
)

refundsRouter.get('/manage-refunds', accessTokenValidator, isAdminValidator, wrapAsync(getAllRefundController))
refundsRouter.get('/', accessTokenValidator, wrapAsync(getAllUserRefundController))
refundsRouter.get('/:id', accessTokenValidator, wrapAsync(getRefundDetailController))
refundsRouter.put(
  '/:id',
  accessTokenValidator,
  isAdminValidator,
  updateRefundStatusValidator,
  filterMiddleware(['newStatus']),
  wrapAsync(updateRefundController)
)

export default refundsRouter
