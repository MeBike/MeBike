import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { RentalStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/http-status'
import { RATING_MESSAGE, RENTALS_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'

export const createRatingValidator = validate(
  checkSchema({
    comment: {
      in: ['body'],
      trim: true,
      optional: true,
      isString: {
        errorMessage: RATING_MESSAGE.COMMENT_MUST_BE_STRING
      },
      isLength: {
        options: { max: 500 },
        errorMessage: RATING_MESSAGE.COMMENT_MAX_LENGTH
      }
    },
    rating: {
      in: ['body'],
      trim: true,
      notEmpty: {
        errorMessage: RATING_MESSAGE.RATING_REQUIRED
      },
      isInt: {
        options: { min: 1, max: 5 },
        errorMessage: RATING_MESSAGE.RATING_MUST_BE_INT_BETWEEN_1_AND_5
      },
      toInt: true
    },
    reason_ids: {
      in: ['body'],
      isArray: {
        errorMessage: RATING_MESSAGE.REASON_IDS_MUST_BE_ARRAY
      }
    },
    'reason_ids.*': {
      isMongoId: {
        errorMessage: RATING_MESSAGE.REASON_ID_MUST_BE_OBJECTID
      },
      custom: {
        options: async (value) => {
          const exist = await databaseService.rating_reasons.findOne({ _id: new ObjectId(value) })
          if (!exist) {
            throw new ErrorWithStatus({
              message: RATING_MESSAGE.REASON_ID_NOT_FOUND.replace('%s', value),
              status: HTTP_STATUS.NOT_FOUND
            })
          }

          return true
        }
      }
    },
    rental_id: {
      in: ['params'],
      trim: true,
      notEmpty: {
        errorMessage: RATING_MESSAGE.RENTAL_ID_IS_REQUIRED
      },
      isMongoId: {
        errorMessage: RATING_MESSAGE.RENTAL_ID_INVALID
      },
      custom: {
        options: async (value) => {
          const findRetal = await databaseService.rentals.findOne({ _id: new ObjectId(value) })
          if (!findRetal) {
            throw new ErrorWithStatus({
              message: RENTALS_MESSAGE.NOT_FOUND.replace('%s', value),
              status: HTTP_STATUS.NOT_FOUND
            })
          }

          if (findRetal.status !== RentalStatus.Completed) {
            throw new ErrorWithStatus({
              message: RATING_MESSAGE.CANNOT_RATE_UNCOMPLETED_RENTAL,
              status: HTTP_STATUS.BAD_REQUEST
            })
          }

          const now = new Date()

          // chỉ được đánh giá sau 7 ngày kể từ khi hoàn thành
          const expriredRatingTime = new Date(now)
          expriredRatingTime.setDate(expriredRatingTime.getDate() - 7)
          if (findRetal.updated_at && findRetal.updated_at < expriredRatingTime) {
            throw new ErrorWithStatus({
              message: RATING_MESSAGE.RATING_EXPIRED,
              status: HTTP_STATUS.BAD_REQUEST
            })
          }

          return true
        }
      }
    }
  })
)
