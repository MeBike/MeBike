import { checkSchema } from "express-validator";
import { ObjectId } from "mongodb";

import { SupplierStatus } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { SUPPLIER_MESSAGE } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import databaseService from "~/services/database.services";
import { validate } from "~/utils/validation";

export const createSupplierValidator = validate(
  checkSchema(
    {
      name: {
        in: ["body"],
        trim: true,
        notEmpty: {
          errorMessage: SUPPLIER_MESSAGE.NAME_IS_REQUIRED,
        },
        isString: {
          errorMessage: SUPPLIER_MESSAGE.NAME_IN_VALID,
        },
        isLength: {
          options: { max: 255 },
          errorMessage: SUPPLIER_MESSAGE.NAME_TOO_LONG,
        },
      },
      address: {
        in: ["body"],
        trim: true,
        isString: {
          errorMessage: SUPPLIER_MESSAGE.ADDRESS_IN_VALID,
        },
        isLength: {
          options: { max: 250 },
          errorMessage: SUPPLIER_MESSAGE.ADDRESS_TOO_LONG,
        },
      },
      phone_number: {
        in: ["body"],
        isString: {
          errorMessage: SUPPLIER_MESSAGE.ADDRESS_IN_VALID,
        },
        matches: {
          options: [/^\d{10}$/],
          errorMessage: SUPPLIER_MESSAGE.PHONE_NUMBER_INVALID,
        },
      },
      contract_fee: {
        in: ["body"],
        isDecimal: {
          options: { decimal_digits: "1,2" },
          errorMessage: SUPPLIER_MESSAGE.FEE_IN_VALID,
        },
      },
    },
    ["body"],
  ),
);

export const updateSupplierValidator = validate(
  checkSchema(
    {
      id: {
        in: ["params"],
        trim: true,
        notEmpty: {
          errorMessage: SUPPLIER_MESSAGE.SUPPLIER_ID_IS_REQUIRED,
        },
        isMongoId: {
          errorMessage: SUPPLIER_MESSAGE.SUPPLIER_ID_IN_VALID,
        },
        custom: {
          options: async (value: string) => {
            const findSupplier = await databaseService.suppliers.findOne(new ObjectId(value));

            if (!findSupplier) {
              throw new ErrorWithStatus({
                message: SUPPLIER_MESSAGE.SUPPLIER_NOT_FOUND.replace("%s", value),
                status: HTTP_STATUS.NOT_FOUND,
              });
            }
          },
        },
      },
      name: {
        in: ["body"],
        optional: true,
        trim: true,
        notEmpty: {
          errorMessage: SUPPLIER_MESSAGE.NAME_IS_REQUIRED,
        },
        isString: {
          errorMessage: SUPPLIER_MESSAGE.NAME_IN_VALID,
        },
        isLength: {
          options: { max: 255 },
          errorMessage: SUPPLIER_MESSAGE.NAME_TOO_LONG,
        },
      },
      address: {
        in: ["body"],
        optional: true,
        trim: true,
        isString: {
          errorMessage: SUPPLIER_MESSAGE.ADDRESS_IN_VALID,
        },
        isLength: {
          options: { max: 250 },
          errorMessage: SUPPLIER_MESSAGE.ADDRESS_TOO_LONG,
        },
      },
      phone_number: {
        in: ["body"],
        optional: true,
        isString: {
          errorMessage: SUPPLIER_MESSAGE.ADDRESS_IN_VALID,
        },
        matches: {
          options: [/^\d{10}$/],
          errorMessage: SUPPLIER_MESSAGE.PHONE_NUMBER_INVALID,
        },
      },
      contract_fee: {
        in: ["body"],
        optional: true,
        isDecimal: {
          options: { decimal_digits: "1,2" },
          errorMessage: SUPPLIER_MESSAGE.FEE_IN_VALID,
        },
      },
    },
    ["body"],
  ),
);

export const updateSupplierStatusValidator = validate(
  checkSchema(
    {
      id: {
        in: ["params"],
        trim: true,
        notEmpty: {
          errorMessage: SUPPLIER_MESSAGE.SUPPLIER_ID_IS_REQUIRED,
        },
        isMongoId: {
          errorMessage: SUPPLIER_MESSAGE.SUPPLIER_ID_IN_VALID,
        },
        custom: {
          options: async (value: string) => {
            const findSupplier = await databaseService.suppliers.findOne(new ObjectId(value));

            if (!findSupplier) {
              throw new ErrorWithStatus({
                message: SUPPLIER_MESSAGE.SUPPLIER_NOT_FOUND.replace("%s", value),
                status: HTTP_STATUS.NOT_FOUND,
              });
            }
          },
        },
      },
      newStatus: {
        in: ["body"],
        trim: true,
        notEmpty: {
          errorMessage: SUPPLIER_MESSAGE.STATUS_IS_REQUIRED,
        },
        isString: {
          errorMessage: SUPPLIER_MESSAGE.STATUS_MUST_BE_STRING,
        },
        custom: {
          options: (value) => {
            if (!Object.values(SupplierStatus).includes(value)) {
              throw new ErrorWithStatus({
                message: SUPPLIER_MESSAGE.STATUS_INVALID,
                status: HTTP_STATUS.BAD_REQUEST,
              });
            }

            return true;
          },
        },
      },
    },
    ["body"],
  ),
);
