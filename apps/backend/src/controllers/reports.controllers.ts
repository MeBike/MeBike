import type { NextFunction, Request, Response } from 'express'
import type { ParamsDictionary } from 'express-serve-static-core'
import type { Filter } from 'mongodb'

import { ObjectId } from 'mongodb'

import type { ReportStatus, ReportTypeEnum } from '~/constants/enums'
import type { CreateReportReqBody } from '~/models/requests/reports.requests'
import type Report from '~/models/schemas/report.schema'

import HTTP_STATUS from '~/constants/http-status'
import { REPORTS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import databaseService from '~/services/database.services'
import reportService from '~/services/report.services'
import { sendPaginatedResponse } from '~/utils/pagination.helper'
import { TokenPayLoad } from '~/models/requests/users.requests'

export async function createReportController(req: Request<ParamsDictionary, any, CreateReportReqBody>, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad

  const result = await reportService.createReport({
    userID: user_id,
    payload: req.body,
    files: req.files as Express.Multer.File[]
  })

  res.json({
    message: REPORTS_MESSAGES.CREATE_SUCCESS,
    result: { acknowledged: true, insertedId: result._id }
  })
}

export async function updateReportStatusController(req: Request<ParamsDictionary, any, any>, res: Response) {
  const { reportID } = req.params
  const newStatus = req.body.newStatus
  const assignee_id = req.body.staff_id || ''
  const priority = req.body.priority || ''

  const result = await reportService.updateReportStatus({
    reportID: reportID.toString(),
    newStatus,
    assignee_id,
    priority
  })

  res.json({
    message: REPORTS_MESSAGES.UPDATE_SUCCESS,
    result
  })
}

export async function getByIdController(req: Request<ParamsDictionary, any, any>, res: Response) {
  const reportID = req.params.reportID

  const result = await databaseService.reports.findOne({ _id: new ObjectId(reportID) })
  if (!result) {
    throw new ErrorWithStatus({
      message: REPORTS_MESSAGES.REPORT_NOT_FOUND.replace('%s', reportID),
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  res.json({
    message: REPORTS_MESSAGES.GET_BY_ID_SUCCESS.replace('%s', reportID),
    result
  })
}

export async function getAllUserReportController(req: Request, res: Response, next: NextFunction) {
  try {
    const { user_id } = req.decoded_authorization as TokenPayLoad

    const filter = {
      user_id: new ObjectId(user_id),
      status: req.query.status as ReportStatus
    }

    await sendPaginatedResponse(res, next, databaseService.reports, req.query, filter, {})
  } catch (error) {
    next(error)
  }
}

export async function getAllReportController(req: Request<any, any, any>, res: Response, next: NextFunction) {
  const filter: Filter<Report> = {}
  if (req.query.type) {
    filter.type = req.query.type as ReportTypeEnum
  }

  if (req.query.userID) {
    filter.user_id = new ObjectId(req.query.userID as string)
  }

  if (req.query.date) {
    const start = new Date(req.query.date as string)
    const end = new Date(start)
    end.setUTCHours(23, 59, 59, 999)

    filter.created_at = { $gte: start, $lte: end }
  }

  await sendPaginatedResponse(res, next, databaseService.reports, req.query, filter)
}
