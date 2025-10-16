import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { RefundStatus } from '~/constants/enums'

import HTTP_STATUS from '~/constants/http-status'
import { WALLETS_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'

export const createRefundRequestValidator = validate(
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

      transaction_id: {
        in: ['body'],
        trim: true,
        notEmpty: {
          errorMessage: WALLETS_MESSAGE.TYPE_IS_REQUIRED
        },
        custom: {
          options: async (value) => {
            const findTransaction = await databaseService.transactions.findOne({ _id: new ObjectId(value) })
            if (!findTransaction) {
              throw new ErrorWithStatus({
                message: WALLETS_MESSAGE.TRANSACTION_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const updateRefundStatusValidator = validate(
  checkSchema({
    newStatus: {
      in: ['body'],
      trim: true,
      notEmpty: {
        errorMessage: WALLETS_MESSAGE.STATUS_IS_REQUIED
      },
      isIn: {
        options: [[RefundStatus.Approved, RefundStatus.Completed, RefundStatus.Rejected]],
        errorMessage: WALLETS_MESSAGE.INVALID_NEW_STATUS
      }
    }
  })
)
