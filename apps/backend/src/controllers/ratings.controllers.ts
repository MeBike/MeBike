import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import HTTP_STATUS from '~/constants/http-status'
import { RATING_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import { CreateRatingReqBody, GetRatingReqQuery } from '~/models/requests/rating.requests'
import { TokenPayLoad } from '~/models/requests/users.requests'
import databaseService from '~/services/database.services'
import ratingService from '~/services/ratings.services'

export async function addNewRatingController(req: Request<ParamsDictionary, any, CreateRatingReqBody>, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad

  const { rental_id } = req.params
  const existedRating = await databaseService.ratings.findOne({ rental_id: new ObjectId(rental_id) })
  if (existedRating) {
    throw new ErrorWithStatus({
      message: RATING_MESSAGE.RATING_EXISTED.replace('%s', rental_id),
      status: HTTP_STATUS.BAD_REQUEST
    })
  }

  try {
    const result = await ratingService.createRating(user_id, rental_id, req.body)
    res.json({
      message: RATING_MESSAGE.CREATE_RATING_SUCCESS,
      result
    })
  } catch (error: any) {
    const statusCode = error instanceof ErrorWithStatus ? error.status : 500
    res.status(statusCode).json({ status: statusCode, message: error.message ?? 'Internal Server Error' })
  }
}

export async function getRatingController(
  req: Request<ParamsDictionary, any, any, GetRatingReqQuery>,
  res: Response,
  next: NextFunction
) {
  const query = req.query

  await ratingService.getAllRating(res, next, query)
}

export async function getRatingByIdController(req: Request<ParamsDictionary, any, any>, res: Response) {
  const { rental_id } = req.params
  const { user_id } = req.decoded_authorization as TokenPayLoad

  const result = await ratingService.getRatingById(rental_id, user_id)
  res.json({
    message: RATING_MESSAGE.GET_RATING_SUCCESS.replace('%s', rental_id),
    result
  })
}

export async function getRatingReasonsController(req: Request, res: Response) {
  const { type, applies_to } = req.query
  const filter: Record<string, any> = {}

  if (type) {
    filter.type = type
  }
  if (applies_to) {
    filter.applies_to = applies_to
  }

  const result = await databaseService.rating_reasons.find(filter).toArray()

  res.json({
    message: RATING_MESSAGE.GET_RATING_REASONS_SUCCESS,
    result
  })
}
