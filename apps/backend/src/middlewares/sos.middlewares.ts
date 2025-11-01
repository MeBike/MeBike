// validators/sosValidator.ts
import { checkSchema } from 'express-validator';
import { SOS_MESSAGE } from '~/constants/messages';
import { Role, SosAlertStatus } from '~/constants/enums';
import { RentalStatus } from '~/constants/enums';
import { validate } from '~/utils/validation';
import { toObjectId } from '~/utils/string';
import databaseService from '~/services/database.services';
import { ErrorWithStatus } from '~/models/errors';
import HTTP_STATUS from '~/constants/http-status';
import { TokenPayLoad } from '~/models/requests/users.requests';

export const createSosAlertValidator = validate(
  checkSchema(
    {
      rental_id: {
        notEmpty: {
          errorMessage: SOS_MESSAGE.REQUIRED_RENTAL_ID,
          bail: true,
        },
        isMongoId: {
          errorMessage: SOS_MESSAGE.INVALID_OBJECT_ID?.replace('%s', 'rental_id'),
          bail: true,
        },
        custom: {
          options: async (value, { req }) => {
            const rentalId = toObjectId(value);
            const { user_id } = req.decoded_authorization as TokenPayLoad
            const objUserId = toObjectId(user_id) 
            
            const rental = await databaseService.rentals.findOne({
              _id: rentalId,
              user_id: objUserId,
            });

            if (!rental) {
              throw new ErrorWithStatus({
                message: SOS_MESSAGE.RENTAL_NOT_FOUND.replace('%s', value),
                status: HTTP_STATUS.NOT_FOUND,
              });
            }

            if(rental.status !== RentalStatus.Rented){
                throw new ErrorWithStatus({
                    message: SOS_MESSAGE.RENTAL_NOT_ACTIVE,
                    status: HTTP_STATUS.BAD_REQUEST
                })
            }

            req.rental = rental;
            return true;
          },
        },
      },
      issue: {
        notEmpty: {
          errorMessage: SOS_MESSAGE.REQUIRED_ISSUE,
          bail: true,
        },
        isString: true,
        trim: true,
        isLength: {
          options: { min: 10, max: 500 },
          errorMessage: SOS_MESSAGE.INVALID_ISSUE_LENGTH,
        },
      },
      latitude: {
        notEmpty: {
          errorMessage: SOS_MESSAGE.REQUIRED_LOCATION,
          bail: true,
        },
        isFloat: {
          options: { min: -90, max: 90 },
          errorMessage: SOS_MESSAGE.INVALID_LATITUDE,
        },
      },
      longitude: {
        notEmpty: {
          errorMessage: SOS_MESSAGE.REQUIRED_LOCATION,
          bail: true,
        },
        isFloat: {
          options: { min: -180, max: 180 },
          errorMessage: SOS_MESSAGE.INVALID_LONGITUDE,
        },
      },
      staff_notes: {
        optional: true,
        trim: true,
        isString: {
          errorMessage: SOS_MESSAGE.INVALID_NOTE
        },
        isLength: {
          options: {max: 300},
          errorMessage: SOS_MESSAGE.INVALID_NOTE_LENGTH
        }
      }
    },
    ['body']
  )
);

export const dispatchSosValidator = validate(
  checkSchema(
    {
      id: {
        in: ['params'],
        notEmpty: {
          errorMessage: SOS_MESSAGE.REQUIRED_ID
        },
        isMongoId: {
          errorMessage: SOS_MESSAGE.INVALID_OBJECT_ID.replace("%s", "ID yêu cầu cứu hộ")
        },
        custom: {
          options: async (value, { req }) => {
            const sos = await databaseService.sos_alerts.findOne({
              _id: toObjectId(value),
              status: SosAlertStatus.PENDING,
            });
            if (!sos) {
              throw new ErrorWithStatus({
                message: SOS_MESSAGE.SOS_NOT_FOUND.replace("%s", value),
                status: HTTP_STATUS.NOT_FOUND,
              });
            }
            req.sos_alert = sos;
            return true;
          },
        },
      },
      agent_id: {
        in: ['body'],
        notEmpty: {
          errorMessage: SOS_MESSAGE.REQUIRED_AGENT_ID
        },
        isMongoId: {
          errorMessage: SOS_MESSAGE.INVALID_OBJECT_ID.replace("%s", "agent_id")
        },
        custom: {
          options: async (value) => {
            const agent = await databaseService.users.findOne({
              _id: toObjectId(value),
              role: Role.Sos,
            });
            if (!agent) {
              throw new ErrorWithStatus({
                message: SOS_MESSAGE.AGENT_NOT_FOUND.replace("%s", value),
                status: HTTP_STATUS.NOT_FOUND,
              });
            }
            return true;
          },
        },
      },
    },
    ['params', 'body']
  )
);