import type { NextFunction, Request, Response } from 'express'
import type { ParamsDictionary } from 'express-serve-static-core'
import type { Filter, Sort } from 'mongodb'

import { ObjectId } from 'mongodb'

import { ReportStatus, ReportTypeEnum, Role } from '~/constants/enums'
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
    payload: req.body
  })

  res.json({
    message: REPORTS_MESSAGES.CREATE_SUCCESS,
    result
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

export async function staffUpdateReportStatusController(req: Request<ParamsDictionary, any, any>, res: Response) {
  const { reportID } = req.params
  const newStatus = req.body.newStatus
  const reason = req.body.reason || ''
  const files = req.body.files || []
  const { user_id } = req.decoded_authorization as TokenPayLoad

  const result = await reportService.staffUpdateReportStatus({
    reportID: reportID.toString(),
    newStatus,
    reason,
    staffID: user_id.toString(),
    files
  })

  res.json({
    message: REPORTS_MESSAGES.UPDATE_SUCCESS,
    result
  })
}

export async function getByIdController(req: Request<ParamsDictionary, any, any>, res: Response) {
  const reportID = req.params.reportID
  const { user_id } = req.decoded_authorization as TokenPayLoad

  const result = await databaseService.reports.findOne({ _id: new ObjectId(reportID) })
  if (!result) {
    throw new ErrorWithStatus({
      message: REPORTS_MESSAGES.REPORT_NOT_FOUND.replace('%s', reportID),
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (
    result.user_id?.toString() !== user_id.toString() &&
    user?.role !== Role.Admin &&
    user?.role !== Role.Staff &&
    user?.role !== Role.Sos
  ) {
    throw new ErrorWithStatus({
      message: REPORTS_MESSAGES.ACCESS_DENIED,
      status: HTTP_STATUS.UNAUTHORIZED
    })
  }

  res.json({
    message: REPORTS_MESSAGES.GET_BY_ID_SUCCESS.replace('%s', reportID),
    result
  })
}

export async function staffGetByIdController(req: Request<ParamsDictionary, any, any>, res: Response) {
  const reportID = req.params.reportID
  const { user_id } = req.decoded_authorization as TokenPayLoad

  const result = await databaseService.reports.findOne({ _id: new ObjectId(reportID) })
  if (!result) {
    throw new ErrorWithStatus({
      message: REPORTS_MESSAGES.REPORT_NOT_FOUND.replace('%s', reportID),
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (user?.role !== Role.Sos && user?.role !== Role.Staff) {
    throw new ErrorWithStatus({
      message: REPORTS_MESSAGES.ACCESS_DENIED,
      status: HTTP_STATUS.UNAUTHORIZED
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

    const filter: Filter<Report> = {
      user_id: new ObjectId(user_id)
    }

    if (req.query.status) {
      filter.status = req.query.status as ReportStatus
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

  if (req.query.status) {
    filter.status = req.query.status as ReportStatus
  }

  const page = Number.parseInt(req.query.page as string) || 1
  const limit = Number.parseInt(req.query.limit as string) || 10
  const skip = (page - 1) * limit

  const pipeline = [
    { $match: filter },
    {
      $addFields: {
        sortPriority: {
          $switch: {
            branches: [
              { case: { $eq: ['$status', ReportStatus.InProgress] }, then: 2 },
              { case: { $eq: ['$status', ReportStatus.Resolved] }, then: 3 },
              { case: { $eq: ['$status', ReportStatus.CannotResolved] }, then: 4 },
              { case: { $eq: ['$status', ReportStatus.Pending] }, then: 1 },
              { case: { $eq: ['$status', ReportStatus.Cancel] }, then: 5 }
            ],
            default: 6
          }
        },
        sortPriorityByPriority: {
          $toInt: {
            $substrCP: ['$priority', 0, 1]
          }
        }
      }
    },
    {
      $sort: {
        sortPriority: 1,
        sortPriorityByPriority: 1,
        created_at: -1
      }
    },
    { $skip: skip },
    { $limit: limit },
    { $project: { sortPriority: 0, sortPriorityByPriority: 0 } }
  ]

  const [totalRecords, data] = await Promise.all([
    databaseService.reports.countDocuments(filter),
    databaseService.reports.aggregate<Report>(pipeline).toArray()
  ])

  const totalPages = Math.ceil(totalRecords / limit)

  return res.status(200).json({
    data: data,
    pagination: {
      limit,
      currentPage: page,
      totalPages,
      totalRecords
    }
  })
}

export async function getAllInProgressReportController(req: Request<any, any, any>, res: Response, next: NextFunction) {
  try {
    const { user_id } = req.decoded_authorization as TokenPayLoad

    const filter: Filter<Report> = {}
    filter.assignee_id = new ObjectId(user_id)

    if (req.query.date) {
      const start = new Date(req.query.date as string)
      const end = new Date(start)
      end.setUTCHours(23, 59, 59, 999)
      filter.created_at = { $gte: start, $lte: end }
    }

    if (req.query.status) {
      filter.status = req.query.status as ReportStatus
    }

    const page = Number.parseInt(req.query.page as string) || 1
    const limit = Number.parseInt(req.query.limit as string) || 10
    const skip = (page - 1) * limit

    const pipeline = [
      { $match: filter },
      {
        $addFields: {
          sortPriority: {
            $switch: {
              branches: [
                { case: { $eq: ['$status', ReportStatus.InProgress] }, then: 2 },
                { case: { $eq: ['$status', ReportStatus.Resolved] }, then: 3 },
                { case: { $eq: ['$status', ReportStatus.CannotResolved] }, then: 4 },
                { case: { $eq: ['$status', ReportStatus.Pending] }, then: 1 },
                { case: { $eq: ['$status', ReportStatus.Cancel] }, then: 5 }
              ],
              default: 6
            }
          },
          sortPriorityByPriority: {
            $toInt: {
              $substrCP: ['$priority', 0, 1]
            }
          }
        }
      },
      {
        $sort: {
          sortPriorityByPriority: 1,
          sortPriority: 1,
          created_at: -1,
        }
      },
      { $skip: skip },
      { $limit: limit },
      { $project: { sortPriority: 0, sortPriorityByPriority: 0 } }
    ]

    const [totalRecords, data] = await Promise.all([
      databaseService.reports.countDocuments(filter),
      databaseService.reports.aggregate<Report>(pipeline).toArray()
    ])

    const totalPages = Math.ceil(totalRecords / limit)

    return res.status(200).json({
      data: data,
      pagination: {
        limit,
        currentPage: page,
        totalPages,
        totalRecords
      }
    })
  } catch (error) {
    next(error)
  }
}

export async function getReportOverviewController(req: Request<any, any, any>, res: Response) {
  const result = await reportService.getReportOverview()

  res.json({
    message: REPORTS_MESSAGES.GET_REPORT_OVERVIEW_SUCCESS,
    result
  })
}
