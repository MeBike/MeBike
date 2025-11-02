import { Router } from 'express'
import { confirmSosController, createSosRequestController, dispatchSosController, getSosRequestByIdController, getSosRequestsController, rejectSosController } from '~/controllers/sos.controllers'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { confirmSosValidator, createSosAlertValidator, dispatchSosValidator, getSosRequestByIdValidator, isSosAgentValidator, isStaffOrSosAgentValidator, rejectSosValidator } from '~/middlewares/sos.middlewares'
import { isStaffValidator } from '~/middlewares/staff.middlewares'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { ConfirmSosReqBody, CreateSosReqBody, DispatchSosReqBody, RejectSosReqBody } from '~/models/requests/sos.requests'
import { wrapAsync } from '~/utils/handler'

const sosRouter = Router()

sosRouter
  .route('/')
  .get(
    accessTokenValidator,
    isStaffOrSosAgentValidator,
    wrapAsync(getSosRequestsController)
  )
  .post(
    accessTokenValidator,
    isStaffValidator,
    filterMiddleware<CreateSosReqBody>(['rental_id', 'issue', 'latitude', 'longitude', 'staff_notes']),
    createSosAlertValidator,
    wrapAsync(createSosRequestController)
  )

sosRouter
  .route('/:id/dispatch')
  .post(
    accessTokenValidator,
    isStaffValidator,
    filterMiddleware<DispatchSosReqBody>(['agent_id']),
    dispatchSosValidator,
    wrapAsync(dispatchSosController)
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

export default sosRouter
