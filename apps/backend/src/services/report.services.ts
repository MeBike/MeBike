import { ObjectId } from "mongodb";

import type { CreateReportReqBody } from "~/models/requests/reports.requests";
import type { ReportType } from "~/models/schemas/report.schema";

import { ReportStatus } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { REPORTS_MESSAGES } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import Report from "~/models/schemas/report.schema";

import databaseService from "./database.services";

class ReportService {
  async createReport({ userID, payload }: { userID: string; payload: CreateReportReqBody }) {
    const reportID = new ObjectId();
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    const reportData: ReportType = {
      ...payload,
      _id: reportID,
      message: payload.message,
      type: payload.type,
      status: ReportStatus.Pending,
      created_at: localTime,
    };

    if (payload.rental_id)
      reportData.rental_id = new ObjectId(payload.rental_id);
    if (userID)
      reportData.user_id = new ObjectId(userID);
    if (payload.bike_id)
      reportData.bike_id = new ObjectId(payload.bike_id);

    const result = await databaseService.reports.insertOne(new Report(reportData));
    return result;
  }

  async updateReportStatus({ reportID, newStatus }: { reportID: string; newStatus: ReportStatus }) {
    const validTransitions: Record<ReportStatus, ReportStatus[]> = {
      [ReportStatus.Pending]: [ReportStatus.InProgress, ReportStatus.Cancel],
      [ReportStatus.InProgress]: [ReportStatus.Resolved],
      [ReportStatus.Resolved]: [],
      [ReportStatus.Cancel]: [],
    };

    const findReport = await databaseService.reports.findOne({ _id: new ObjectId(reportID) });
    if (!findReport) {
      throw new ErrorWithStatus({
        message: REPORTS_MESSAGES.REPORT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    const currentStatus = findReport.status;
    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new ErrorWithStatus({
        message: REPORTS_MESSAGES.INVALID_NEW_STATUS,
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    const result = await databaseService.reports.findOneAndUpdate(
      { _id: new ObjectId(reportID) },
      { $set: { status: newStatus } },
      { returnDocument: "after" },
    );
    return result;
  }
}

const reportService = new ReportService();
export default reportService;
