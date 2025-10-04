import { checkSchema } from "express-validator";

import { RENTALS_MESSAGE } from "~/constants/messages";
import { validate } from "~/utils/validation";

export const createRentalSessionValidator = validate(
  checkSchema({
    bike_id: {
      notEmpty: {
        errorMessage: RENTALS_MESSAGE.REQUIRED_BIKE_ID,
        bail: true,
      },
      isMongoId: {
        errorMessage: RENTALS_MESSAGE.INVALID_OBJECT_ID.replace("%s", "bike_id"),
      },
      custom: {
        options: (value) => {
          return true;
        },
      },
    },
    start_station: {
      notEmpty: {
        errorMessage: RENTALS_MESSAGE.REQUIRED_START_STATION,
        bail: true,

      },
      isMongoId: {
        errorMessage: RENTALS_MESSAGE.INVALID_OBJECT_ID.replace("%s", "start_station"),
      },
      custom: {
        options: (value) => {
          return true;
        },
      },
    },
    end_station: {
      optional: true,
      isMongoId: {
        errorMessage: RENTALS_MESSAGE.INVALID_OBJECT_ID.replace("%s", "end_station"),
      },
      custom: {
        options: (value) => {
          if (!value)
            return true;
        },
      },
    },
    duration: {
      optional: true,
      isFloat: {
        options: { min: 0 },
        errorMessage: RENTALS_MESSAGE.INVALID_DURATION,
      },
      toFloat: true,
    },
    total_price: {
      optional: true,
      isFloat: {
        options: { min: 0 },
        errorMessage: RENTALS_MESSAGE.INVALID_TOTAL_PRICE,
      },
      toFloat: true,
    },
  }),
);
