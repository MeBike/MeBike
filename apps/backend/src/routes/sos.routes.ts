import { Router } from "express";
import { createSosAlertController, dispatchSosController } from "~/controllers/sos.controllers";
import { filterMiddleware } from "~/middlewares/common.middlewares";
import { createSosAlertValidator, dispatchSosValidator } from "~/middlewares/sos.middlewares";
import { isStaffValidator } from "~/middlewares/staff.middlewares";
import { accessTokenValidator } from "~/middlewares/users.middlewares";
import { CreateSosReqBody, DispatchSosReqBody } from "~/models/requests/sos.requests";
import { wrapAsync } from "~/utils/handler";

const sosRouter = Router()

sosRouter
  .route('/')
  .post(
    accessTokenValidator,
    isStaffValidator,
    filterMiddleware<CreateSosReqBody>(['rental_id', 'issue', 'latitude', 'longitude', 'staff_notes']),
    createSosAlertValidator,
    wrapAsync(createSosAlertController)
  );

sosRouter
  .route('/:id/dispatch')
  .post(
    accessTokenValidator,
    isStaffValidator,
    filterMiddleware<DispatchSosReqBody>(['agent_id']),
    dispatchSosValidator,
    wrapAsync(dispatchSosController)
  );

export default sosRouter