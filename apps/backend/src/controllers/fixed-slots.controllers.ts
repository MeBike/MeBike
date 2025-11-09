import { NextFunction, Request, Response } from 'express'
import { RESERVATIONS_MESSAGE } from '~/constants/messages'
import { toObjectId } from '~/utils/string'
import { TokenPayLoad } from '~/models/requests/users.requests'
import databaseService from '~/services/database.services'
import { ErrorWithStatus } from '~/models/errors'
import { FixedSlotStatus, Role } from '~/constants/enums'
import { sendPaginatedAggregationResponse } from '~/utils/pagination.helper'
import { fixedSlotTemplateService } from '~/services/fixed-slot.services'
import HTTP_STATUS from '~/constants/http-status'

export const createFixedSlotTemplateController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayLoad
  const result = await fixedSlotTemplateService.create({
    user_id: toObjectId(user_id),
    ...req.body
  })

  res.json({
    message: RESERVATIONS_MESSAGE.FS_TEMPLATE_CREATE_SUCCESS,
    result
  })
}

export const getFixedSlotTemplateByIdController = async (req: Request, res: Response) => {
  const template = req.fixedSlotTemplate!
  const result = await fixedSlotTemplateService.getDetail(template)

  res.json({
    message: RESERVATIONS_MESSAGE.FS_TEMPLATE_GET_DETAIL_SUCCESS,
    result
  })
}

export const getFixedSlotTemplateListController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayLoad
  const user = await databaseService.users.findOne({ _id: toObjectId(user_id) })
  if (!user)
    throw new ErrorWithStatus({
      message: RESERVATIONS_MESSAGE.USER_NOT_FOUND.replace('%s', user_id),
      status: HTTP_STATUS.NOT_FOUND
    })

  const match: any = {}
  if (user.role === Role.User) {
    match.user_id = toObjectId(user_id)
  }

  if (req.query.status) match.status = req.query.status
  if (req.query.station_id) match.station_id = toObjectId(req.query.station_id as string)

  const pipeline = fixedSlotTemplateService.getListPipeline(match)
  await sendPaginatedAggregationResponse(res, next, databaseService.fixedSlotTemplates, req.query, pipeline)
}

export const updateFixedSlotTemplateController = async (req: Request, res: Response) => {
  const template = req.fixedSlotTemplate!
  const result = await fixedSlotTemplateService.update(template._id!, req.body)

  res.json({
    message: RESERVATIONS_MESSAGE.FS_TEMPLATE_UPDATE_SUCCESS,
    result
  })
}

export const pauseFixedSlotTemplateController = async (req: Request, res: Response) => {
  const template = req.fixedSlotTemplate!
  const result = await fixedSlotTemplateService.updateStatus(template._id!, FixedSlotStatus.PAUSED)

  res.json({
    message: RESERVATIONS_MESSAGE.FS_TEMPLATE_PAUSE_SUCCESS,
    result
  })
}

export const resumeFixedSlotTemplateController = async (req: Request, res: Response) => {
  const template = req.fixedSlotTemplate!
  const result = await fixedSlotTemplateService.updateStatus(template._id!, FixedSlotStatus.ACTIVE)

  res.json({
    message: RESERVATIONS_MESSAGE.FS_TEMPLATE_RESUME_SUCCESS,
    result
  })
}

export const cancelFixedSlotTemplateController = async (req: Request, res: Response) => {
  const template = req.fixedSlotTemplate!
  const result = await fixedSlotTemplateService.updateStatus(template._id!, FixedSlotStatus.CANCELLED)

  res.json({
    message: RESERVATIONS_MESSAGE.FS_TEMPLATE_CANCEL_SUCCESS,
    result
  })
}
