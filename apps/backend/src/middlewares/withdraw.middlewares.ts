import { checkSchema } from 'express-validator'
import { WithDrawalStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/http-status'
import { WALLETS_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import { validate } from '~/utils/validation'

export const createWithdrawRequestValidator = validate(
  checkSchema(
    {
      amount: {
        in: ['body'],
        trim: true,
        notEmpty: {
          errorMessage: WALLETS_MESSAGE.AMOUNT_IS_REQUIRED
        },
        isDecimal: {
          options: { decimal_digits: '1,2' },
          errorMessage: WALLETS_MESSAGE.AMOUNT_NUMERIC
        },
        custom: {
          options: (value) => {
            if (parseFloat(value) <= 0) {
              throw new ErrorWithStatus({
                message: WALLETS_MESSAGE.AMOUNT_NEGATIVE,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            return true
          }
        }
      },

      account: {
        in: ['body'],
        trim: true,
        notEmpty: {
          errorMessage: WALLETS_MESSAGE.TYPE_IS_REQUIRED
        }
      },

      note: {
        in: ['body'],
        optional: true,
        trim: true,
        isString: {
          errorMessage: WALLETS_MESSAGE.NOTE_IN_VALID
        },
        isLength: {
          options: { max: 500 },
          errorMessage: WALLETS_MESSAGE.NOTE_TOO_LONG
        }
      }
    },
    ['body']
  )
)

export const updateWithdrawStatusValidator = validate(
  checkSchema({
    newStatus: {
      in: ['body'],
      trim: true,
      notEmpty: {
        errorMessage: WALLETS_MESSAGE.STATUS_IS_REQUIED
      },
      isIn: {
        options: [[WithDrawalStatus.Approved, WithDrawalStatus.Completed, WithDrawalStatus.Rejected]],
        errorMessage: WALLETS_MESSAGE.INVALID_NEW_STATUS
      }
    }
  })
)
