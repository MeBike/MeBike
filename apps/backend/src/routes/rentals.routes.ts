import { accessTokenValidator, checkUserExist, checkUserExistWithPhoneNumber, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { Router } from 'express'

import {
  cancelRentalController,
  createRentalFromCardController,
  createRentalSessionController,
  endRentalByAdminOrStaffController,
  endRentalSessionController,
  getActiveRentalListByPhoneNumberController,
  getDashboardSummaryController,
  getDetailRentalController,
  getMyCurrentRentalsController,
  getMyDetailRentalController,
  getMyRentalsController,
  getRentalListByUserIdController,
  getRentalListController,
  getRentalRevenueController,
  getRentalSummaryController,
  getReservationsStatisticController,
  getStationActivityController,
  updateDetailRentalController
} from '~/controllers/rentals.controllers'
import { isAdminAndStaffValidator, isAdminValidator } from '~/middlewares/admin.middlewares'
import {
  cancelRentalValidator,
  checkUserWalletBeforeRent,
  createRentalSessionByStaffValidator,
  createRentalSessionValidator,
  endRentalByAdminOrStaffValidator,
  endRentalSessionValidator,
  updateDetailRentalValidator
} from '~/middlewares/rentals.middlewares'
import { cardTapApiKeyValidator } from '~/middlewares/card-tap.middlewares'
import { wrapAsync } from '~/utils/handler'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { CancelRentalReqBody, CreateRentalByStaffReqBody, CreateRentalReqBody, EndRentalByAdminOrStaffReqBody, UpdateRentalReqBody } from '~/models/requests/rentals.requests'
import { isStaffValidator } from '~/middlewares/staff.middlewares'

const rentalsRouter = Router()

rentalsRouter
  .route('/staff-create')
  .post(
    accessTokenValidator,
    isStaffValidator,
    filterMiddleware<CreateRentalByStaffReqBody>(['bike_id', 'user_id']),
    createRentalSessionByStaffValidator,
    wrapAsync(createRentalSessionController)
  )

rentalsRouter.route('/dashboard-summary').get(accessTokenValidator, isAdminValidator, wrapAsync(getDashboardSummaryController))

rentalsRouter.route('/summary').get(accessTokenValidator, isAdminValidator, wrapAsync(getRentalSummaryController))

rentalsRouter.route('/stats/revenue').get(accessTokenValidator, isAdminValidator, wrapAsync(getRentalRevenueController))

rentalsRouter
  .route('/stats/station-activity')
  .get(accessTokenValidator, isAdminValidator, wrapAsync(getStationActivityController))

rentalsRouter.post('/card-rental', cardTapApiKeyValidator, wrapAsync(createRentalFromCardController))

rentalsRouter
  .route('/stats/reservations')
  .get(accessTokenValidator, isAdminValidator, wrapAsync(getReservationsStatisticController))

rentalsRouter
  .route('/users/:userId')
  .get(accessTokenValidator, isAdminAndStaffValidator, checkUserExist, wrapAsync(getRentalListByUserIdController))

rentalsRouter
  .route('/by-phone/:number/active')
  .get(accessTokenValidator, isAdminAndStaffValidator, checkUserExistWithPhoneNumber, wrapAsync(getActiveRentalListByPhoneNumberController))

rentalsRouter.route('/me').get(accessTokenValidator, wrapAsync(getMyRentalsController))

rentalsRouter.route('/me/current').get(accessTokenValidator, wrapAsync(getMyCurrentRentalsController))

rentalsRouter
.route('/me/:id/end')
.put(accessTokenValidator, endRentalSessionValidator, wrapAsync(endRentalSessionController))

rentalsRouter.route('/me/:id').get(accessTokenValidator, wrapAsync(getMyDetailRentalController))

rentalsRouter
.route('/:id/end')
.put(
  accessTokenValidator,
  isAdminAndStaffValidator,
  filterMiddleware<EndRentalByAdminOrStaffReqBody>(["end_station", "end_time", "reason"]),
  endRentalByAdminOrStaffValidator,
  wrapAsync(endRentalByAdminOrStaffController)
)

rentalsRouter
.route('/:id/cancel')
.post(
  accessTokenValidator,
  isAdminAndStaffValidator,
  filterMiddleware<CancelRentalReqBody>(['bikeStatus', 'reason']),
  cancelRentalValidator,
  wrapAsync(cancelRentalController)
)

// staff/admin
rentalsRouter
  .route('/:id')
  .get(accessTokenValidator, isAdminAndStaffValidator, wrapAsync(getDetailRentalController))
  .put(
    accessTokenValidator,
    isAdminValidator,
    filterMiddleware<UpdateRentalReqBody>(['end_station', 'end_time', 'status', 'total_price', 'reason']),
    updateDetailRentalValidator,
    wrapAsync(updateDetailRentalController)
  )

rentalsRouter
  .route('/')
  .get(accessTokenValidator, isAdminAndStaffValidator, wrapAsync(getRentalListController))
  // user
  .post(
    accessTokenValidator,
    verifiedUserValidator,
    checkUserWalletBeforeRent,
    filterMiddleware<CreateRentalReqBody>(['bike_id', 'subscription_id']),
    createRentalSessionValidator,
    wrapAsync(createRentalSessionController)
  )
export default rentalsRouter
