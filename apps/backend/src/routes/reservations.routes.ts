import { accessTokenValidator, verifiedUserValidator } from './../middlewares/users.middlewares'
import { Router } from 'express'
import {
  cancelReservationController,
  confirmReservationController,
  dispatchSameStationController,
  getReservationHistoryController,
  getReservationListController,
  getReservationReportController,
  notifyExpiringReservationsController,
  reserveBikeController,
  staffConfirmReservationController
} from '~/controllers/reservations.controllers'
import { isAdminValidator } from '~/middlewares/admin.middlewares'
import {
  batchDispatchSameStationValidator,
  reserveBikeValidator,
  staffCancelReservationValidator,
  staffConfirmReservationValidator,
  userCancelReservationValidator,
  userConfirmReservationValidator
} from '~/middlewares/reservations.middlewares'
import { isStaffValidator } from '~/middlewares/staff.middlewares'
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
  .route('/stats')
  .get(accessTokenValidator, isAdminValidator, wrapAsync(getReservationReportController))

reserveRouter
  .route('/')
  .get(accessTokenValidator, wrapAsync(getReservationListController))
  .post(accessTokenValidator, verifiedUserValidator, reserveBikeValidator, wrapAsync(reserveBikeController))

reserveRouter
  .route('/:id/staff-confirm')
  .post(accessTokenValidator, isStaffValidator, staffConfirmReservationValidator, wrapAsync(staffConfirmReservationController))

reserveRouter
  .route('/:id/staff-cancel')
  .post(accessTokenValidator, isStaffValidator, staffCancelReservationValidator, wrapAsync(cancelReservationController))

reserveRouter
  .route('/:id/confirm')
  .post(accessTokenValidator, userConfirmReservationValidator, wrapAsync(confirmReservationController))

reserveRouter
  .route('/:id/cancel')
  .post(accessTokenValidator, userCancelReservationValidator, wrapAsync(cancelReservationController))
export default reserveRouter
