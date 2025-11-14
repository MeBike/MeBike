import { Router } from 'express'
import {
  assignSosAgentController,
  cancelSosController,
  confirmSosController,
  createSosRequestController,
  getSosRequestByIdController,
  getSosRequestsController,
  rejectSosController,
  resolveSosController
} from '~/controllers/sos.controllers'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import {
  assignSosAgentValidator,
  cancelSosValidator,
  confirmSosValidator,
  createSosAlertValidator,
  getSosRequestByIdValidator,
  isSosAgentValidator,
  isStaffOrSosAgentValidator,
  rejectSosValidator,
  resolveSosValidator
} from '~/middlewares/sos.middlewares'
import { isStaffValidator } from '~/middlewares/staff.middlewares'
import { accessTokenValidator, checkLoggedUserExist } from '~/middlewares/users.middlewares'
import { AssignSosReqBody, CancelSosReqBody, CreateSosReqBody, RejectSosReqBody, ResolveSosReqBody } from '~/models/requests/sos.requests'
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
    confirmSosValidator,
    wrapAsync(confirmSosController)
  )

sosRouter
  .route('/:id/resolve')
  .post(
    accessTokenValidator,
    isSosAgentValidator,
    filterMiddleware<ResolveSosReqBody>(['solvable', 'agent_notes', 'photos']),
    resolveSosValidator,
    wrapAsync(resolveSosController)
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
  .route('/:id/cancel')
  .post(
    accessTokenValidator,
    filterMiddleware<CancelSosReqBody>(['reason']),
    cancelSosValidator,
    wrapAsync(cancelSosController)
  )

sosRouter
  .route('/:id')
  .get(
    accessTokenValidator,
    checkLoggedUserExist,
    getSosRequestByIdValidator,
    wrapAsync(getSosRequestByIdController)
  )

sosRouter
  .route('/')
  .get(accessTokenValidator, checkLoggedUserExist, wrapAsync(getSosRequestsController))
  .post(
    accessTokenValidator,
    filterMiddleware<CreateSosReqBody>(['rental_id', 'issue', 'latitude', 'longitude']),
    createSosAlertValidator,
    wrapAsync(createSosRequestController)
  )

export default sosRouter
