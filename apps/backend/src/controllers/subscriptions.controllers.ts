import { NextFunction, Request, Response } from 'express'
import { FilterQuery } from 'mongoose'
import { Role, SubscriptionPackage } from '~/constants/enums'
import HTTP_STATUS from '~/constants/http-status'
import { RESERVATIONS_MESSAGE, USERS_MESSAGES } from '~/constants/messages'
import { PACKAGE_CONFIG } from '~/constants/subscription-packages'
import { ErrorWithStatus } from '~/models/errors'
import { CreateSubscriptionReqBody, SubscriptionParam } from '~/models/requests/subscriptions.requests'
import { TokenPayLoad } from '~/models/requests/users.requests'
import Subscription from '~/models/schemas/subscription.schema'
import User from '~/models/schemas/user.schema'
import databaseService from '~/services/database.services'
import subscriptionService from '~/services/subscription.services'
import { buildAdminSubscriptionFilter } from '~/utils/filters.helper'
import { sendPaginatedAggregationResponse, sendPaginatedResponse } from '~/utils/pagination.helper'
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

export async function getSubscriptionByIdController(req: Request<SubscriptionParam>, res: Response) {
  const subscription = req.subscription as Subscription
  const result = await subscriptionService.getDetail(subscription)

  res.json({
    message: RESERVATIONS_MESSAGE.SUB_GET_DETAIL_SUCCESS,
    result
  })
}

export async function getSubscriptionListController(req: Request, res: Response, next: NextFunction) {
  const { user_id } = req.decoded_authorization as TokenPayLoad
  const objUserId = toObjectId(user_id)

  const user = await databaseService.users.findOne({ _id: objUserId })
  if (!user) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  let matchQuery: FilterQuery<Subscription> = {}

  if (user.role === Role.User) {
    matchQuery.user_id = objUserId
    if (req.query.status) {
      matchQuery.status = req.query.status
    }
  } else if ([Role.Admin, Role.Staff].includes(user.role)) {
    // admin or staff can filter by any field
    matchQuery = buildAdminSubscriptionFilter(req.query)
  }

  const pipeline = await subscriptionService.getSubscriptionListPipeline(matchQuery)

  await sendPaginatedAggregationResponse(res, next, databaseService.subscriptions, req.query, pipeline)
}
