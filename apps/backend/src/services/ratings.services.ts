import { NextFunction, Response, Request } from 'express'
import { CreateRatingReqBody, GetRatingReqQuery } from '~/models/requests/rating.requests'
import databaseService from './database.services'
import { sendPaginatedAggregationResponse } from '~/utils/pagination.helper'
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
    const matchFilter: any = {}

    if (user_id) {
      matchFilter.user_id = new ObjectId(user_id)
    }
    if (rating) {
      matchFilter.rating = rating
    }
    if (reason_ids) {
      matchFilter.reason_ids = (reason_ids as string[]).map((id) => new ObjectId(id))
    }

    const pipeline = [
      {
        $match: matchFilter
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
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
          user: {
            fullname: '$user.fullname',
            email: '$user.email'
          }
        }
      },
      {
        $sort: { created_at: -1 }
      }
    ]

    await sendPaginatedAggregationResponse(
      res,
      next,
      databaseService.ratings,
      query as unknown as Request['query'],
      pipeline
    )
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

  async getRatingDetailById(rating_id: string) {
    const result = await databaseService.ratings
      .aggregate([
        {
          $match: { _id: new ObjectId(rating_id) }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $lookup: {
            from: 'rentals',
            localField: 'rental_id',
            foreignField: '_id',
            as: 'rental'
          }
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
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: '$rental',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'bikes',
            localField: 'rental.bike_id',
            foreignField: '_id',
            as: 'bike'
          }
        },
        {
          $unwind: {
            path: '$bike',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'stations',
            localField: 'rental.start_station_id',
            foreignField: '_id',
            as: 'start_station'
          }
        },
        {
          $lookup: {
            from: 'stations',
            localField: 'rental.end_station_id',
            foreignField: '_id',
            as: 'end_station'
          }
        },
        {
          $unwind: {
            path: '$start_station',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: '$end_station',
            preserveNullAndEmptyArrays: true
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
            user: {
              _id: '$user._id',
              fullname: '$user.fullname',
              email: '$user.email',
              phone_number: '$user.phone_number',
              avatar: '$user.avatar'
            },
            rental: {
              _id: '$rental._id',
              bike_id: '$rental.bike_id',
              start_time: '$rental.start_time',
              end_time: '$rental.end_time',
              total_price: '$rental.total_price',
              status: '$rental.status',
              bike: {
                _id: '$bike._id',
                name: '$bike.name',
                qr_code: '$bike.qr_code',
                model: '$bike.model'
              },
              start_station: {
                _id: '$start_station._id',
                name: '$start_station.name',
                address: '$start_station.address'
              },
              end_station: {
                _id: '$end_station._id',
                name: '$end_station.name',
                address: '$end_station.address'
              }
            },
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
        message: RATING_MESSAGE.RATING_NOT_FOUND.replace('%s', rating_id),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return result[0]
  }

  async getBikeRating(bike_id: string) {
    const bikeObjectId = new ObjectId(bike_id)

    const result = await databaseService.ratings
      .aggregate([
        {
          $lookup: {
            from: 'rentals',
            localField: 'rental_id',
            foreignField: '_id',
            as: 'rental_info'
          }
        },
        {
          $unwind: '$rental_info'
        },
        {
          $match: {
            'rental_info.bike_id': bikeObjectId
          }
        },
        {
          $group: {
            _id: '$rental_info.bike_id',
            average_rating: { $avg: '$rating' },
            total_ratings: { $sum: 1 },
            five_star_count: {
              $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] }
            },
            four_star_count: {
              $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] }
            },
            three_star_count: {
              $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] }
            },
            two_star_count: {
              $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] }
            },
            one_star_count: {
              $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] }
            }
          }
        }
      ])
      .toArray()

    if (!result || result.length === 0) {
      throw new ErrorWithStatus({
        message: RATING_MESSAGE.RATING_NOT_FOUND.replace('%s', bike_id),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return result[0]
  }

  async getStationRating(station_id: string) {
    const stationObjectId = new ObjectId(station_id)

    const result = await databaseService.ratings
      .aggregate([
        {
          $lookup: {
            from: 'rentals',
            localField: 'rental_id',
            foreignField: '_id',
            as: 'rental_info'
          }
        },
        {
          $unwind: '$rental_info'
        },
        {
          $match: {
            'rental_info.start_station': stationObjectId
          }
        },
        {
          $group: {
            _id: '$rental_info.start_station',
            average_rating: { $avg: '$rating' },
            total_ratings: { $sum: 1 },
            five_star_count: {
              $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] }
            },
            four_star_count: {
              $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] }
            },
            three_star_count: {
              $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] }
            },
            two_star_count: {
              $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] }
            },
            one_star_count: {
              $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] }
            }
          }
        }
      ])
      .toArray()

    if (!result || result.length === 0) {
      throw new ErrorWithStatus({
        message: RATING_MESSAGE.STATION_RATING_NOT_FOUND.replace('%s', station_id),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return result[0]
  }

  async getAppRating() {
    const result = await databaseService.ratings
      .aggregate([
        {
          $lookup: {
            from: 'rating_reasons',
            localField: 'reason_ids',
            foreignField: '_id',
            as: 'reason_details'
          }
        },
        {
          $match: {
            'reason_details.applies_to': 'app'
          }
        },
        {
          $group: {
            _id: null,
            average_rating: { $avg: '$rating' },
            total_ratings: { $sum: 1 },
            five_star_count: {
              $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] }
            },
            four_star_count: {
              $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] }
            },
            three_star_count: {
              $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] }
            },
            two_star_count: {
              $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] }
            },
            one_star_count: {
              $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            _id: 0
          }
        }
      ])
      .toArray()

    if (!result || result.length === 0) {
      return null
    }

    return result[0]
  }
}

const ratingService = new RatingService()
export default ratingService
