import { ObjectId } from 'mongodb'

import type { CreateReportReqBody } from '~/models/requests/reports.requests'

import { ReportStatus, ReportTypeEnum, ReportPriority, Role, RentalStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/http-status'
import { REPORTS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import Report, { ReportType } from '~/models/schemas/report.schema'

import databaseService from './database.services'

class ReportService {
  async createReport({ userID, payload }: { userID: string; payload: CreateReportReqBody }) {
    const reportID = new ObjectId()
    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

    const reportData: ReportType = {
      ...payload,
      _id: reportID,
      message: payload.message,
      type: payload.type,
      status: ReportStatus.Pending,
      created_at: localTime,
      latitude: payload.latitude,
      longitude: payload.longitude,
      priority: '' as ReportPriority,
      media_urls: payload.files || []
    }

    if (payload.station_id) reportData.station_id = new ObjectId(payload.station_id)
    if (payload.rental_id) reportData.rental_id = new ObjectId(payload.rental_id)
    if (userID) reportData.user_id = new ObjectId(userID)
    if (payload.bike_id) reportData.bike_id = new ObjectId(payload.bike_id)
    if (
      payload.type === ReportTypeEnum.SosAccident ||
      payload.type === ReportTypeEnum.SosHealth ||
      payload.type === ReportTypeEnum.SosThreat
    ) {
      if (!payload.rental_id) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.BAD_REQUEST,
          message: REPORTS_MESSAGES.RENTAL_ID_REQUIRED
        })
      }

      const findRental = await databaseService.rentals.findOne({ _id: new ObjectId(payload.rental_id) })
      if (!findRental) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.NOT_FOUND,
          message: REPORTS_MESSAGES.RENTAL_NOT_FOUND
        })
      }

      const existedReport = await databaseService.reports.findOne({ rental_id: new ObjectId(payload.rental_id) })
      if (existedReport) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.BAD_REQUEST,
          message: REPORTS_MESSAGES.RENTAL_ALREADY_REPORTED
        })
      }

      if (findRental.status !== RentalStatus.Rented) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.NOT_FOUND,
          message: REPORTS_MESSAGES.RENTAL_NOT_RENTED
        })
      }
      reportData.priority = ReportPriority.URGENT
    }

    const result = await databaseService.reports.insertOne(new Report(reportData))

    return result
  }

  async updateReportStatus({
    reportID,
    newStatus,
    assignee_id,
    priority
  }: {
    reportID: string
    newStatus: string
    assignee_id?: string
    priority?: string
  }) {
    const allowedStatuses: Record<ReportStatus, ReportStatus[]> = {
      [ReportStatus.Pending]: [ReportStatus.InProgress, ReportStatus.Cancel],
      [ReportStatus.InProgress]: [ReportStatus.Resolved, ReportStatus.CannotResolved],
      [ReportStatus.Resolved]: [],
      [ReportStatus.CannotResolved]: [],
      [ReportStatus.Cancel]: []
    }

    const findReport = await databaseService.reports.findOne({ _id: new ObjectId(reportID) })
    if (!findReport) {
      throw new ErrorWithStatus({
        message: REPORTS_MESSAGES.REPORT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (!Object.values(ReportStatus).includes(newStatus as ReportStatus)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: REPORTS_MESSAGES.INVALID_NEW_STATUS
      })
    }

    const currentStatus = findReport.status as ReportStatus
    const newStatusTyped = newStatus as ReportStatus

    if (!allowedStatuses[currentStatus]?.includes(newStatusTyped)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: REPORTS_MESSAGES.INVALID_NEW_STATUS
      })
    }

    const updateData: any = {
      status: newStatusTyped
    }

    if (newStatusTyped === ReportStatus.InProgress) {
      if (!assignee_id || assignee_id.trim() === '') {
        throw new ErrorWithStatus({
          message: REPORTS_MESSAGES.STAFF_ID_IS_REQUIRED,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

      const sosType = [ReportTypeEnum.SosAccident, ReportTypeEnum.SosHealth, ReportTypeEnum.SosThreat]
      if (sosType.includes(findReport.type)) {
        priority = ReportPriority.URGENT
      } else if (!priority || priority.trim() === '') {
        throw new ErrorWithStatus({
          message: REPORTS_MESSAGES.PRIORITY_IS_REQUIRED,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

      const findStaff = await databaseService.users.findOne({
        _id: new ObjectId(assignee_id)
      })
      if (!findStaff) {
        throw new ErrorWithStatus({
          message: REPORTS_MESSAGES.STAFF_NOT_FOUND.replace('%s', assignee_id),
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      if (findStaff.role !== Role.Sos && priority === ReportPriority.URGENT) {
        throw new ErrorWithStatus({
          message: REPORTS_MESSAGES.STAFF_INVALID,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
      if (findStaff.role !== Role.Sos && findStaff.role !== Role.Staff) {
        throw new ErrorWithStatus({
          message: REPORTS_MESSAGES.ASSIGNEE_INVALID,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }

      updateData.assignee_id = new ObjectId(assignee_id)
      updateData.priority = priority
    }

    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

    if (newStatusTyped === ReportStatus.Resolved) {
      updateData.updated_at = localTime
    }

    const result = await databaseService.reports.findOneAndUpdate(
      { _id: new ObjectId(reportID) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  }

  async staffUpdateReportStatus({
    reportID,
    newStatus,
    reason,
    staffID,
    files
  }: {
    reportID: string
    newStatus: string
    reason: string
    staffID: string
    files: string[]
  }) {
    const allowedStatuses: Record<ReportStatus, ReportStatus[]> = {
      [ReportStatus.Pending]: [ReportStatus.InProgress, ReportStatus.Cancel],
      [ReportStatus.InProgress]: [ReportStatus.Resolved, ReportStatus.CannotResolved],
      [ReportStatus.Resolved]: [],
      [ReportStatus.CannotResolved]: [],
      [ReportStatus.Cancel]: []
    }

    const findReport = await databaseService.reports.findOne({ _id: new ObjectId(reportID) })
    if (!findReport) {
      throw new ErrorWithStatus({
        message: REPORTS_MESSAGES.REPORT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (!Object.values(ReportStatus).includes(newStatus as ReportStatus)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: REPORTS_MESSAGES.INVALID_NEW_STATUS
      })
    }

    const currentStatus = findReport.status as ReportStatus
    const newStatusTyped = newStatus as ReportStatus
    if (
      currentStatus !== ReportStatus.InProgress &&
      (newStatusTyped === ReportStatus.Resolved || newStatusTyped === ReportStatus.CannotResolved)
    ) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: REPORTS_MESSAGES.REPORT_NOT_IN_PROGRESS
      })
    }

    if (!allowedStatuses[currentStatus]?.includes(newStatusTyped)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: REPORTS_MESSAGES.INVALID_NEW_STATUS
      })
    }

    const updateData: any = {
      status: newStatusTyped,
      files
    }

    if (newStatusTyped === ReportStatus.CannotResolved) {
      if (!reason || reason.trim() === '') {
        throw new ErrorWithStatus({
          message: REPORTS_MESSAGES.REASON_IS_REQUIRED,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
      updateData.reason = reason

      const findStaff = await databaseService.users.findOne({
        _id: new ObjectId(staffID)
      })
      if (!findStaff) {
        throw new ErrorWithStatus({
          message: REPORTS_MESSAGES.STAFF_NOT_FOUND.replace('%s', staffID),
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      if (findStaff.role !== Role.Sos && findReport.priority === ReportPriority.URGENT) {
        throw new ErrorWithStatus({
          message: REPORTS_MESSAGES.STAFF_INVALID,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
    }

    const currentDate = new Date()
    const vietnamTimezoneOffset = 7 * 60
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000)

    if (newStatusTyped === ReportStatus.Resolved) {
      updateData.updated_at = localTime
    }

    const result = await databaseService.reports.findOneAndUpdate(
      { _id: new ObjectId(reportID) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  }

  async getReportOverview() {
    const result = await databaseService.reports
      .aggregate([
        {
          $facet: {
            totalReport: [{ $count: 'total' }],
            totalCompleteReport: [{ $match: { status: ReportStatus.Resolved } }, { $count: 'total' }],
            totalInProgressReport: [{ $match: { status: ReportStatus.InProgress } }, { $count: 'total' }],
            totalCancelReport: [{ $match: { status: ReportStatus.Cancel } }, { $count: 'total' }],
            totalPendingReport: [{ $match: { status: ReportStatus.Pending } }, { $count: 'total' }],
            totalBikeReport: [
              {
                $match: {
                  type: {
                    $in: [ReportTypeEnum.BikeDamage, ReportTypeEnum.BikeDirty]
                  }
                }
              },
              { $count: 'total' }
            ],
            totalStationReport: [
              {
                $match: {
                  type: {
                    $in: [ReportTypeEnum.StationFull, ReportTypeEnum.StationNotAccepting, ReportTypeEnum.StationOffline]
                  }
                }
              },
              { $count: 'total' }
            ],
            totalSosReport: [
              {
                $match: {
                  type: {
                    $in: [ReportTypeEnum.SosAccident, ReportTypeEnum.SosHealth, ReportTypeEnum.SosThreat]
                  }
                }
              },
              { $count: 'total' }
            ],
            totalOtherReport: [{ $match: { type: ReportTypeEnum.Other } }, { $count: 'total' }]
          }
        },
        {
          $project: {
            _id: 0,
            totalCompleteReport: {
              $ifNull: [{ $arrayElemAt: ['$totalCompleteReport.total', 0] }, 0]
            },
            totalReport: {
              $ifNull: [{ $arrayElemAt: ['$totalReport.total', 0] }, 0]
            },
            totalInProgressReport: {
              $ifNull: [{ $arrayElemAt: ['$totalInProgressReport.total', 0] }, 0]
            },
            totalCancelReport: {
              $ifNull: [{ $arrayElemAt: ['$totalCancelReport.total', 0] }, 0]
            },
            totalPendingReport: {
              $ifNull: [{ $arrayElemAt: ['$totalPendingReport.total', 0] }, 0]
            },
            totalBikeReport: {
              $ifNull: [{ $arrayElemAt: ['$totalBikeReport.total', 0] }, 0]
            },
            totalStationReport: {
              $ifNull: [{ $arrayElemAt: ['$totalStationReport.total', 0] }, 0]
            },
            totalSosReport: {
              $ifNull: [{ $arrayElemAt: ['$totalSosReport.total', 0] }, 0]
            },
            totalOtherReport: {
              $ifNull: [{ $arrayElemAt: ['$totalOtherReport.total', 0] }, 0]
            }
          }
        }
      ])
      .toArray()

    return (
      result[0] || {
        totalCompleteWithdraw: 0,
        totalReport: 0,
        totalInProgressWithdraw: 0,
        totalCancelReport: 0,
        totalPendingReport: 0,
        totalBikeReport: 0,
        totalStationReport: 0,
        totalSosReport: 0,
        totalOtherReport: 0
      }
    )
  }
}

const reportService = new ReportService()
export default reportService
