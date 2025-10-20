import { accessTokenValidator, verifiedUserValidator } from './../middlewares/users.middlewares'
import { Router } from 'express'
import {
  cancelReservationController,
  confirmReservationController,
  dispatchSameStationController,
  getReservationHistoryController,
  getReservationListController,
  notifyExpiringReservationsController,
  reserveBikeController
} from '~/controllers/reservations.controllers'
import { isAdminValidator } from '~/middlewares/admin.middlewares'
import {
  batchDispatchSameStationValidator,
  cancelReservationValidator,
  confirmReservationValidator,
  reserveBikeValidator
} from '~/middlewares/reservations.middlewares'
import { wrapAsync } from '~/utils/handler'

const reserveRouter = Router()

reserveRouter
  .route('/notify/expiring')
  .post(wrapAsync(notifyExpiringReservationsController))

reserveRouter
  .route('/history')
  .get(accessTokenValidator, wrapAsync(getReservationHistoryController))

reserveRouter
  .route('/dispatch')
  .post(accessTokenValidator, isAdminValidator, batchDispatchSameStationValidator, wrapAsync(dispatchSameStationController))

reserveRouter
  .route('/')
  .get(accessTokenValidator, wrapAsync(getReservationListController))
  .post(accessTokenValidator, verifiedUserValidator, reserveBikeValidator, wrapAsync(reserveBikeController))

reserveRouter
  .route('/:id/confirm')
  .post(accessTokenValidator, confirmReservationValidator, wrapAsync(confirmReservationController))

reserveRouter
  .route('/:id/cancel')
  .post(accessTokenValidator, cancelReservationValidator, wrapAsync(cancelReservationController))
export default reserveRouter
