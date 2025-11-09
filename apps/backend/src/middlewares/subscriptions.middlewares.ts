import { Decimal128 } from 'mongodb'
import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { Role, SubscriptionPackage, SubscriptionStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/http-status'
import { RESERVATIONS_MESSAGE, WALLETS_MESSAGE } from '~/constants/messages'
import { PACKAGE_CONFIG } from '~/constants/subscription-packages'
import { ErrorWithStatus } from '~/models/errors'
import { TokenPayLoad } from '~/models/requests/users.requests'
import databaseService from '~/services/database.services'
import { toObjectId } from '~/utils/string'
import { validate } from '~/utils/validation'

export const createSubscriptionValidator = validate(
  checkSchema(
    {
      package_name: {
        notEmpty: { errorMessage: RESERVATIONS_MESSAGE.SUB_REQUIRED_PACKAGE_NAME },
        isIn: {
          options: [Object.values(SubscriptionPackage)],
          errorMessage: RESERVATIONS_MESSAGE.SUB_INVALID_PACKAGE
        }
      }
    },
    ['body']
  )
)

export const checkUserWalletBeforeSubscribe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayLoad

    const packageName = req.body.package_name as SubscriptionPackage
    const packagePriceString = PACKAGE_CONFIG[packageName].price.toString()

    const findWallet = await databaseService.wallets.findOne({ user_id: toObjectId(user_id) })
    if (!findWallet) {
      throw new ErrorWithStatus({
        message: WALLETS_MESSAGE.USER_NOT_HAVE_WALLET.replace('%s', user_id),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (findWallet.balance < Decimal128.fromString(packagePriceString)) {
      throw new ErrorWithStatus({
        message: RESERVATIONS_MESSAGE.NOT_ENOUGH_BALANCE_TO_SUBSCRIBE.replace('%s', packageName).replace(
          '%s',
          packagePriceString
        ),
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    next()
  } catch (error) {
    next(error)
  }
}

export const isPendingOrActiveSubscriptionExist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayLoad

    const subscription = await databaseService.subscriptions.findOne({
      user_id: toObjectId(user_id)
    })

    if (!subscription) return next()

    if (subscription.status === SubscriptionStatus.PENDING) {
      throw new ErrorWithStatus({
        message: RESERVATIONS_MESSAGE.SUB_ALREADY_HAS_PENDING,
        status: HTTP_STATUS.BAD_REQUEST
      })
    } else if (subscription.status === SubscriptionStatus.ACTIVE) {
      throw new ErrorWithStatus({
        message: RESERVATIONS_MESSAGE.SUB_USER_HAS_ACTIVE,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    next()
  } catch (error) {
    next(error)
  }
}

const makeSubscriptionIdRule = (options?: { mustBePending?: boolean }) => ({
  in: ['params'] as const,
  notEmpty: { errorMessage: RESERVATIONS_MESSAGE.SUB_REQUIRED_SUBSCRIPTION_ID },
  isMongoId: {
    errorMessage: RESERVATIONS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'ID gói')
  },
  custom: {
    options: async (value: string, { req }: { req: Request }) => {
      const sub = await databaseService.subscriptions.findOne({ _id: toObjectId(value) })
      if (!sub) {
        throw new ErrorWithStatus({
          message: RESERVATIONS_MESSAGE.SUBSCRIPTION_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      const {user_id} = req.decoded_authorization as TokenPayLoad
      const user = await databaseService.users.findOne({_id: toObjectId(user_id)})
      if(!user){
        throw new ErrorWithStatus({
          message: RESERVATIONS_MESSAGE.USER_NOT_FOUND.replace("%s", user_id),
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      if(![Role.Admin, Role.Staff].includes(user.role) && !sub.user_id.equals(user_id)){
        throw new ErrorWithStatus({
          message: RESERVATIONS_MESSAGE.SUB_CANNOT_OPERATE_OTHER_SUBSCRIPTION,
          status: HTTP_STATUS.FORBIDDEN
        })
      }

      if (options?.mustBePending && sub.status !== SubscriptionStatus.PENDING) {
        throw new ErrorWithStatus({
          message: RESERVATIONS_MESSAGE.SUB_MUST_BE_PENDING_TO_ACTIVATE,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

      req.subscription = sub
      req.user = user
      return true
    }
  }
})


export const getSubscriptionByIdValidator = validate(
  checkSchema({ id: makeSubscriptionIdRule() as any }, ['params'])
)

export const activateValidator = validate(
  checkSchema({ id: makeSubscriptionIdRule({mustBePending: true}) as any }, ['params'])
)
