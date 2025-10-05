import { checkSchema } from "express-validator";
import { start } from "node:repl";

import HTTP_STATUS from "~/constants/http-status";
import { SUPPLIER_MESSAGE } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
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
      start_date: {
        in: ["body"],
        isISO8601: {
          errorMessage: SUPPLIER_MESSAGE.START_DATE_IN_VALID,
        },
        toDate: true,
      },
      end_date: {
        in: ["body"],
        isISO8601: {
          errorMessage: SUPPLIER_MESSAGE.START_DATE_IN_VALID,
        },
        toDate: true,
        custom: {
          options: (value, { req }) => {
            const startDate = new Date(req.body.start_date);
            const endDate = new Date(value);

            if (startDate <= new Date()) {
              throw new ErrorWithStatus({
                message: SUPPLIER_MESSAGE.START_DATE_IN_PAST,
                status: HTTP_STATUS.BAD_REQUEST,
              });
            }

            if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
              throw new ErrorWithStatus({
                message: SUPPLIER_MESSAGE.START_DATE_IN_VALID,
                status: HTTP_STATUS.BAD_REQUEST,
              });
            }

            if (startDate > endDate) {
              throw new ErrorWithStatus({
                message: SUPPLIER_MESSAGE.START_DATE_AFTER,
                status: HTTP_STATUS.BAD_REQUEST,
              });
            }

            const oneMonthLater = new Date(startDate);
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

            if (endDate < oneMonthLater) {
              throw new ErrorWithStatus({ message: SUPPLIER_MESSAGE.END_DATE_1_MONTH, status: HTTP_STATUS.BAD_REQUEST });
            }

            return true;
          },
        },
      },
    },
    ["body"],
  ),
);
