import { NextFunction, Response, Request } from 'express'
import { CreateRatingReqBody, GetRatingReqQuery } from '~/models/requests/rating.requests'
import databaseService from './database.services'
import { sendPaginatedResponse } from '~/utils/pagination.helper'
import Rating, { RatingType } from '~/models/schemas/rating.schema'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/errors'
import { RATING_MESSAGE } from '~/constants/messages'
import HTTP_STATUS from '~/constants/http-status'
import { Role } from '~/constants/enums'

class RatingService {
  async createRating(userID: string, rentalID: string, reqBody: CreateRatingReqBody) {
    const ratingID = new ObjectId()

    // chuyển đổi mảng reason_ids từ chuỗi sang ObjectId
    const reasonObjectIds = reqBody.reason_ids.map((id) => new ObjectId(id))
    const ratingData: RatingType = {
      _id: ratingID,
      user_id: new ObjectId(userID),
      rental_id: new ObjectId(rentalID),
      rating: reqBody.rating,
      reason_ids: reasonObjectIds,
      comment: reqBody.comment
    }

    const result = await databaseService.ratings.insertOne(new Rating(ratingData))

    return result
  }

  async getAllRating(res: Response, next: NextFunction, query: GetRatingReqQuery) {
    const { user_id, rating, reason_ids } = query
    const filter: any = {}

    if (user_id) {
      filter.user_id = user_id
    }
    if (rating) {
      filter.rating = rating
    }
    if (reason_ids) {
      filter.reason_ids = (reason_ids as string[]).map((id) => new ObjectId(id))
    }

    await sendPaginatedResponse(res, next, databaseService.ratings, query as unknown as Request['query'], filter)
  }

  async getRatingById(id: string, user_id: string) {
    const findUser = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    const isAdmin = findUser?.role === Role.Admin

    const matchCriteria: any = {
      rental_id: new ObjectId(id)
    }

    if (!isAdmin) {
      matchCriteria.user_id = new ObjectId(user_id)
    }

    const result = await databaseService.ratings
      .aggregate([
        {
          $match: matchCriteria
        },
        {
          $lookup: {
            from: 'rating_reasons',
            localField: 'reason_ids',
            foreignField: '_id',
            as: 'reason_details'
          }
        },
        {
          $project: {
            _id: 1,
            user_id: 1,
            rental_id: 1,
            rating: 1,
            reason_ids: 1,
            comment: 1,
            created_at: 1,
            updated_at: 1,
            reason_details: {
              $map: {
                input: '$reason_details',
                as: 'reason',
                in: {
                  _id: '$$reason._id',
                  type: '$$reason.type',
                  applies_to: '$$reason.applies_to',
                  messages: '$$reason.messages'
                }
              }
            }
          }
        }
      ])
      .toArray()

    if (!result || result.length === 0) {
      throw new ErrorWithStatus({
        message: RATING_MESSAGE.RATING_NOT_FOUND.replace('%s', id),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return result[0]
  }
}

const ratingService = new RatingService()
export default ratingService
