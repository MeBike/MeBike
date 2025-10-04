import type { Request } from "express";
import type { Meta, ParamSchema } from "express-validator";

import bcrypt from "bcryptjs";
import { checkSchema } from "express-validator";

import { USERS_MESSAGES } from "~/constants/messages";
import databaseService from "~/services/database.services";
import usersService from "~/services/users.services";
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

export const registerValidator = validate(
  checkSchema(
    {
      full_name: fullNameSchema,
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
