import { Router } from "express";
import { createSosAlertController } from "~/controllers/sos.controllers";
import { filterMiddleware } from "~/middlewares/common.middlewares";
import { createSosAlertValidator } from "~/middlewares/sos.middlewares";
import { isStaffValidator } from "~/middlewares/staff.middlewares";
import { accessTokenValidator } from "~/middlewares/users.middlewares";
import { CreateSosReqBody } from "~/models/requests/sos.requests";
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

export default sosRouter