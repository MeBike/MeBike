import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { Router } from 'express'

import {
  cancelRentalController,
  createRentalFromCardController,
  createRentalSessionController,
  endRentalByAdminOrStaffController,
  endRentalSessionController,
  getAllRentalsController,
  getDetailRentalController,
  getMyCurrentRentalsController,
  getMyDetailRentalController,
  getMyRentalsController,
  getRentalRevenueController,
  getReservationsStatisticController,
  getStationActivityController,
  updateDetailRentalController
} from '~/controllers/rentals.controllers'
import { isAdminAndStaffValidator, isAdminValidator } from '~/middlewares/admin.middlewares'
import {
  cancelRentalValidator,
  createRentalSessionValidator,
  endRentalByAdminOrStaffValidator,
  endRentalSessionValidator,
  updateDetailRentalValidator
} from '~/middlewares/rentals.middlewares'
import { cardTapApiKeyValidator } from '~/middlewares/card-tap.middlewares'
import { wrapAsync } from '~/utils/handler'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { CancelRentalReqBody, CreateRentalReqBody, EndRentalByAdminOrStaffReqBody, UpdateRentalReqBody } from '~/models/requests/rentals.requests'

const rentalsRouter = Router()

rentalsRouter.route('/stats/revenue').get(accessTokenValidator, isAdminValidator, wrapAsync(getRentalRevenueController))

rentalsRouter
  .route('/stats/station-activity')
  .get(accessTokenValidator, isAdminValidator, wrapAsync(getStationActivityController))

rentalsRouter.post('/card-rental', cardTapApiKeyValidator, wrapAsync(createRentalFromCardController))

rentalsRouter
  .route('/stats/reservations')
  .get(accessTokenValidator, isAdminValidator, wrapAsync(getReservationsStatisticController))

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
  .get(accessTokenValidator, isAdminValidator, wrapAsync(getAllRentalsController))
  // user
  .post(
    accessTokenValidator,
    verifiedUserValidator,
    filterMiddleware<CreateRentalReqBody>(['bike_id']),
    createRentalSessionValidator,
    wrapAsync(createRentalSessionController)
  )
export default rentalsRouter
