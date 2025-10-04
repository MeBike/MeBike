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
  checkSchema(
    {
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

      bike_id: {
        in: ["body"],
        optional: true,
        isMongoId: {
          errorMessage: REPORTS_MESSAGES.INVALID_BIKE_ID,
        },
        custom: {
          options: async (value, { req }) => {
            if ([ReportTypeEnum.BikeDamage, ReportTypeEnum.BikeDirty].includes(req.body.type) && !value) {
              throw new Error(REPORTS_MESSAGES.BIKE_ID_IS_REQUIRED);
            }

            if (value) {
              const bike = await databaseService.bikes.findOne({
                _id: new ObjectId(value),
              });
              if (!bike) {
                throw new ErrorWithStatus({
                  message: REPORTS_MESSAGES.BIKE_NOT_FOUND.replace("%s", value),
                  status: HTTP_STATUS.NOT_FOUND,
                });
              }
            }
            return true;
          },
        },
      },

      rental_id: {
        in: ["body"],
        optional: true,
        isMongoId: {
          errorMessage: REPORTS_MESSAGES.INVALID_RENTAL_ID,
        },
        custom: {
          options: async (value, { req }) => {
            if (value) {
              const rental = await databaseService.rentals.findOne({
                _id: new ObjectId(value),
              });
              if (!rental) {
                throw new ErrorWithStatus({
                  message: REPORTS_MESSAGES.RENTAL_NOT_FOUND.replace("%s", value),
                  status: HTTP_STATUS.NOT_FOUND,
                });
              }

              if (req.body.bike_id) {
                if (String(rental.bike_id) !== req.body.bike_id) {
                  throw new ErrorWithStatus({
                    message: REPORTS_MESSAGES.BIKE_NOT_IN_RENTAL.replace("%s", req.body.bike_id),
                    status: HTTP_STATUS.NOT_FOUND,
                  });
                }
              }
            }
            return true;
          },
        },
      },

      station_id: {
        in: ["body"],
        optional: true,
        isMongoId: {
          errorMessage: REPORTS_MESSAGES.INVALID_STATION_ID,
        },
        custom: {
          options: async (value, { req }) => {
            if (
              [ReportTypeEnum.StationFull, ReportTypeEnum.StationNotAccepting, ReportTypeEnum.StationOffline].includes(
                req.body.type,
              )
              && !value
            ) {
              throw new ErrorWithStatus({
                message: REPORTS_MESSAGES.STATION_ID_IS_REQUIRED,
                status: HTTP_STATUS.BAD_REQUEST,
              });
            }

            if (value) {
              const station = await databaseService.stations.findOne({
                _id: new ObjectId(value),
              });
              if (!station) {
                throw new ErrorWithStatus({
                  message: REPORTS_MESSAGES.STATION_NOT_FOUND.replace("%s", value),
                  status: HTTP_STATUS.NOT_FOUND,
                });
              }
            }
            return true;
          },
        },
      },
      location: {
        in: ["body"],
        optional: true,
        custom: {
          options: (value, { req }) => {
            if (
              [ReportTypeEnum.SosAccident, ReportTypeEnum.SosHealth, ReportTypeEnum.SosThreat].includes(req.body.type)
            ) {
              if (!value || typeof value.latitude !== "number" || typeof value.longitude !== "number") {
                throw new ErrorWithStatus({
                  message: REPORTS_MESSAGES.LOCATION_IS_REQUIRED,
                  status: HTTP_STATUS.BAD_REQUEST,
                });
              }
            }
            return true;
          },
        },
      },
    },
    ["body"],
  ),
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
      in: "body",
      notEmpty: {
        errorMessage: REPORTS_MESSAGES.STATUS_IS_REQUIRED,
      },
      isIn: {
        options: [Object.values(ReportStatus)],
        errorMessage: REPORTS_MESSAGES.INVALID_NEW_STATUS,
      },
      custom: {
        options: async (value, { req }) => {
          const report = await databaseService.reports.findOne({
            _id: new ObjectId(req.params?.reportID),
          });

          if (!report) {
            throw new ErrorWithStatus({
              status: HTTP_STATUS.NOT_FOUND,
              message: REPORTS_MESSAGES.REPORT_NOT_FOUND.replace("%s", value),
            });
          }

          const allowedStauts: Record<ReportStatus, ReportStatus[]> = {
            [ReportStatus.Pending]: [ReportStatus.InProgress, ReportStatus.Cancel],
            [ReportStatus.InProgress]: [ReportStatus.Resolved],
            [ReportStatus.Resolved]: [],
            [ReportStatus.Cancel]: [],
          };

          if (!allowedStauts[report.status].includes(value)) {
            throw new ErrorWithStatus({
              status: HTTP_STATUS.BAD_REQUEST,
              message: REPORTS_MESSAGES.INVALID_NEW_STATUS,
            });
          }

          return true;
        },
      },
    },
  }),
);
