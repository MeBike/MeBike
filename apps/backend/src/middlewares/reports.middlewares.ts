import { ObjectId } from "mongodb";

import { ReportStatus } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { REPORTS_MESSAGES } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import databaseService from "~/services/database.services";

export async function validateReportExists(reportId: string) {
  if (!ObjectId.isValid(reportId)) {
    throw new ErrorWithStatus({
      message: REPORTS_MESSAGES.INVALID_REPORT_ID,
      status: HTTP_STATUS.BAD_REQUEST,
    });
  }

  const report = await databaseService.reports.findOne({ _id: new ObjectId(reportId) });
  if (!report) {
    throw new ErrorWithStatus({
      message: REPORTS_MESSAGES.REPORT_NOT_FOUND.replace("%s", reportId),
      status: HTTP_STATUS.NOT_FOUND,
    });
  }

  if (report.status === ReportStatus.Cancel) {
    throw new ErrorWithStatus({
      message: REPORTS_MESSAGES.NOT_ACTIVE,
      status: HTTP_STATUS.BAD_REQUEST,
    });
  }

  return report;
}
