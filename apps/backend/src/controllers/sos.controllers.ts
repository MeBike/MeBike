import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { Filter, ObjectId } from 'mongodb'
import { Role, SosAlertStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/http-status'
import { SOS_MESSAGE, USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import {
  AssignSosReqBody,
  CancelSosReqBody,
  CreateSosReqBody,
  RejectSosReqBody,
  ResolveSosReqBody,
  SosParam
} from '~/models/requests/sos.requests'
import { TokenPayLoad } from '~/models/requests/users.requests'
import SosAlert from '~/models/schemas/sos-alert.schema'
import User from '~/models/schemas/user.schema'
import databaseService from '~/services/database.services'
import sosService from '~/services/sos.services'
import { getLocalTime } from '~/utils/date-time'
import { buildSosFilterByRole } from '~/utils/filters.helper'
import { sendPaginatedResponse } from '~/utils/pagination.helper'
import { toObjectId } from '~/utils/string'

export async function createSosRequestController(req: Request<ParamsDictionary, any, CreateSosReqBody>, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad
  const user = await databaseService.users.findOne({ _id: toObjectId(user_id) })
  if (user === null) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }
  const result = await sosService.createAlert(user._id, req.body)

  res.json({
    message: SOS_MESSAGE.SOS_CREATE_SUCCESS,
    result
  })
}

export async function assignSosAgentController(req: Request<ParamsDictionary, any, AssignSosReqBody>, res: Response) {
  const sosRequest = req.sos_alert as SosAlert
  const result = await sosService.assignSosAgent(sosRequest, req.body)

  res.json({
    message: SOS_MESSAGE.SOS_ASSIGNED_SUCCESS,
    result
  })
}

export async function confirmSosController(req: Request<SosParam>, res: Response) {
  const _id = req.sos_alert
  await databaseService.sos_alerts.updateOne(
    {_id},
    {$set: {
      status: SosAlertStatus.EN_ROUTE,
      updated_at: getLocalTime()
    }}
  )

  res.json({
    message: SOS_MESSAGE.SOS_CONFIRMED_SUCCESS,
  })
}

export async function resolveSosController(req: Request<SosParam, any, ResolveSosReqBody>, res: Response) {
  const { solvable, agent_notes, photos } = req.body
  const sos_alert = req.sos_alert as SosAlert

  const result = await sosService.resolveSos({
    sos_alert,
    solvable,
    agent_notes,
    photos
  })

  res.json({
    message: solvable ? SOS_MESSAGE.SOS_RESOLVED_SUCCESS : SOS_MESSAGE.SOS_UNSOLVABLE,
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

export async function getSosRequestsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user as User;
  const { status } = req.query;

  const filters: Filter<SosAlert> = buildSosFilterByRole(user);

  if (status && typeof status === 'string') {
    if (!Object.values(SosAlertStatus).includes(status as SosAlertStatus)) {
      throw new ErrorWithStatus({
        message: SOS_MESSAGE.INVALID_STATUS,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    if (user.role === Role.Sos) {
      if ([SosAlertStatus.PENDING, SosAlertStatus.CANCELLED].includes(status as SosAlertStatus)) {
        throw new ErrorWithStatus({
          message: SOS_MESSAGE.UNAUTHORIZED_STATUS.replace("%s", status),
          status: HTTP_STATUS.FORBIDDEN
        });
      }
    }

    filters.status = status as SosAlertStatus;
  }

  return sendPaginatedResponse(
    res,
    next,
    databaseService.sos_alerts,
    req.query,
    filters
  );
}


export async function getSosRequestByIdController(req: Request<SosParam>, res: Response) {
  const user = req.user as User
  const sos = req.sos_alert as SosAlert

  const result = await sosService.getSosRequestById(sos, user)

  res.json({
    message: SOS_MESSAGE.GET_REQUEST_BY_ID_SUCCESS,
    result
  })
}

export async function cancelSosController(req: Request<SosParam, any, CancelSosReqBody>, res: Response) {
  const _id = req.sos_alert
  await databaseService.sos_alerts.updateOne(
    {_id},
    {$set: {
      reason: req.body.reason,
      status: SosAlertStatus.CANCELLED,
      updated_at: getLocalTime()
    }}
  )

  res.json({
    message: SOS_MESSAGE.SOS_CONFIRMED_SUCCESS,
  })
}