import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { Filter, ObjectId } from 'mongodb'
import { ReservationStatus, Role } from '~/constants/enums'
import HTTP_STATUS from '~/constants/http-status'
import { RESERVATIONS_MESSAGE, USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import { CancelReservationReqBody, ReservationParam, ReserveBikeReqBody } from '~/models/requests/reservations.requests'
import { TokenPayLoad } from '~/models/requests/users.requests'
import Reservation from '~/models/schemas/reservation.schema'
import databaseService from '~/services/database.services'
import reservationsService from '~/services/reservations.services'
import { sendPaginatedResponse } from '~/utils/pagination.helper'
import { toObjectId } from '~/utils/string'

export async function getReservationListController(req: Request, res: Response, next: NextFunction) {
  const { user_id } = req.decoded_authorization as TokenPayLoad
  const objUserId = toObjectId(user_id)
  const user = await databaseService.users.findOne({ _id: objUserId })
  if (!user) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  const filter: Filter<Reservation> = {}
  if (user.role === Role.User) {
    filter.user_id = objUserId
  }

  await sendPaginatedResponse(res, next, databaseService.reservations, req.query, filter)
}

export async function reserveBikeController(req: Request<ParamsDictionary, any, ReserveBikeReqBody>, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad
  const objUserId = toObjectId(user_id)
  const objBikeId = toObjectId(req.bike?._id as ObjectId)
  const objStationId = toObjectId(req.bike?.station_id as ObjectId)

  const result = await reservationsService.reserveBike({
    user_id: objUserId,
    bike_id: objBikeId,
    station_id: objStationId,
    start_time: req.body.start_time
  })
  res.json({
    message: RESERVATIONS_MESSAGE.RESERVE_SUCCESS,
    result
  })
}

export async function cancelReservationController(
  req: Request<ReservationParam, any, CancelReservationReqBody>,
  res: Response
) {
  const { user_id } = req.decoded_authorization as TokenPayLoad
  const reservation = req.reservation as Reservation

  const result = await reservationsService.cancelReservation({
    user_id: toObjectId(user_id),
    reservation,
    reason: req.body.reason
  })
  res.json({
    message: RESERVATIONS_MESSAGE.CANCEL_SUCCESS,
    result
  })
}

export async function confirmReservationController(req: Request<ReservationParam>, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad
  const reservation = req.reservation as Reservation

  const result = await reservationsService.confirmReservation({
    user_id: toObjectId(user_id),
    reservation
  })

  res.json({
    message: RESERVATIONS_MESSAGE.CONFIRM_SUCCESS,
    result
  })
}

export async function notifyExpiringReservationsController(req: Request, res: Response) {
  const result = await reservationsService.notifyExpiringReservations()
  res.json({
    message: RESERVATIONS_MESSAGE.NOTIFY_EXPIRED_RESERVATION,
    result
  })
}

export async function getReservationHistoryController(req: Request, res: Response, next: NextFunction) {
  const { user_id } = req.decoded_authorization as TokenPayLoad
  const userIdObjectId = toObjectId(user_id)

  const filter = {
    user_id: userIdObjectId,
    status: {
      $in: [ReservationStatus.Active, ReservationStatus.Cancelled, ReservationStatus.Expired]
    }
  }

  await sendPaginatedResponse(res, next, databaseService.reservations, req.query, filter)
}
