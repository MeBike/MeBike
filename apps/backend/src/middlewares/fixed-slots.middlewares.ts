import { checkSchema } from 'express-validator'
import { uniqueDates, validate } from '~/utils/validation'
import { RESERVATIONS_MESSAGE, USERS_MESSAGES } from '~/constants/messages'
import { toObjectId } from '~/utils/string'
import { NextFunction, Request, Response } from 'express'
import { FixedSlotStatus, Role } from '~/constants/enums'
import databaseService from '~/services/database.services'
import { ErrorWithStatus } from '~/models/errors'
import HTTP_STATUS from '~/constants/http-status'
import { TokenPayLoad } from '~/models/requests/users.requests'
import { getLocalTime } from '~/utils/date-time'

const makeFixedSlotTemplateIdRule = (options?: { mustBeStatus?: FixedSlotStatus }) => ({
  in: ['params'] as const,
  notEmpty: { errorMessage: RESERVATIONS_MESSAGE.REQUIRED_ID },
  isMongoId: {
    errorMessage: RESERVATIONS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'ID mẫu khung giờ')
  },
  custom: {
    options: async (value: string, { req }: { req: Request }) => {
      const template = await databaseService.fixedSlotTemplates.findOne({ _id: toObjectId(value) })
      if (!template) {
        throw new ErrorWithStatus({
          message: RESERVATIONS_MESSAGE.FS_TEMPLATE_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      const { user_id } = req.decoded_authorization as TokenPayLoad
      const user = await databaseService.users.findOne({ _id: toObjectId(user_id) })
      if (!user) {
        throw new ErrorWithStatus({
          message: RESERVATIONS_MESSAGE.USER_NOT_FOUND.replace('%s', user_id),
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      if (![Role.Admin, Role.Staff].includes(user.role) && !template.user_id.equals(user_id)) {
        throw new ErrorWithStatus({
          message: RESERVATIONS_MESSAGE.FS_TEMPLATE_CANNOT_OPERATE_OTHER,
          status: HTTP_STATUS.FORBIDDEN
        })
      }

      if (options?.mustBeStatus && template.status !== options.mustBeStatus) {
        const msg =
          options.mustBeStatus === FixedSlotStatus.ACTIVE
            ? RESERVATIONS_MESSAGE.FS_TEMPLATE_MUST_BE_ACTIVE_TO_PAUSE
            : RESERVATIONS_MESSAGE.FS_TEMPLATE_MUST_BE_PAUSED_TO_RESUME
        throw new ErrorWithStatus({ message: msg, status: HTTP_STATUS.BAD_REQUEST })
      }

      req.fixedSlotTemplate = template
      req.user = user
      return true
    }
  }
})

export const createFixedSlotTemplateValidator = validate(
  checkSchema(
    {
      station_id: {
        notEmpty: { errorMessage: RESERVATIONS_MESSAGE.FS_REQUIRED_STATION_ID },
        isMongoId: { errorMessage: RESERVATIONS_MESSAGE.INVALID_STATION_ID },
        custom: {
          options: async (value, { req }) => {
            const station = await databaseService.stations.findOne({ _id: toObjectId(value) })
            if (!station) {
              throw new ErrorWithStatus({
                message: RESERVATIONS_MESSAGE.STATION_NOT_FOUND.replace('%s', value),
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            const { user_id } = req.decoded_authorization as TokenPayLoad

            const userTemplate = await databaseService.fixedSlotTemplates.findOne({
              user_id: toObjectId(user_id),
              station_id: toObjectId(value),
              status: { $in: [FixedSlotStatus.ACTIVE, FixedSlotStatus.PAUSED] }
            })

            if (userTemplate) {
              throw new ErrorWithStatus({
                message: RESERVATIONS_MESSAGE.FS_USER_ALREADY_HAD_TEMPLATE_IN_STATION,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            return true
          }
        }
      },
      slot_start: {
        notEmpty: { errorMessage: RESERVATIONS_MESSAGE.FS_REQUIRED_SLOT_START },
        isString: true,
        matches: {
          options: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/],
          errorMessage: RESERVATIONS_MESSAGE.FS_INVALID_SLOT_START_FORMAT
        }
      },
      selected_dates: {
        notEmpty: { errorMessage: RESERVATIONS_MESSAGE.FS_REQUIRED_ONE_DATE_AT_LEAST },
        isArray: { options: { min: 1 } },
        custom: {
          options: (value: string[], {req}) => {
            const unique = uniqueDates(value)

            const invalid = unique.some((date) => !/^\d{4}-\d{2}-\d{2}$/.test(date))
            if (invalid)
              throw new ErrorWithStatus({
                message: RESERVATIONS_MESSAGE.FS_INVALID_DATE,
                status: HTTP_STATUS.BAD_REQUEST
              })

            const today = getLocalTime()
            today.setUTCHours(0, 0, 0, 0)
            const past = unique.some((date) => new Date(date) < today)
            if (past)
              throw new ErrorWithStatus({
                message: RESERVATIONS_MESSAGE.FS_PAST_DATE_NOT_ALLOWED,
                status: HTTP_STATUS.BAD_REQUEST
              })

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const getFixedSlotTemplateByIdValidator = validate(
  checkSchema({ id: makeFixedSlotTemplateIdRule() as any }, ['params'])
)

// UPDATE: Chỉ cho phép sửa slot_start, selected_dates (khi ACTIVE)
export const updateFixedSlotTemplateValidator = validate(
  checkSchema(
    {
      id: makeFixedSlotTemplateIdRule({ mustBeStatus: FixedSlotStatus.ACTIVE }) as any,
      slot_start: {
        optional: true,
        isString: true,
        matches: {
          options: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/],
          errorMessage: RESERVATIONS_MESSAGE.FS_INVALID_SLOT_START_FORMAT
        }
      },
      selected_dates: {
        optional: true,
        isArray: true,
        custom: {
          options: (value: string[]) => {
            const unique = uniqueDates(value)

            const invalid = unique.some((date) => !/^\d{4}-\d{2}-\d{2}$/.test(date))
            if (invalid)
              throw new ErrorWithStatus({
                message: RESERVATIONS_MESSAGE.FS_INVALID_DATE,
                status: HTTP_STATUS.BAD_REQUEST
              })

            const today = getLocalTime()
            today.setUTCHours(0, 0, 0, 0)
            const past = unique.some((date) => new Date(date) < today)
            if (past)
              throw new ErrorWithStatus({
                message: RESERVATIONS_MESSAGE.FS_PAST_DATE_NOT_ALLOWED,
                status: HTTP_STATUS.BAD_REQUEST
              })

            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)

export const pauseFixedSlotTemplateValidator = validate(
  checkSchema({ id: makeFixedSlotTemplateIdRule({ mustBeStatus: FixedSlotStatus.ACTIVE }) as any }, ['params'])
)

export const resumeFixedSlotTemplateValidator = validate(
  checkSchema({ id: makeFixedSlotTemplateIdRule({ mustBeStatus: FixedSlotStatus.PAUSED }) as any }, ['params'])
)

export const cancelFixedSlotTemplateValidator = validate(
  checkSchema({ id: makeFixedSlotTemplateIdRule() as any }, ['params'])
)

export const checkUserTemplateExistInStation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayLoad
    const user = await databaseService.users.findOne({ _id: toObjectId(user_id) })
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const userTemplate = await databaseService.fixedSlotTemplates.findOne({
      user_id: toObjectId(user_id),
      status: { $in: [FixedSlotStatus.ACTIVE, FixedSlotStatus.PAUSED] }
    })

    if (userTemplate) {
      throw new ErrorWithStatus({
        message: RESERVATIONS_MESSAGE.FS_USER_ALREADY_HAD_TEMPLATE_IN_STATION,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    next()
  } catch (error) {
    next(error)
  }
}
