import type { Request, Response } from 'express'
import type { NextFunction, ParamsDictionary } from 'express-serve-static-core'
import type { Filter, ObjectId } from 'mongodb'

import { GroupByOptions, RentalStatus } from '~/constants/enums'
import type {
  CancelRentalReqBody,
  CardRentalReqBody,
  CreateRentalReqBody,
  EndRentalByAdminOrStaffReqBody,
  RentalParams,
  UpdateRentalReqBody
} from '~/models/requests/rentals.requests'
import type Bike from '~/models/schemas/bike.schema'
import type Rental from '~/models/schemas/rental.schema'
import type Station from '~/models/schemas/station.schema'

import { RENTALS_MESSAGE } from '~/constants/messages'
import databaseService from '~/services/database.services'
import rentalsService from '~/services/rentals.services'
import { cardTapService } from '~/services/card-tap.service'
import { sendPaginatedAggregationResponse, sendPaginatedResponse } from '~/utils/pagination.helper'
import { toObjectId } from '~/utils/string'
import { TokenPayLoad } from '~/models/requests/users.requests'

export async function createRentalSessionController(
  req: Request<ParamsDictionary, any, CreateRentalReqBody>,
  res: Response
) {
  const { user_id } = req.decoded_authorization as TokenPayLoad
  const station = req.station as Station
  const bike = req.bike as Bike

  const result = await rentalsService.createRentalSession({
    user_id,
    start_station: station._id as ObjectId,
    bike_id: bike._id as ObjectId
  })
  res.json({
    message: RENTALS_MESSAGE.CREATE_SESSION_SUCCESS,
    result
  })
}

export async function createRentalFromCardController(
  req: Request<ParamsDictionary, any, CardRentalReqBody>,
  res: Response
) {
  const { chip_id, card_uid } = req.body

  const { mode, rental } = await cardTapService.handleCardTap({ chip_id, card_uid })

  res.json({
    message: mode === 'ended'
      ? 'Rental session ended successfully via card.'
      : 'Rental session started successfully via card.',
    mode,
    result: rental
  })
}

export async function endRentalSessionController(req: Request<RentalParams>, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad

  const rental = req.rental! as Rental

  const result = await rentalsService.endRentalSession({ user_id: toObjectId(user_id), rental })
  res.json({
    message: RENTALS_MESSAGE.END_SESSION_SUCCESS,
    result
  })
}

export async function endRentalByAdminOrStaffController(
  req: Request<RentalParams, any, EndRentalByAdminOrStaffReqBody>,
  res: Response
) {
  const { user_id } = req.decoded_authorization as TokenPayLoad

  const rental = req.rental! as Rental

  const result = await rentalsService.endRentalByAdminOrStaff({
    user_id: toObjectId(user_id),
    rental,
    payload: req.body
  })
  res.json({
    message: RENTALS_MESSAGE.END_SESSION_SUCCESS,
    result
  })
}

export async function getMyRentalsController(req: Request, res: Response, next: NextFunction) {
  const { user_id } = req.decoded_authorization as TokenPayLoad

  const filters: Filter<Rental> = {}
  filters.user_id = toObjectId(user_id)
  if (req.query.start_station) {
    filters.start_station = toObjectId(req.query.start_station.toString())
  }
  if (req.query.end_station) {
    filters.end_station = toObjectId(req.query.end_station.toString())
  }
  if (req.query.status) {
    filters.status = req.query.status as RentalStatus
  }
  await sendPaginatedResponse(res, next, databaseService.rentals, req.query, filters)
}

export async function getMyDetailRentalController(req: Request<RentalParams>, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad

  const result = await rentalsService.getMyDetailRental({ user_id: toObjectId(user_id), rental_id: req.params.id })
  res.json({
    message: RENTALS_MESSAGE.GET_DETAIL_SUCCESS,
    result
  })
}

export async function getMyCurrentRentalsController(req: Request<RentalParams>, res: Response, next: NextFunction) {
  const { user_id } = req.decoded_authorization as TokenPayLoad
  const filter: Filter<Rental> = {
    user_id: toObjectId(user_id),
    status: RentalStatus.Rented
  }

  await sendPaginatedResponse(res, next, databaseService.rentals, req.query, filter)
}

// staff/admin only
export async function getAllRentalsController(req: Request, res: Response, next: NextFunction) {
  const filters: Filter<Rental> = {}
  if (req.query.start_station) {
    filters.start_station = toObjectId(req.query.start_station.toString())
  }
  if (req.query.end_station) {
    filters.end_station = toObjectId(req.query.end_station.toString())
  }
  if (req.query.status) {
    filters.status = req.query.status as RentalStatus
  }
  await sendPaginatedResponse(res, next, databaseService.rentals, req.query, filters)
}

export async function getDetailRentalController(req: Request<RentalParams>, res: Response) {
  const result = await rentalsService.getDetailRental({ rental_id: req.params.id })
  res.json({
    message: RENTALS_MESSAGE.GET_DETAIL_SUCCESS,
    result
  })
}

export async function updateDetailRentalController(
  req: Request<RentalParams, any, UpdateRentalReqBody>,
  res: Response
) {
  const { user_id } = req.decoded_authorization as TokenPayLoad
  const result = await rentalsService.updateDetailRental({
    rental_id: req.params.id,
    admin_id: user_id,
    payload: req.body
  })
  res.json({
    message: RENTALS_MESSAGE.UPDATE_DETAIL_SUCCESS,
    result
  })
}

export async function cancelRentalController(req: Request<RentalParams, any, CancelRentalReqBody>, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad
  const result = await rentalsService.cancelRental({ rental_id: req.params.id, admin_id: user_id, payload: req.body })
  res.json({
    message: RENTALS_MESSAGE.CANCEL_RENTAL_SUCCESS,
    result
  })
}

export async function getRentalRevenueController(req: Request, res: Response) {
  const { from, to, groupBy } = req.query
  const result = await rentalsService.getRentalRevenue({
    from: from as string,
    to: to as string,
    groupBy: groupBy as GroupByOptions
  })
  res.json({
    message: RENTALS_MESSAGE.GET_REVENUE_SUCCESS,
    result
  })
}

export async function getStationActivityController(req: Request, res: Response) {
  const { from, to, stationId } = req.query
  const result = await rentalsService.getStationActivity({
    from: from as string,
    to: to as string,
    stationId: stationId as string
  })
  res.json({
    message: RENTALS_MESSAGE.GET_STATION_ACTIVITY_SUCCESS,
    result
  })
}

export async function getReservationsStatisticController(req: Request, res: Response) {
  const { from, to, groupBy } = req.query
  const result = await rentalsService.getReservationsStatistic({
    from: from as string,
    to: to as string,
    groupBy: groupBy as GroupByOptions
  })
  res.json({
    message: RENTALS_MESSAGE.GET_RESERVATIONS_STATISTIC_SUCCESS,
    result
  })
}

export async function getRentalsByStationIdController(req: Request, res: Response, next: NextFunction) {
  const { id: stationId } = req.params
  const { status, expired_within } = req.query
  const pipeline = await rentalsService.getRentalsByStationIdPipeline({
    stationId,
    status: status as RentalStatus,
    expired_within: (expired_within as string) ?? '60'
  })
  return sendPaginatedAggregationResponse(res, next, databaseService.rentals, req.query, pipeline)
}
