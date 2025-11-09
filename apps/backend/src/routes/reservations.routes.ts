import { accessTokenValidator, verifiedUserValidator } from './../middlewares/users.middlewares'
import { Router } from 'express'
import {
  cancelReservationController,
  confirmReservationController,
  dispatchSameStationController,
  expireReservationsController,
  getReservationDetailController,
  getReservationHistoryController,
  getReservationListController,
  getReservationReportController,
  getStationReservationsController,
  notifyExpiringReservationsController,
  reserveBikeController,
  staffConfirmReservationController
} from '~/controllers/reservations.controllers'
import { isAdminAndStaffValidator, isAdminValidator } from '~/middlewares/admin.middlewares'
import {
  batchDispatchSameStationValidator,
  checkUserWalletBeforeReserve,
  filterByDateValidator,
  getReservationDetailValidator,
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
  .route('/mark-expired')
  .post(accessTokenValidator, isAdminValidator, wrapAsync(expireReservationsController))

reserveRouter
  .route('/stats')
  .get(accessTokenValidator, isAdminValidator, filterByDateValidator, wrapAsync(getReservationReportController))

reserveRouter
  .route('/')
  .get(accessTokenValidator, wrapAsync(getReservationListController))
  .post(accessTokenValidator, verifiedUserValidator, checkUserWalletBeforeReserve, reserveBikeValidator, wrapAsync(reserveBikeController))
  
reserveRouter
  .route('/:stationId/stats')
  .get(accessTokenValidator, isAdminAndStaffValidator, wrapAsync(getStationReservationsController))

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

reserveRouter
  .route('/:id')
  .get(accessTokenValidator, getReservationDetailValidator, wrapAsync(getReservationDetailController))

export default reserveRouter
