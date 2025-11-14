import { Router } from 'express'
import {
  assignSosAgentController,
  confirmSosController,
  createSosRequestController,
  getSosRequestByIdController,
  getSosRequestsController,
  rejectSosController
} from '~/controllers/sos.controllers'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import {
  assignSosAgentValidator,
  confirmSosValidator,
  createSosAlertValidator,
  getSosRequestByIdValidator,
  isSosAgentValidator,
  isStaffOrSosAgentValidator,
  rejectSosValidator
} from '~/middlewares/sos.middlewares'
import { isStaffValidator } from '~/middlewares/staff.middlewares'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { AssignSosReqBody, ConfirmSosReqBody, CreateSosReqBody, RejectSosReqBody } from '~/models/requests/sos.requests'
import { wrapAsync } from '~/utils/handler'

const sosRouter = Router()

sosRouter
  .route('/:id/assign')
  .post(
    accessTokenValidator,
    isStaffValidator,
    filterMiddleware<AssignSosReqBody>(['replaced_bike_id', 'sos_agent_id']),
    assignSosAgentValidator,
    wrapAsync(assignSosAgentController)
  )

sosRouter
  .route('/:id/confirm')
  .post(
    accessTokenValidator,
    isSosAgentValidator,
    filterMiddleware<ConfirmSosReqBody>(['solvable', 'agent_notes', 'photos']),
    confirmSosValidator,
    wrapAsync(confirmSosController)
  )

sosRouter
  .route('/:id/reject')
  .post(
    accessTokenValidator,
    isSosAgentValidator,
    filterMiddleware<RejectSosReqBody>(['agent_notes', 'photos']),
    rejectSosValidator,
    wrapAsync(rejectSosController)
  )
sosRouter
  .route('/:id')
  .get(
    accessTokenValidator,
    isStaffOrSosAgentValidator,
    getSosRequestByIdValidator,
    wrapAsync(getSosRequestByIdController)
  )

sosRouter
  .route('/')
  .get(accessTokenValidator, isStaffOrSosAgentValidator, wrapAsync(getSosRequestsController))
  .post(
    accessTokenValidator,
    filterMiddleware<CreateSosReqBody>(['rental_id', 'issue', 'latitude', 'longitude']),
    createSosAlertValidator,
    wrapAsync(createSosRequestController)
  )

export default sosRouter
