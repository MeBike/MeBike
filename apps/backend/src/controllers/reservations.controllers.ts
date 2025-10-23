import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { Filter, ObjectId } from 'mongodb'
import { ReservationStatus, Role } from '~/constants/enums'
import HTTP_STATUS from '~/constants/http-status'
import { RESERVATIONS_MESSAGE, USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import {
  CancelReservationReqBody,
  ConfirmReservationByStaffReqBody,
  DispatchBikeReqBody,
  ReservationParam,
  ReserveBikeReqBody
} from '~/models/requests/reservations.requests'
import { TokenPayLoad } from '~/models/requests/users.requests'
import Reservation from '~/models/schemas/reservation.schema'
import databaseService from '~/services/database.services'
import reservationsService from '~/services/reservations.services'
import { buildAdminReservationFilter } from '~/utils/filters.helper'
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

  let filter: any = {}
  if (user.role === Role.User) {
    filter.user_id = objUserId
    filter.status = ReservationStatus.Pending
  } else {
    filter = buildAdminReservationFilter(req.query)
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

export async function staffConfirmReservationController(req: Request<ReservationParam, any, ConfirmReservationByStaffReqBody>, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad;
  const reservation = req.reservation as Reservation;

  const result = await reservationsService.staffConfirmReservation({
    staff_id: toObjectId(user_id),
    reservation,
    reason: req.body.reason
  });

  res.json({
    message: RESERVATIONS_MESSAGE.STAFF_CONFIRM_SUCCESS,
    result
  });
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

  const filter: Filter<Reservation> = {
    user_id: userIdObjectId,
    status: {
      $in: [ReservationStatus.Active, ReservationStatus.Cancelled, ReservationStatus.Expired]
    }
  }
  if (req.query.status) {
    filter.status = req.query.status as ReservationStatus
  }

  const startStationId = req.query.stationId
  if (startStationId) {
    try {
      const stationObjectId = new ObjectId(startStationId as string)

      filter.station_id = stationObjectId
    } catch (error) {
      throw new ErrorWithStatus({
        message: RESERVATIONS_MESSAGE.INVALID_STATION_ID,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }
  }

  await sendPaginatedResponse(res, next, databaseService.reservations, req.query, filter)
}

export async function dispatchSameStationController(req: Request<ParamsDictionary, any, DispatchBikeReqBody>, res: Response) {
  const { user_id } = (req as any).decoded_authorization as TokenPayLoad
  const { source_station_id, destination_station_id } = req.body

  const result = await reservationsService.dispatchSameStation({
    user_id: toObjectId(user_id),
    source_id: toObjectId(source_station_id),
    destination_id: toObjectId(destination_station_id),
    bike_ids: req.dispatch_bike_ids!,
    bikes: req.dispatched_bikes!
  })

  res.json({
    message: RESERVATIONS_MESSAGE.DISPATCH_BIKE_SUCCESS,
    result
  })
}

export async function getReservationReportController(req: Request, res: Response, next: NextFunction) {
  const { startDate, endDate } = req.query

  const result = await reservationsService.getReservationReport(
    startDate as string | undefined,
    endDate as string | undefined
  )

  let reportPeriod = ''
  reportPeriod = RESERVATIONS_MESSAGE.REPORT_PERIOD_DEFAULT

  if (startDate && endDate) {
    reportPeriod = RESERVATIONS_MESSAGE.REPORT_PERIOD_FULL_RANGE.replace('%s', startDate as string).replace(
      '%s',
      endDate as string
    )
  } else if (startDate) {
    reportPeriod = RESERVATIONS_MESSAGE.REPORT_PERIOD_START_ONLY.replace('%s', startDate as string)
  } else if (endDate) {
    reportPeriod = RESERVATIONS_MESSAGE.REPORT_PERIOD_END_ONLY.replace('%s', endDate as string)
  }

  res.json({
    message: RESERVATIONS_MESSAGE.GET_REPORT_SUCCESS,
    report_period: reportPeriod,
    result
  })
}
