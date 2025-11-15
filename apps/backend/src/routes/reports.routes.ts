import { Router } from 'express'
import type { CreateReportReqBody } from '~/models/requests/reports.requests'

import {
  createReportController,
  getAllInProgressReportController,
  getAllReportController,
  getAllUserReportController,
  getByIdController,
  getReportOverviewController,
  staffGetByIdController,
  staffUpdateReportStatusController,
  updateReportStatusController
} from '~/controllers/reports.controllers'
import { isAdminAndStaffValidator, isAdminValidator } from '~/middlewares/admin.middlewares'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import {
  createReportValidator,
  getAllReportValidator,
  getAllUserReportValidator,
  staffUpdateReportValidator,
  updateReportValidator
} from '~/middlewares/reports.middlewares'
import { getIdValidator } from '~/middlewares/supplier.middlewares'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handler'
import { isStaffOrSosAgentValidator } from '~/middlewares/sos.middlewares'
import { isStaffValidator } from '~/middlewares/staff.middlewares'

const reportsRouter = Router()

// get all cho users
reportsRouter.get('/', accessTokenValidator, getAllUserReportValidator, wrapAsync(getAllUserReportController))
// get all cho admin
reportsRouter.get(
  '/manage-reports',
  accessTokenValidator,
  isAdminAndStaffValidator,
  getAllReportValidator,
  wrapAsync(getAllReportController)
)
reportsRouter.get('/overview', accessTokenValidator, isAdminValidator, wrapAsync(getReportOverviewController))
// get all inprogress cho sos agent
reportsRouter.get(
  '/inprogress',
  accessTokenValidator,
  isStaffOrSosAgentValidator,
  wrapAsync(getAllInProgressReportController)
)
// get report by id for staff or sos agent
reportsRouter.get(
  '/staff/:reportID',
  accessTokenValidator,
  isStaffOrSosAgentValidator,
  getIdValidator,
  wrapAsync(staffGetByIdController)
)
reportsRouter.get('/:reportID', accessTokenValidator, getIdValidator, wrapAsync(getByIdController))
reportsRouter.post(
  '/',
  accessTokenValidator,
  filterMiddleware<CreateReportReqBody>([
    'bike_id',
    'latitude',
    'longitude',
    'files',
    'message',
    'rental_id',
    'station_id',
    'type'
  ]),
  createReportValidator,
  wrapAsync(createReportController)
)
reportsRouter.put(
  '/:reportID',
  accessTokenValidator,
  isStaffValidator,
  getIdValidator,
  filterMiddleware(['newStatus', 'staff_id', 'priority']),
  updateReportValidator,
  wrapAsync(updateReportStatusController)
)

// Staff update report status
reportsRouter.put(
  '/staff/:reportID',
  accessTokenValidator,
  isStaffOrSosAgentValidator,
  getIdValidator,
  filterMiddleware(['newStatus', 'reason', 'files']),
  staffUpdateReportValidator,
  wrapAsync(staffUpdateReportStatusController)
)

export default reportsRouter
