import { filterMiddleware } from '~/middlewares/common.middlewares';
import { Router } from "express"
import { activateSubscriptionController, createSubscriptionController } from "~/controllers/subscriptions.controllers"
import { checkUserWalletBeforeSubscribe, createSubscriptionValidator, isPendingOrActiveSubscriptionExist } from "~/middlewares/subscriptions.middlewares"
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
  createSubscriptionValidator,
  wrapAsync(activateSubscriptionController)
)

export default subscriptionRouter