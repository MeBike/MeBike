import { checkSchema } from "express-validator";
import { ObjectId } from "mongodb";

import { TransactionTypeEnum, WalletStatus } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { USERS_MESSAGES, WALLETS_MESSAGE } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import databaseService from "~/services/database.services";
import { validate } from "~/utils/validation";

export const increaseBalanceValidator = validate(
  checkSchema(
    {
      amount: {
        in: ["body"],
        trim: true,
        notEmpty: {
          errorMessage: WALLETS_MESSAGE.AMOUNT_IS_REQUIRED,
        },
        isFloat: {
          options: { min: 0 },
          errorMessage: WALLETS_MESSAGE.AMOUNT_NUMERIC,
        },
        custom: {
          options: async (value, { req }) => {
            const user = req.decoded_authorization;
            const user_id = user?._id;

            const findUser = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
            if (!findUser) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
              });
            }

            const findWallet = await databaseService.wallets.findOne({ user_id: new ObjectId(findUser._id) });
            if (!findWallet) {
              throw new ErrorWithStatus({
                message: WALLETS_MESSAGE.USER_NOT_HAVE_WALLET.replace("%s", user_id),
                status: HTTP_STATUS.NOT_FOUND,
              });
            }
          },
        },
      },

      type: {
        in: ["body"],
        trim: true,
        notEmpty: {
          errorMessage: WALLETS_MESSAGE.TYPE_IS_REQUIRED,
        },
        isIn: {
          options: [Object.values(TransactionTypeEnum)],
          errorMessage: WALLETS_MESSAGE.TYPE_INVALID,
        },
      },

      fee: {
        in: ["body"],
        trim: true,
        notEmpty: {
          errorMessage: WALLETS_MESSAGE.FEE_IS_REQUIRED,
        },
        isFloat: {
          options: { min: 0 },
          errorMessage: WALLETS_MESSAGE.FEE_NEGATIVE,
        },
      },
      description: {
        in: ["body"],
        trim: true,
        notEmpty: {
          errorMessage: WALLETS_MESSAGE.DESCRIPTION_IS_REQUIED,
        },
        isString: {
          errorMessage: WALLETS_MESSAGE.DESCRIPTION_INVALID,
        },
      },
      transaction_hash: {
        in: ["body"],
        trim: true,
        optional: true,
        notEmpty: {
          errorMessage: WALLETS_MESSAGE.TRANSACRION_HASH_REQUIRED,
        },
        isString: {
          errorMessage: WALLETS_MESSAGE.TRANSACRION_HASH_INVALID,
        },
      },
      message: {
        in: ["body"],
        trim: true,
        notEmpty: {
          errorMessage: WALLETS_MESSAGE.MESSAGE_IS_REQUIED,
        },
        isString: {
          errorMessage: WALLETS_MESSAGE.MESSAGE_INVALID,
        },
      },
    },
    ["body"],
  ),
);

export const decreaseBalanceValidator = validate(
  checkSchema(
    {
      amount: {
        in: ["body"],
        trim: true,
        notEmpty: {
          errorMessage: WALLETS_MESSAGE.AMOUNT_IS_REQUIRED,
        },
        isFloat: {
          options: { min: 0 },
          errorMessage: WALLETS_MESSAGE.AMOUNT_NUMERIC,
        },
        custom: {
          options: async (value, { req }) => {
            const user = req.decoded_authorization;
            const user_id = user?._id;

            const findUser = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
            if (!findUser) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND,
              });
            }

            const findWallet = await databaseService.wallets.findOne({ user_id: new ObjectId(findUser._id) });
            if (!findWallet) {
              throw new ErrorWithStatus({
                message: WALLETS_MESSAGE.USER_NOT_HAVE_WALLET.replace("%s", user_id),
                status: HTTP_STATUS.NOT_FOUND,
              });
            }

            const amount = Number.parseFloat(value.toString());
            const currentBalance = Number.parseFloat(findWallet.balance.toString());

            if (currentBalance < amount) {
              throw new ErrorWithStatus({
                message: WALLETS_MESSAGE.INSUFFICIENT_BALANCE.replace("%s", user_id),
                status: HTTP_STATUS.BAD_REQUEST,
              });
            }
          },
        },
      },

      type: {
        in: ["body"],
        trim: true,
        notEmpty: {
          errorMessage: WALLETS_MESSAGE.TYPE_IS_REQUIRED,
        },
        isIn: {
          options: [Object.values(TransactionTypeEnum)],
          errorMessage: WALLETS_MESSAGE.TYPE_INVALID,
        },
      },

      fee: {
        in: ["body"],
        trim: true,
        notEmpty: {
          errorMessage: WALLETS_MESSAGE.FEE_IS_REQUIRED,
        },
        isFloat: {
          options: { min: 0 },
          errorMessage: WALLETS_MESSAGE.FEE_NEGATIVE,
        },
      },
      description: {
        in: ["body"],
        trim: true,
        notEmpty: {
          errorMessage: WALLETS_MESSAGE.DESCRIPTION_IS_REQUIED,
        },
        isString: {
          errorMessage: WALLETS_MESSAGE.DESCRIPTION_INVALID,
        },
      },
      transaction_hash: {
        in: ["body"],
        trim: true,
        optional: true,
        notEmpty: {
          errorMessage: WALLETS_MESSAGE.TRANSACRION_HASH_REQUIRED,
        },
        isString: {
          errorMessage: WALLETS_MESSAGE.TRANSACRION_HASH_INVALID,
        },
      },
      message: {
        in: ["body"],
        trim: true,
        notEmpty: {
          errorMessage: WALLETS_MESSAGE.MESSAGE_IS_REQUIED,
        },
        isString: {
          errorMessage: WALLETS_MESSAGE.MESSAGE_INVALID,
        },
      },
    },
    ["body"],
  ),
);

export const updateWalletStatusValidator = checkSchema({
  status: {
    in: ["body"],
    trim: true,
    notEmpty: {
      errorMessage: WALLETS_MESSAGE.STATUS_IS_REQUIED,
    },
    isIn: {
      options: [[WalletStatus.Active, WalletStatus.Frozen]],
      errorMessage: WALLETS_MESSAGE.STATUS_INVALID,
    },
  },
});
