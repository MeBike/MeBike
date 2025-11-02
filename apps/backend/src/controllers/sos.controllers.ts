import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { Filter, ObjectId } from 'mongodb'
import { Role, SosAlertStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/http-status'
import { SOS_MESSAGE } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import {
  ConfirmSosReqBody,
  CreateSosPayload,
  CreateSosReqBody,
  DispatchSosReqBody,
  RejectSosReqBody,
  SosParam
} from '~/models/requests/sos.requests'
import { TokenPayLoad } from '~/models/requests/users.requests'
import Rental from '~/models/schemas/rental.schema'
import SosAlert from '~/models/schemas/sos-alert.schema'
import User from '~/models/schemas/user.schema'
import databaseService from '~/services/database.services'
import sosService from '~/services/sos.services'
import { sendPaginatedResponse } from '~/utils/pagination.helper'
import { toObjectId } from '~/utils/string'

export async function createSosRequestController(req: Request<ParamsDictionary, any, CreateSosReqBody>, res: Response) {
  const rental = req.rental as Rental
  const bike_id = toObjectId(rental.bike_id)
  const requester_id = toObjectId(rental.user_id)
  const payload: CreateSosPayload = {
    ...req.body,
    rental_id: rental._id as ObjectId,
    bike_id,
    requester_id
  }

  const result = await sosService.createAlert(payload)

  res.json({
    message: SOS_MESSAGE.SOS_CREATE_SUCCESS,
    result
  })
}

export async function dispatchSosController(req: Request<SosParam, any, DispatchSosReqBody>, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad
  const { agent_id } = req.body
  const { id } = req.params

  const result = await sosService.dispatchSos({
    sos_id: id,
    staff_id: user_id,
    agent_id
  })

  res.json({
    message: SOS_MESSAGE.SOS_DISPATCHED_SUCCESS,
    result
  })
}

export async function confirmSosController(req: Request<SosParam, any, ConfirmSosReqBody>, res: Response) {
  const { solvable, agent_notes, photos } = req.body
  const sos_alert = req.sos_alert as SosAlert

  const result = await sosService.confirmSos({
    sos_alert,
    solvable,
    agent_notes,
    photos
  })

  res.json({
    message: solvable ? SOS_MESSAGE.SOS_RESOLVED : SOS_MESSAGE.SOS_UNSOLVABLE,
    result
  })
}

export async function rejectSosController(req: Request<SosParam, any, RejectSosReqBody>, res: Response) {
  const { agent_notes, photos } = req.body
  const sos_alert = req.sos_alert as SosAlert

  const result = await sosService.rejectSos({
    sos_alert,
    agent_notes,
    photos
  })

  res.json({
    message: SOS_MESSAGE.SOS_REJECTED,
    result
  })
}

export async function getSosRequestsController(req: Request, res: Response, next: NextFunction) {
  const user = req.user as User
  const { status } = req.query
  const filters: Filter<SosAlert> = {}

  if (user.role === Role.Sos) {
    filters.sos_agent_id = user._id
    filters.status = SosAlertStatus.DISPATCHED
  } else if (user.role === Role.Staff) {
    if (status && typeof status === 'string') {
      if (!Object.values(SosAlertStatus).includes(status as SosAlertStatus)) {
        throw new ErrorWithStatus({
          message: SOS_MESSAGE.INVALID_STATUS,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
      filters.status = status as SosAlertStatus
    }
  }

  return sendPaginatedResponse(res, next, databaseService.sos_alerts, req.query, filters)
}

export async function getSosRequestByIdController(
  req: Request<SosParam>,
  res: Response,
) {
  const user = req.user as User
  const sos = req.sos_alert as SosAlert

  const result = await sosService.getSosRequestById(sos, user);
  
  res.json({
    message: SOS_MESSAGE.GET_REQUEST_BY_ID_SUCCESS,
    result,
  });
}