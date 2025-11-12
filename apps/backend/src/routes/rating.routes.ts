import { Router } from 'express'
import {
  addNewRatingController,
  getRatingByIdController,
  getRatingController,
  getRatingReasonsController,
  getRatingDetailController
} from '~/controllers/ratings.controllers'

import { isAdminValidator } from '~/middlewares/admin.middlewares'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { createRatingValidator } from '~/middlewares/rating.middlewares'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { CreateRatingReqBody } from '~/models/requests/rating.requests'
import { wrapAsync } from '~/utils/handler'

const ratingRouter = Router()

ratingRouter.post(
  '/:rental_id',
  accessTokenValidator,
  createRatingValidator,
  filterMiddleware<CreateRatingReqBody>(['comment', 'rating', 'reason_ids']),
  wrapAsync(addNewRatingController)
)
// admin get all rating
ratingRouter.get('/', accessTokenValidator, isAdminValidator, wrapAsync(getRatingController))
ratingRouter.get('/rating-reasons', accessTokenValidator, wrapAsync(getRatingReasonsController))
/**
 * Description: Get detailed rating information by rating ID (Admin only)
 * Path: /ratings/detail/:rating_id
 * Method: GET
 * Params: { rating_id: string }
 * Headers: { Authorization: Bearer <access_token> }
 * Roles: ADMIN
 */
ratingRouter.get('/detail/:rating_id', accessTokenValidator, isAdminValidator, wrapAsync(getRatingDetailController))
ratingRouter.get('/:rental_id', accessTokenValidator, wrapAsync(getRatingByIdController))

export default ratingRouter
