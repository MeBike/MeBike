import { Request, Response } from 'express'
import { SubscriptionPackage } from '~/constants/enums'
import HTTP_STATUS from '~/constants/http-status'
import { RESERVATIONS_MESSAGE } from '~/constants/messages'
import { PACKAGE_CONFIG } from '~/constants/subscription-packages'
import { ErrorWithStatus } from '~/models/errors'
import { CreateSubscriptionReqBody, SubscriptionParam } from '~/models/requests/subscriptions.requests'
import { TokenPayLoad } from '~/models/requests/users.requests'
import subscriptionService from '~/services/subscription.services'
import { toObjectId } from '~/utils/string'

export async function createSubscriptionController(req: Request<CreateSubscriptionReqBody>, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad
  const userId = toObjectId(user_id)
  const packageName = req.body.package_name as SubscriptionPackage

  const config = PACKAGE_CONFIG[packageName]
  if (!config)
    throw new ErrorWithStatus({ message: RESERVATIONS_MESSAGE.SUB_PACKAGE_NOT_FOUND, status: HTTP_STATUS.NOT_FOUND })

  const result = await subscriptionService.create({
    user_id: userId,
    package_name: packageName,
    price: config.price,
    max_reservations_per_month: config.max_reservations_per_month
  })

  res.json({
    message: RESERVATIONS_MESSAGE.SUB_CREATE_SUCCESS,
    result
  })
}

export async function activateSubscriptionController(req: Request<SubscriptionParam>, res: Response) {
  const { id } = req.params

  const result = await subscriptionService.activate(toObjectId(id))

  res.json({
    message: RESERVATIONS_MESSAGE.SUB_ACTIVATE_SUCCESS,
    result
  })
}
