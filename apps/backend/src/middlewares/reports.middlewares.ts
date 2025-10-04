import { checkSchema } from "express-validator";
import { ObjectId } from "mongodb";

import { ReportStatus, ReportTypeEnum } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { REPORTS_MESSAGES } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import databaseService from "~/services/database.services";
import { validate } from "~/utils/validation";

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

export const createReportValidator = validate(
  checkSchema({
    bike_id: {
      in: ["body"],
      optional: true,
      notEmpty: {
        errorMessage: REPORTS_MESSAGES.BIKE_ID_IS_REQUIRED,
      },
      isMongoId: {
        errorMessage: REPORTS_MESSAGES.INVALID_BIKE_ID,
      },
      custom: {
        options: async (value) => {
          const bike = await databaseService.bikes.findOne({
            _id: new ObjectId(value),
          });
          if (!bike) {
            throw new Error(REPORTS_MESSAGES.BIKE_NOT_FOUND.replace("%s", value));
          }
          return true;
        },
      },
    },
    type: {
      in: ["body"],
      notEmpty: {
        errorMessage: REPORTS_MESSAGES.TYPE_IS_REQUIRED,
      },
      isIn: {
        options: [Object.values(ReportTypeEnum)],
        errorMessage: REPORTS_MESSAGES.INVALID_TYPE,
      },
    },
    message: {
      in: ["body"],
      isString: {
        errorMessage: REPORTS_MESSAGES.MESSAGE_MUST_BE_STRING,
      },
      isLength: {
        options: { max: 250 },
        errorMessage: REPORTS_MESSAGES.MESSAGE_TOO_LONG,
      },
      trim: true,
    },
  }),
);

export const updateReportValidator = validate(
  checkSchema({
    reportID: {
      in: "params",
      notEmpty: {
        errorMessage: REPORTS_MESSAGES.REPORT_ID_IS_REQUIRED,
      },
      isMongoId: {
        errorMessage: REPORTS_MESSAGES.INVALID_REPORT_ID,
      },
      trim: true,
      custom: {
        options: async (value) => {
          const report = await databaseService.reports.findOne({
            _id: new ObjectId(value),
          });
          if (!report) {
            throw new ErrorWithStatus({
              status: HTTP_STATUS.NOT_FOUND,
              message: REPORTS_MESSAGES.REPORT_NOT_FOUND.replace("%s", value),
            });
          }
          return true;
        },
      },
    },
    newStatus: {
      in: "params",
      notEmpty: {
        errorMessage: REPORTS_MESSAGES.STATUS_IS_REQUIRED,
      },
      isIn: {
        options: [Object.values(ReportStatus)],
        errorMessage: REPORTS_MESSAGES.INVALID_NEW_STATUS,
      },
    },
  }),
);
