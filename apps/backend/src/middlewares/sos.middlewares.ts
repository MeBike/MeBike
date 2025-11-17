import { ObjectId } from 'mongodb'
import { checkSchema } from 'express-validator'
import { AUTH_MESSAGE, SOS_MESSAGE, USERS_MESSAGES } from '~/constants/messages'
import { BikeStatus, Role, SosAlertStatus } from '~/constants/enums'
import { RentalStatus } from '~/constants/enums'
import { validate } from '~/utils/validation'
import { toObjectId } from '~/utils/string'
import databaseService from '~/services/database.services'
import { ErrorWithStatus } from '~/models/errors'
import HTTP_STATUS from '~/constants/http-status'
import { TokenPayLoad } from '~/models/requests/users.requests'
import { NextFunction, Request, Response } from 'express'
import User from '~/models/schemas/user.schema'
import { canAccessSosByRole, canCancelSosByRole } from '~/utils/authorization-helper'

export const createSosAlertValidator = validate(
  checkSchema(
    {
      rental_id: {
        notEmpty: {
          errorMessage: SOS_MESSAGE.REQUIRED_RENTAL_ID,
          bail: true
        },
        isMongoId: {
          errorMessage: SOS_MESSAGE.INVALID_OBJECT_ID?.replace('%s', 'rental_id'),
          bail: true
        },
        custom: {
          options: async (value, { req }) => {
            const rentalId = toObjectId(value)
            const { user_id } = req.decoded_authorization as TokenPayLoad
            const existedSos = await databaseService.sos_alerts.findOne({
              rental_id: rentalId,
              requester_id: toObjectId(user_id),
              status: {
                $nin: [
                  SosAlertStatus.CANCELLED,
                  SosAlertStatus.REJECTED,
                  SosAlertStatus.RESOLVED,
                  SosAlertStatus.UNSOLVABLE
                ]
              }
            })

            if (existedSos) {
              throw new ErrorWithStatus({
                message: SOS_MESSAGE.EXISTED.replace('%s', value),
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            const rental = await databaseService.rentals.findOne({
              _id: rentalId
            })

            if (!rental) {
              throw new ErrorWithStatus({
                message: SOS_MESSAGE.RENTAL_NOT_FOUND.replace('%s', value),
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            if (!rental.user_id.equals(user_id)) {
              throw new ErrorWithStatus({
                message: SOS_MESSAGE.CANNOT_CREATE_REQUEST_OF_OTHER_RENTAL.replace('%s', value),
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            if (rental.status !== RentalStatus.Rented) {
              throw new ErrorWithStatus({
                message: SOS_MESSAGE.RENTAL_NOT_ACTIVE,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            req.rental = rental
            return true
          }
        }
      },
      issue: {
        notEmpty: {
          errorMessage: SOS_MESSAGE.REQUIRED_ISSUE,
          bail: true
        },
        isString: true,
        trim: true,
        isLength: {
          options: { min: 5, max: 500 },
          errorMessage: SOS_MESSAGE.INVALID_ISSUE_LENGTH
        }
      },
      latitude: {
        notEmpty: {
          errorMessage: SOS_MESSAGE.REQUIRED_LOCATION,
          bail: true
        },
        isFloat: {
          options: { min: -90, max: 90 },
          errorMessage: SOS_MESSAGE.INVALID_LATITUDE
        }
      },
      longitude: {
        notEmpty: {
          errorMessage: SOS_MESSAGE.REQUIRED_LOCATION,
          bail: true
        },
        isFloat: {
          options: { min: -180, max: 180 },
          errorMessage: SOS_MESSAGE.INVALID_LONGITUDE
        }
      }
    },
    ['body']
  )
)

const createSosValidator = (includeResolvedField = false) => {
  const baseSchema: any = {
    id: {
      in: ['params'],
      notEmpty: { errorMessage: SOS_MESSAGE.REQUIRED_ID },
      isMongoId: {
        errorMessage: SOS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'ID yêu cầu cứu hộ')
      },
      custom: {
        options: async (value: string, { req }: { req: Request }) => {
          const sos = await databaseService.sos_alerts.findOne({
            _id: toObjectId(value)
          })

          if (!sos) {
            throw new ErrorWithStatus({
              message: SOS_MESSAGE.SOS_NOT_FOUND.replace('%s', value),
              status: HTTP_STATUS.NOT_FOUND
            })
          }

          if (sos.status !== SosAlertStatus.EN_ROUTE) {
            throw new ErrorWithStatus({
              message: includeResolvedField ? SOS_MESSAGE.RESOLVE_EN_ROUTE_ONLY : SOS_MESSAGE.REJECT_EN_ROUTE_ONLY,
              status: HTTP_STATUS.BAD_REQUEST
            })
          }

          req.sos_alert = sos
          return true
        }
      }
    },
    agent_notes: {
      in: ['body'],
      notEmpty: { errorMessage: SOS_MESSAGE.REQUIRED_AGENT_NOTES },
      trim: true,
      isString: { errorMessage: SOS_MESSAGE.INVALID_NOTE },
      isLength: {
        options: { max: 500 },
        errorMessage: SOS_MESSAGE.INVALID_NOTE_LENGTH
      }
    },
    photos: {
      in: ['body'],
      optional: true,
      isArray: {
        options: { min: 1, max: 5 },
        errorMessage: SOS_MESSAGE.INVALID_PHOTOS_ARRAY
      }
    },
    'photos.*': {
      in: ['body'],
      isURL: {
        errorMessage: SOS_MESSAGE.INVALID_PHOTO_URL
      }
    }
  }

  if (includeResolvedField) {
    baseSchema.solvable = {
      in: ['body'],
      isBoolean: { errorMessage: SOS_MESSAGE.INVALID_SOLVABLE }
    }
  }

  return validate(checkSchema(baseSchema, ['params', 'body']))
}

export const resolveSosValidator = createSosValidator(true)

export const rejectSosValidator = createSosValidator(false)

export const getSosRequestByIdValidator = validate(
  checkSchema({
    id: {
      in: ['params'],
      notEmpty: {
        errorMessage: SOS_MESSAGE.REQUIRED_ID
      },
      isMongoId: {
        errorMessage: SOS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'ID yêu cầu cứu hộ')
      },
      custom: {
        options: async (value, { req }) => {
          const sos = await databaseService.sos_alerts.findOne({
            _id: toObjectId(value)
          })

          if (!sos) {
            throw new ErrorWithStatus({
              message: SOS_MESSAGE.SOS_NOT_FOUND.replace('%s', value),
              status: HTTP_STATUS.NOT_FOUND
            })
          }

          const user = req.user as User

          const isAllowed = canAccessSosByRole(user, sos)
          if (!isAllowed) {
            throw new ErrorWithStatus({
              message: AUTH_MESSAGE.ACCESS_DENIED,
              status: HTTP_STATUS.FORBIDDEN
            })
          }

          req.sos_alert = sos
          return true
        }
      }
    }
  })
)

export const isSosAgentValidator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayLoad
    const user = await databaseService.users.findOne({ _id: toObjectId(user_id) })
    if (user === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    if (user.role !== Role.Sos) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.ACCESS_DENIED_SOS_ONLY,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    req.user = user
    next()
  } catch (error) {
    let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
    let message = 'Internal Server Error'

    if (error instanceof ErrorWithStatus) {
      status = error.status
      message = error.message
    } else if (error instanceof Error) {
      message = error.message
    }
    res.status(status).json({ message })
  }
}

export const isStaffOrSosAgentValidator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayLoad
    const user = await databaseService.users.findOne({ _id: toObjectId(user_id) })
    if (user === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (![Role.Staff, Role.Sos].includes(user.role)) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.ACCESS_DENIED_STAFF_AND_SOS_ONLY,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    req.user = user
    next()
  } catch (error) {
    let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
    let message = 'Internal Server Error'

    if (error instanceof ErrorWithStatus) {
      status = error.status
      message = error.message
    } else if (error instanceof Error) {
      message = error.message
    }
    res.status(status).json({ message })
  }
}

export const assignSosAgentValidator = validate(
  checkSchema(
    {
      id: {
        in: ['params'],
        notEmpty: { errorMessage: SOS_MESSAGE.REQUIRED_ID },
        isMongoId: {
          errorMessage: SOS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'ID yêu cầu cứu hộ')
        },
        custom: {
          options: async (value, { req }) => {
            const sos = await databaseService.sos_alerts.findOne({
              _id: toObjectId(value)
            })

            if (!sos) {
              throw new ErrorWithStatus({
                message: SOS_MESSAGE.SOS_NOT_FOUND.replace('%s', value),
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            if (sos.status !== SosAlertStatus.PENDING) {
              throw new ErrorWithStatus({
                message: SOS_MESSAGE.ASSIGN_PENDING_ONLY,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            req.sos_alert = sos
            return true
          }
        }
      },
      sos_agent_id: {
        in: ['body'],
        notEmpty: {
          errorMessage: SOS_MESSAGE.REQUIRED_AGENT_ID
        },
        isMongoId: {
          errorMessage: SOS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'agent_id')
        },
        custom: {
          options: async (value) => {
            const agent = await databaseService.users.findOne({
              _id: toObjectId(value),
              role: Role.Sos
            })

            if (!agent) {
              throw new ErrorWithStatus({
                message: SOS_MESSAGE.AGENT_NOT_FOUND.replace('%s', value),
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        }
      },
      replaced_bike_id: {
        in: ['body'],
        notEmpty: {
          errorMessage: SOS_MESSAGE.REQUIRED_REPLACED_BIKE_ID
        },
        isMongoId: {
          errorMessage: SOS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'replaced_bike_id')
        },
        custom: {
          options: async (value) => {
            const bike = await databaseService.bikes.findOne({
              _id: toObjectId(value),
              status: BikeStatus.Available
            })

            if (!bike) {
              throw new ErrorWithStatus({
                message: SOS_MESSAGE.AVAILABLE_BIKE_NOT_FOUND.replace('%s', value),
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const confirmSosValidator = validate(
  checkSchema({
    id: {
      in: ['params'],
      notEmpty: {
        errorMessage: SOS_MESSAGE.REQUIRED_ID
      },
      isMongoId: {
        errorMessage: SOS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'ID yêu cầu cứu hộ')
      },
      custom: {
        options: async (value, { req }) => {
          const sos_agent_id = req.user._id as ObjectId
          const sos = await databaseService.sos_alerts.findOne({
            _id: toObjectId(value),
            status: SosAlertStatus.ASSIGNED,
            sos_agent_id
          })

          if (!sos) {
            throw new ErrorWithStatus({
              message: SOS_MESSAGE.ASSIGNED_SOS_NOT_FOUND.replace('%s', value),
              status: HTTP_STATUS.NOT_FOUND
            })
          }

          req.sos_alert = sos
          return true
        }
      }
    }
  })
)

export const cancelSosValidator = validate(
  checkSchema({
    id: {
      in: ['params'],
      notEmpty: { errorMessage: SOS_MESSAGE.REQUIRED_ID },
      isMongoId: {
        errorMessage: SOS_MESSAGE.INVALID_OBJECT_ID.replace('%s', 'ID yêu cầu cứu hộ')
      },
      custom: {
        options: async (value, { req }) => {
          const sos = await databaseService.sos_alerts.findOne({
            _id: toObjectId(value)
          })

          if (!sos) {
            throw new ErrorWithStatus({
              message: SOS_MESSAGE.SOS_NOT_FOUND.replace('%s', value),
              status: HTTP_STATUS.NOT_FOUND
            })
          }

          if (sos.status !== SosAlertStatus.PENDING) {
            throw new ErrorWithStatus({
              message: SOS_MESSAGE.CANCEL_PENDING_ONLY,
              status: HTTP_STATUS.BAD_REQUEST
            })
          }

          const canCancel = canCancelSosByRole(req.user, sos)
          if (!canCancel) {
            throw new ErrorWithStatus({
              message: SOS_MESSAGE.CANCEL_DENIED,
              status: HTTP_STATUS.FORBIDDEN
            })
          }

          req.sos_alert = sos
          return true
        }
      }
    },
    reason: {
      in: ['body'],
      notEmpty: { errorMessage: SOS_MESSAGE.REQUIRED_REASON },
      trim: true,
      isString: { errorMessage: SOS_MESSAGE.INVALID_REASON },
      isLength: {
        options: { max: 500 },
        errorMessage: SOS_MESSAGE.INVALID_REASON_LENGTH
      }
    }
  })
)

export const isStaffValidator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayLoad
    const user = await databaseService.users.findOne({ _id: toObjectId(user_id) })
    if (user === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    if (![Role.Staff].includes(user.role)) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.ACCESS_DENIED_STAFF_AND_SOS_ONLY,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    req.user = user
    next()
  } catch (error) {
    let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
    let message = 'Internal Server Error'

    if (error instanceof ErrorWithStatus) {
      status = error.status
      message = error.message
    } else if (error instanceof Error) {
      message = error.message
    }
    res.status(status).json({ message })
  }
}
