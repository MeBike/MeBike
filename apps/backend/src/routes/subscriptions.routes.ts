import { filterMiddleware } from '~/middlewares/common.middlewares';
import { Router } from "express"
import { activateSubscriptionController, createSubscriptionController, getSubscriptionByIdController, getSubscriptionListController } from "~/controllers/subscriptions.controllers"
import { activateValidator, checkUserWalletBeforeSubscribe, createSubscriptionValidator, getSubscriptionByIdValidator, isPendingOrActiveSubscriptionExist } from "~/middlewares/subscriptions.middlewares"
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares"
import { wrapAsync } from "~/utils/handler"
import { CreateSubscriptionReqBody } from '~/models/requests/subscriptions.requests';

const subscriptionRouter = Router()

subscriptionRouter.post(
  '/subscribe',
  accessTokenValidator,
  verifiedUserValidator,
  isPendingOrActiveSubscriptionExist,
  checkUserWalletBeforeSubscribe,
  filterMiddleware<CreateSubscriptionReqBody>(['package_name']),
  createSubscriptionValidator,
  wrapAsync(createSubscriptionController)
)

subscriptionRouter.post(
  '/:id/activate',
  accessTokenValidator,
  activateValidator,
  wrapAsync(activateSubscriptionController)
)

subscriptionRouter.get(
  '/:id',
  accessTokenValidator,
  getSubscriptionByIdValidator,
  wrapAsync(getSubscriptionByIdController)
)

subscriptionRouter.get(
  '/',
  accessTokenValidator,
  wrapAsync(getSubscriptionListController)
)

export default subscriptionRouter