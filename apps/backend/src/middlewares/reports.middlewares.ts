import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'

import { ReportPriority, ReportStatus, ReportTypeEnum } from '~/constants/enums'
import HTTP_STATUS from '~/constants/http-status'
import { REPORTS_MESSAGES, USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/errors'
import { TokenPayLoad } from '~/models/requests/users.requests'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'

export async function validateReportExists(reportId: string) {
  if (!ObjectId.isValid(reportId)) {
    throw new ErrorWithStatus({
      message: REPORTS_MESSAGES.INVALID_REPORT_ID,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }

  const report = await databaseService.reports.findOne({ _id: new ObjectId(reportId) })
  if (!report) {
    throw new ErrorWithStatus({
      message: REPORTS_MESSAGES.REPORT_NOT_FOUND.replace('%s', reportId),
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  if (report.status === ReportStatus.Cancel) {
    throw new ErrorWithStatus({
      message: REPORTS_MESSAGES.NOT_ACTIVE,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }

  return report
}

export const createReportValidator = validate(
  checkSchema(
    {
      type: {
        in: ['body'],
        trim: true,
        notEmpty: {
          errorMessage: REPORTS_MESSAGES.TYPE_IS_REQUIRED
        },
        isIn: {
          options: [Object.values(ReportTypeEnum)],
          errorMessage: REPORTS_MESSAGES.INVALID_TYPE
        }
      },

      message: {
        in: ['body'],
        trim: true,
        isString: {
          errorMessage: REPORTS_MESSAGES.MESSAGE_MUST_BE_STRING
        },
        isLength: {
          options: { max: 250 },
          errorMessage: REPORTS_MESSAGES.MESSAGE_TOO_LONG
        }
      },

      bike_id: {
        in: ['body'],
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if ([ReportTypeEnum.BikeDamage, ReportTypeEnum.BikeDirty].includes(req.body.type) && !value) {
              throw new ErrorWithStatus({
                message: REPORTS_MESSAGES.BIKE_ID_IS_REQUIRED,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            if (value) {
              const bike = await databaseService.bikes.findOne({
                _id: new ObjectId(value)
              })
              if (!bike) {
                throw new ErrorWithStatus({
                  message: REPORTS_MESSAGES.BIKE_NOT_FOUND.replace('%s', value),
                  status: HTTP_STATUS.NOT_FOUND
                })
              }
            }
            return true
          }
        }
      },

      rental_id: {
        in: ['body'],
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (value) {
              const rental = await databaseService.rentals.findOne({
                _id: new ObjectId(value)
              })
              if (!rental) {
                throw new ErrorWithStatus({
                  message: REPORTS_MESSAGES.RENTAL_NOT_FOUND.replace('%s', value),
                  status: HTTP_STATUS.NOT_FOUND
                })
              }

              if (req.body.bike_id) {
                if (String(rental.bike_id) !== req.body.bike_id) {
                  throw new ErrorWithStatus({
                    message: REPORTS_MESSAGES.BIKE_NOT_IN_RENTAL.replace('%s', req.body.bike_id),
                    status: HTTP_STATUS.NOT_FOUND
                  })
                }
              }
            }
            return true
          }
        }
      },

      station_id: {
        in: ['body'],
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (
              [ReportTypeEnum.StationFull, ReportTypeEnum.StationNotAccepting, ReportTypeEnum.StationOffline].includes(
                req.body.type
              ) &&
              !value
            ) {
              throw new ErrorWithStatus({
                message: REPORTS_MESSAGES.STATION_ID_IS_REQUIRED,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            if (value) {
              const station = await databaseService.stations.findOne({
                _id: new ObjectId(value)
              })
              if (!station) {
                throw new ErrorWithStatus({
                  message: REPORTS_MESSAGES.STATION_NOT_FOUND.replace('%s', value),
                  status: HTTP_STATUS.NOT_FOUND
                })
              }
            }
            return true
          }
        }
      },
      latitude: {
        in: ['body'],
        trim: true,
        toFloat: true,
        custom: {
          options: (value, { req }) => {
            const { type } = req.body

            if ([ReportTypeEnum.SosAccident, ReportTypeEnum.SosHealth, ReportTypeEnum.SosThreat].includes(type)) {
              if (value === undefined || value === null || isNaN(value)) {
                throw new ErrorWithStatus({
                  message: REPORTS_MESSAGES.LOCATION_IS_REQUIRED,
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }
            }
            return true
          }
        }
      },
      longitude: {
        in: ['body'],
        trim: true,
        toFloat: true,
        custom: {
          options: (value, { req }) => {
            const { type } = req.body

            if ([ReportTypeEnum.SosAccident, ReportTypeEnum.SosHealth, ReportTypeEnum.SosThreat].includes(type)) {
              if (value === undefined || value === null || isNaN(value)) {
                throw new ErrorWithStatus({
                  message: REPORTS_MESSAGES.LOCATION_IS_REQUIRED,
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }
            }
            return true
          }
        }
      },
      files: {
        in: ['body'],
        optional: true,
        isArray: {
          errorMessage: REPORTS_MESSAGES.FILES_MUST_BE_ARRAY
        }
      },
      'files.*': {
        in: ['body'],
        isURL: {
          errorMessage: REPORTS_MESSAGES.FILE_MUST_BE_URL
        }
      }
    },
    ['body']
  )
)

export const updateReportValidator = validate(
  checkSchema({
    reportID: {
      in: 'params',
      trim: true,
      notEmpty: {
        errorMessage: REPORTS_MESSAGES.REPORT_ID_IS_REQUIRED
      },
      isMongoId: {
        errorMessage: REPORTS_MESSAGES.INVALID_REPORT_ID
      },
      custom: {
        options: async (value) => {
          const report = await databaseService.reports.findOne({
            _id: new ObjectId(value)
          })
          if (!report) {
            throw new ErrorWithStatus({
              status: HTTP_STATUS.NOT_FOUND,
              message: REPORTS_MESSAGES.REPORT_NOT_FOUND.replace('%s', value)
            })
          }
          return true
        }
      }
    },
    newStatus: {
      in: 'body',
      trim: true,
      notEmpty: {
        errorMessage: REPORTS_MESSAGES.STATUS_IS_REQUIRED
      },
      isIn: {
        options: [Object.values(ReportStatus)],
        errorMessage: REPORTS_MESSAGES.INVALID_NEW_STATUS
      },
      custom: {
        options: async (value, { req }) => {
          const report = await databaseService.reports.findOne({
            _id: new ObjectId(req.params?.reportID)
          })

          if (!report) {
            throw new ErrorWithStatus({
              status: HTTP_STATUS.NOT_FOUND,
              message: REPORTS_MESSAGES.REPORT_NOT_FOUND.replace('%s', value)
            })
          }

          const allowedStatuses: Record<ReportStatus, ReportStatus[]> = {
            [ReportStatus.Pending]: [ReportStatus.InProgress, ReportStatus.Cancel],
            [ReportStatus.InProgress]: [ReportStatus.Resolved, ReportStatus.CannotResolved],
            [ReportStatus.Resolved]: [],
            [ReportStatus.CannotResolved]: [],
            [ReportStatus.Cancel]: []
          }

          const currentStatus = report.status as ReportStatus

          if (!allowedStatuses[currentStatus]?.includes(value)) {
            throw new ErrorWithStatus({
              status: HTTP_STATUS.BAD_REQUEST,
              message: REPORTS_MESSAGES.INVALID_NEW_STATUS
            })
          }

          return true
        }
      }
    },
    priority: {
      in: 'body',
      trim: true,
      optional: true,
      notEmpty: {
        errorMessage: REPORTS_MESSAGES.PRIORITY_IS_REQUIRED
      },
      isIn: {
        options: [Object.values(ReportPriority)],
        errorMessage: REPORTS_MESSAGES.INVALID_PRIORITY
      }
    }
  })
)

export const staffUpdateReportValidator = validate(
  checkSchema({
    reportID: {
      in: 'params',
      trim: true,
      notEmpty: {
        errorMessage: REPORTS_MESSAGES.REPORT_ID_IS_REQUIRED
      },
      isMongoId: {
        errorMessage: REPORTS_MESSAGES.INVALID_REPORT_ID
      },
      custom: {
        options: async (value, { req }) => {
          const report = await databaseService.reports.findOne({
            _id: new ObjectId(value)
          })
          if (!report) {
            throw new ErrorWithStatus({
              status: HTTP_STATUS.NOT_FOUND,
              message: REPORTS_MESSAGES.REPORT_NOT_FOUND.replace('%s', value)
            })
          }

          const { user_id } = req.decoded_authorization as TokenPayLoad
          if (report.status !== ReportStatus.InProgress || report.assignee_id?.toString() !== user_id) {
            throw new ErrorWithStatus({
              status: HTTP_STATUS.BAD_REQUEST,
              message: REPORTS_MESSAGES.STAFF_NOT_ASSIGNED
            })
          }

          return true
        }
      }
    },
    newStatus: {
      in: 'body',
      trim: true,
      notEmpty: {
        errorMessage: REPORTS_MESSAGES.STATUS_IS_REQUIRED
      },
      isIn: {
        options: [Object.values(ReportStatus)],
        errorMessage: REPORTS_MESSAGES.INVALID_NEW_STATUS
      },
      custom: {
        options: async (value, { req }) => {
          const report = await databaseService.reports.findOne({
            _id: new ObjectId(req.params?.reportID)
          })

          if (!report) {
            throw new ErrorWithStatus({
              status: HTTP_STATUS.NOT_FOUND,
              message: REPORTS_MESSAGES.REPORT_NOT_FOUND.replace('%s', value)
            })
          }

          const allowedStatuses: Record<ReportStatus, ReportStatus[]> = {
            [ReportStatus.Pending]: [ReportStatus.InProgress, ReportStatus.Cancel],
            [ReportStatus.InProgress]: [ReportStatus.Resolved, ReportStatus.CannotResolved],
            [ReportStatus.Resolved]: [],
            [ReportStatus.CannotResolved]: [],
            [ReportStatus.Cancel]: []
          }

          const currentStatus = report.status as ReportStatus

          if (!allowedStatuses[currentStatus]?.includes(value)) {
            throw new ErrorWithStatus({
              status: HTTP_STATUS.BAD_REQUEST,
              message: REPORTS_MESSAGES.INVALID_NEW_STATUS
            })
          }

          return true
        }
      }
    },
    reason: {
      in: ['body'],
      trim: true,
      notEmpty: {
        errorMessage: REPORTS_MESSAGES.REASON_IS_REQUIRED
      },
      isString: {
        errorMessage: REPORTS_MESSAGES.REASON_INVALID
      }
    },
    files: {
      in: ['body'],
      isArray: {
        errorMessage: REPORTS_MESSAGES.FILES_MUST_BE_ARRAY
      }
    },
    'files.*': {
      in: ['body'],
      isURL: {
        errorMessage: REPORTS_MESSAGES.FILE_MUST_BE_URL
      }
    }
  })
)

export const getAllReportValidator = validate(
  checkSchema({
    type: {
      in: ['query'],
      optional: true,
      trim: true,
      notEmpty: {
        errorMessage: REPORTS_MESSAGES.TYPE_IS_REQUIRED
      },
      isIn: {
        options: [Object.values(ReportTypeEnum)],
        errorMessage: REPORTS_MESSAGES.INVALID_TYPE
      }
    },
    userID: {
      in: ['query'],
      optional: true,
      trim: true,
      notEmpty: {
        errorMessage: REPORTS_MESSAGES.USER_ID_IS_REQUIRED
      },
      isMongoId: {
        errorMessage: REPORTS_MESSAGES.USER_ID_INVALID
      },
      custom: {
        options: async (value) => {
          const findUser = await databaseService.users.findOne({ _id: new ObjectId(value) })

          if (!findUser) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.USER_NOT_FOUND,
              status: HTTP_STATUS.NOT_FOUND
            })
          }

          return true
        }
      }
    },
    date: {
      in: ['query'],
      optional: true,
      trim: true,
      isISO8601: {
        errorMessage: REPORTS_MESSAGES.DATE_IN_VALID
      },
      custom: {
        options: (value) => {
          const regrex = /^\d{4}-\d{2}-\d{2}$/
          if (!regrex.test(value)) {
            throw new ErrorWithStatus({
              message: REPORTS_MESSAGES.DATE_IN_VALID,
              status: HTTP_STATUS.BAD_REQUEST
            })
          }

          return true
        }
      }
    }
  })
)

export const getAllUserReportValidator = validate(
  checkSchema({
    status: {
      in: ['query'],
      optional: true,
      trim: true,
      notEmpty: {
        errorMessage: REPORTS_MESSAGES.STATUS_IS_REQUIRED
      },
      isIn: {
        options: [Object.values(ReportStatus)],
        errorMessage: REPORTS_MESSAGES.INVALID_STATUS
      }
    }
  })
)
