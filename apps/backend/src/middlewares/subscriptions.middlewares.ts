import { Decimal128 } from 'mongodb'
import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { ReservationOptions, SubscriptionPackage, SubscriptionStatus } from '~/constants/enums'
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

    if(!subscription) return next()

    if(subscription.status === SubscriptionStatus.PENDING){
        throw new ErrorWithStatus({
            message: RESERVATIONS_MESSAGE.SUB_ALREADY_HAS_PENDING,
            status: HTTP_STATUS.BAD_REQUEST
        })
    }else if(subscription.status === SubscriptionStatus.ACTIVE){
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
