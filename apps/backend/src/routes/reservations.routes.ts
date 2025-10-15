import { accessTokenValidator } from './../middlewares/users.middlewares'
import { Router } from 'express'
import { getReservationListController, reserveBikeController } from '~/controllers/reservations.controllers'
import { reserveBikeValidator } from '~/middlewares/reservations.middlewares'
import { wrapAsync } from '~/utils/handler'

const reserveRouter = Router()

reserveRouter
  .route('/')
  .get(accessTokenValidator, wrapAsync(getReservationListController))
  .post(accessTokenValidator, reserveBikeValidator, wrapAsync(reserveBikeController))

export default reserveRouter
