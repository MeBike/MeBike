import { checkSchema } from "express-validator";

import { SUPPLIER_MESSAGE } from "~/constants/messages";
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
