import type { NextFunction, Request, Response } from 'express'

import HTTP_STATUS from '~/constants/http-status'
import { COMMON_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'

const CARD_TAP_HEADER = 'x-card-tap-key'

export function cardTapApiKeyValidator(req: Request, res: Response, next: NextFunction) {
  const expectedKey = process.env.CARD_TAP_API_KEY
  if (!expectedKey) {
    return next(
      new ErrorWithStatus({
        message: COMMON_MESSAGE.SERVICE_TOKEN_NOT_CONFIGURED,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    )
  }

  const providedKey = req.header(CARD_TAP_HEADER)
  if (!providedKey || providedKey !== expectedKey) {
    return next(
      new ErrorWithStatus({
        message: COMMON_MESSAGE.INVALID_SERVICE_TOKEN,
        status: HTTP_STATUS.FORBIDDEN
      })
    )
  }

  return next()
}
