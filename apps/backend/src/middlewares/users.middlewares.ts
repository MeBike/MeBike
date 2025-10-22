import type { NextFunction, Request, Response } from "express";
import type { Meta, ParamSchema } from "express-validator";

import bcrypt from "bcryptjs";
import { checkSchema } from "express-validator";
import { JsonWebTokenError } from "jsonwebtoken";
import { capitalize } from "lodash";
import { ObjectId } from "mongodb";
import process from "node:process";

import type { TokenPayLoad } from "~/models/requests/users.requests";

import { UserVerifyStatus } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { USERS_MESSAGES } from "~/constants/messages";
import { REGEX_USERNAME } from "~/constants/regex";
import { ErrorWithStatus } from "~/models/errors";
import databaseService from "~/services/database.services";
import usersService from "~/services/users.services";
import { verifyToken } from "~/utils/jwt";
import { validate } from "~/utils/validation";

const fullNameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.FULL_NAME_IS_REQUIRED,
  },
  isString: {
    errorMessage: USERS_MESSAGES.FULL_NAME_MUST_BE_A_STRING,
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 50,
    },
    errorMessage: USERS_MESSAGES.FULL_NAME_LENGTH_MUST_BE_FROM_1_TO_50,
  },
};

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED,
  },
  isString: {
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING,
  },
  isLength: {
    options: {
      min: 8,
      max: 30,
    },
    errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_30,
  },
};

const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED,
  },
  isString: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING,
  },
  isLength: {
    options: {
      min: 8,
      max: 30,
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_8_TO_30,
  },
  custom: {
    options: (value: string, { req }: Meta) => {
      if (value !== req.body.password) {
        throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD);
      }
      return true;
    },
  },
};

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED,
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID,
        },
        trim: true,
        custom: {
          options: async (value: string, { req }: Meta) => {
            const user = await databaseService.users.findOne({ email: value });

            if (user === null) {
              throw new Error(USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT);
            }

            const isMatch = bcrypt.compareSync(req.body.password, user.password);

            if (!isMatch) {
              throw new Error(USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT);
            }

            req.user = user;
            return true;
          },
        },
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED,
        },
        isString: {
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING,
        },
        isLength: {
          options: {
            min: 8,
            max: 30,
          },
          errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_30,
        },
      },
    },
    ["body"],
  ),
);
const VIETNAMESE_PHONE_NUMBER_REGEX = /^(0[3|5|7|8|9])+([0-9]{8})\b/;
export const registerValidator = validate(
  checkSchema(
    {
      fullname: fullNameSchema,
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED,
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID,
        },
        trim: true,
        custom: {
          options: async (value: string) => {
            const isExist = await usersService.checkEmailExist(value);
            if (isExist) {
              throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS);
            }
            return true;
          },
        },
      },
      phone_number: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PHONE_NUMBER_IS_REQUIRED,
        },
        isString: {
          errorMessage: USERS_MESSAGES.PHONE_NUMBER_MUST_BE_A_STRING,
        },
        trim: true,
        custom: {
          options: (value: string) => {
            if (!VIETNAMESE_PHONE_NUMBER_REGEX.test(value)) {
              throw new Error(USERS_MESSAGES.PHONE_NUMBER_IS_INVALID);
            }
            return true;
          },
        },
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      avatar: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_A_STRING,
        },
        trim: true,
        isURL: {
          errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_VALID,
        },
      },
    },
    ["body"],
  ),
);

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            const accessToken = value.split(" ")[1];
            if (!accessToken) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED,
              });
            }
            try {
              const decoded_authorization = await verifyToken({
                token: accessToken,
                secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
              })
              ;(req as Request).decoded_authorization = decoded_authorization;
            }
            catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED,
              });
            }
            return true;
          },
        },
      },
    },
    ["headers"],
  ),
);

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string }),
                databaseService.refreshTokens.findOne({
                  token: value,
                }),
              ]);

              if (refresh_token === null) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED,
                });
              }
              ;(req as Request).decoded_refresh_token = decoded_refresh_token;
            }
            catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize((error as JsonWebTokenError).message),
                  status: HTTP_STATUS.UNAUTHORIZED,
                });
              }
              throw error;
            }
            return true;
          },
        },
      },
    },
    ["body"],
  ),
);

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED,
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID,
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({ email: value });
            if (user === null) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
              });
            }
            req.user = user;
            return true;
          },
        },
      },
    },
    ["body"],
  ),
);

export const resetPasswordValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: { errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED },
        isEmail: { errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID },
        trim: true,
      },
      otp: {
        notEmpty: { errorMessage: USERS_MESSAGES.FORGOT_PASSWORD_OTP_IS_REQUIRED },
        isString: { errorMessage: USERS_MESSAGES.FORGOT_PASSWORD_OTP_MUST_BE_A_STRING },
        isLength: { options: { min: 6, max: 6 }, errorMessage: USERS_MESSAGES.FORGOT_PASSWORD_OTP_MUST_BE_6_DIGITS },
        trim: true,
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
    },
    ["body"],
  ),
);

export const verifyEmailOtpValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: { errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED },
        isEmail: { errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID },
        trim: true,
      },
      otp: {
        notEmpty: { errorMessage: USERS_MESSAGES.EMAIL_OTP_IS_REQUIRED },
        isString: { errorMessage: USERS_MESSAGES.EMAIL_OTP_MUST_BE_A_STRING },
        isLength: { options: { min: 6, max: 6 }, errorMessage: USERS_MESSAGES.EMAIL_OTP_MUST_BE_6_DIGITS },
        trim: true,
      },
    },
    ["body"],
  ),
);

export const  checkNewPasswordValidator = validate(
  checkSchema(
    {
      password: {
        custom: {
          options: (value: string, { req }: Meta) => {
            const user = (req as Request).user;

            if (!user || !user.password) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
              });
            }

            const isSameAsOldPassword = bcrypt.compareSync(value, user.password);

            if (isSameAsOldPassword) {
              throw new Error(USERS_MESSAGES.NEW_PASSWORD_CANNOT_BE_THE_SAME_AS_OLD_PASSWORD);
            }

            return true;
          },
        },
      },
    },
    ["body"],
  ),
);

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED,
              });
            }
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
              })
              ;(req as Request).decoded_email_verify_token = decoded_email_verify_token;
            }
            catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize((error as JsonWebTokenError).message),
                  status: HTTP_STATUS.UNAUTHORIZED,
                });
              }
              throw error;
            }
            return true;
          },
        },
      },
    },
    ["body"],
  ),
);

export function verifiedUserValidator(req: Request, res: Response, next: NextFunction) {
  const { verify } = req.decoded_authorization as TokenPayLoad;
  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorWithStatus({
        message: USERS_MESSAGES.USER_IS_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN,
      }),
    );
  }
  next();
}

export const changePasswordValidator = validate(
  checkSchema(
    {
      old_password: {
        ...passwordSchema,
        custom: {
          options: async (value, { req }) => {
            const { user_id } = req.decoded_authorization as TokenPayLoad;
            const user = await databaseService.users.findOne({
              _id: new ObjectId(user_id),
            });
            if (user === null) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.UNAUTHORIZED,
              });
            }
            const isMatch = bcrypt.compareSync(value, user.password);
            if (!isMatch) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.OLD_PASSWORD_NOT_MATCH,
                status: HTTP_STATUS.UNAUTHORIZED,
              });
            }
            return true;
          },
        },
      },
      password: { ...passwordSchema, custom: {
        options: (value: string, { req }: Meta) => {
          if (value === req.body.old_password) {
            throw new Error(USERS_MESSAGES.NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_OLD_PASSWORD);
          }
          return true;
        },
      } },
      confirm_password: confirmPasswordSchema,
    },
    ["body"],
  ),
);

export const updateMeValidator = validate(
  checkSchema(
    {
      fullname: {
        optional: true,
        ...fullNameSchema,
        notEmpty: undefined,
      },
      location: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_A_STRING,
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200,
          },
          errorMessage: USERS_MESSAGES.LOCATION_LENGTH_MUST_BE_LESS_THAN_200,
        },
      },
      username: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.USERNAME_MUST_BE_A_STRING,
        },
        trim: true,
        custom: {
          options: async (value: string) => {
            if (REGEX_USERNAME.test(value) === false) {
              throw new Error(USERS_MESSAGES.USERNAME_MUST_BE_A_STRING);
            }
            const user = await databaseService.users.findOne({ username: value });

            if (user) {
              throw new Error(USERS_MESSAGES.USERNAME_ALREADY_EXISTS);
            }
            return true;
          },
        },
      },
      avatar: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_A_STRING,
        },
        trim: true,
      },
    },
    ["body"],
  ),
);

export const adminGetAllUsersValidator = validate(
  checkSchema(
    {
      fullname: {
        in: ['query'],
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.FULL_NAME_MUST_BE_A_STRING
        },
        trim: true
      },
      verify: {
        in: ['query'],
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.VERIFY_STATUS_MUST_BE_A_STRING
        },
        trim: true,
        isIn: {
          options: [Object.values(UserVerifyStatus)],
          errorMessage: USERS_MESSAGES.INVALID_VERIFY_STATUS
        }
      }
    },
    ['query']
  )
)