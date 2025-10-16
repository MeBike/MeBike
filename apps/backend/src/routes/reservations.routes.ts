import { accessTokenValidator } from './../middlewares/users.middlewares'
import { Router } from 'express'
import { cancelReservationController, getReservationListController, reserveBikeController } from '~/controllers/reservations.controllers'
import { cancelReservationValidator, reserveBikeValidator } from '~/middlewares/reservations.middlewares'
import { wrapAsync } from '~/utils/handler'

const reserveRouter = Router()

reserveRouter
  .route('/')
  .get(accessTokenValidator, wrapAsync(getReservationListController))
  .post(accessTokenValidator, reserveBikeValidator, wrapAsync(reserveBikeController))

  reserveRouter.route('/:id/cancel')
  .post(accessTokenValidator, cancelReservationValidator, wrapAsync(cancelReservationController))
export default reserveRouter
