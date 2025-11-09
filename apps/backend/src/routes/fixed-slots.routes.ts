// src/routes/fixed-slot-template.routes.ts
import { Router } from 'express'
import {
  cancelFixedSlotTemplateController,
  createFixedSlotTemplateController,
  getFixedSlotTemplateByIdController,
  getFixedSlotTemplateListController,
  pauseFixedSlotTemplateController,
  resumeFixedSlotTemplateController,
  updateFixedSlotTemplateController
} from '~/controllers/fixed-slots.controllers'
import {
  cancelFixedSlotTemplateValidator,
  createFixedSlotTemplateValidator,
  getFixedSlotTemplateByIdValidator,
  pauseFixedSlotTemplateValidator,
  resumeFixedSlotTemplateValidator,
  updateFixedSlotTemplateValidator
} from '~/middlewares/fixed-slots.middlewares'
import { accessTokenValidator } from '~/middlewares/users.middlewares'

import { verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handler'

const fixedSlotTemplateRouter = Router()

fixedSlotTemplateRouter.patch(
  '/:id',
  accessTokenValidator,
  updateFixedSlotTemplateValidator,
  wrapAsync(updateFixedSlotTemplateController)
)

fixedSlotTemplateRouter.post(
  '/:id/pause',
  accessTokenValidator,
  pauseFixedSlotTemplateValidator,
  wrapAsync(pauseFixedSlotTemplateController)
)

fixedSlotTemplateRouter.post(
  '/:id/resume',
  accessTokenValidator,
  resumeFixedSlotTemplateValidator,
  wrapAsync(resumeFixedSlotTemplateController)
)

fixedSlotTemplateRouter.post(
  '/:id/cancel',
  accessTokenValidator,
  cancelFixedSlotTemplateValidator,
  wrapAsync(cancelFixedSlotTemplateController)
)

fixedSlotTemplateRouter
  .route('/:id')
  .get(accessTokenValidator, getFixedSlotTemplateByIdValidator, wrapAsync(getFixedSlotTemplateByIdController))
  .patch(accessTokenValidator, updateFixedSlotTemplateValidator, wrapAsync(updateFixedSlotTemplateController))

fixedSlotTemplateRouter
  .route('/')
  .get(accessTokenValidator, wrapAsync(getFixedSlotTemplateListController))
  .post(
    accessTokenValidator,
    verifiedUserValidator,
    createFixedSlotTemplateValidator,
    wrapAsync(createFixedSlotTemplateController)
  )
export default fixedSlotTemplateRouter
