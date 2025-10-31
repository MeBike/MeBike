import type { Buffer } from 'node:buffer'

import { v2 as cloudinary } from 'cloudinary'
import { ObjectId } from 'mongodb'
import process from 'node:process'
import { Readable } from 'node:stream'
import pLimit from 'p-limit'

import type { ReportPriority } from '~/constants/enums'
import type { CreateReportReqBody } from '~/models/requests/reports.requests'
import type { ReportType } from '~/models/schemas/report.schema'

import { ReportStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/http-status'
import { REPORTS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import Report from '~/models/schemas/report.schema'

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
      [ReportStatus.InProgress]: [ReportStatus.Resolved],
      [ReportStatus.Resolved]: [],
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
      if (!priority || priority.trim() === '') {
        throw new ErrorWithStatus({
          message: REPORTS_MESSAGES.PRIORITY_IS_REQUIRED,
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
}

const reportService = new ReportService()
export default reportService
