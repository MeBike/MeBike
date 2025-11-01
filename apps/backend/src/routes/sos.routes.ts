import { Router } from 'express'
import { confirmSosController, createSosRequestController, dispatchSosController } from '~/controllers/sos.controllers'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { confirmSosValidator, createSosAlertValidator, dispatchSosValidator, isSosAgentValidator, isStaffOrSosAgentValidator } from '~/middlewares/sos.middlewares'
import { isStaffValidator } from '~/middlewares/staff.middlewares'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { ConfirmSosReqBody, CreateSosReqBody, DispatchSosReqBody } from '~/models/requests/sos.requests'
import { wrapAsync } from '~/utils/handler'

const sosRouter = Router()

sosRouter
  .route('/')
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
    filterMiddleware<ConfirmSosReqBody>(['confirmed', 'agent_notes', 'photos']),
    confirmSosValidator,
    wrapAsync(confirmSosController)
  )

export default sosRouter
