import type { Request, Response } from "express";

import type { IncreareBalanceWalletReqBody } from "~/models/requests/wallets.requests";

import { WALLETS_MESSAGE } from "~/constants/messages";
import walletService from "~/services/wallets.services";

export async function createWalletController(req: Request<any, any, any>, res: Response) {
  const user = req.decoded_authorization;
  const user_id = user?._id as string;

  const result = await walletService.createWallet(user_id);

  res.json({
    message: WALLETS_MESSAGE.CREATE_SUCCESS,
    result,
  });
}

export async function increateBalanceController(req: Request<any, any, IncreareBalanceWalletReqBody>, res: Response) {
  const user = req.decoded_authorization;
  const user_id = user?._id as string;

  const result = await walletService.increaseBalance({ user_id, payload: req.body });

  res.json({
    message: WALLETS_MESSAGE.INCREASE_BALANCE_SUCCESS.replace("%s", `${req.body.amount}`).replace("%s", user_id),
    result,
  });
}

export async function decreaseBalanceController(req: Request<any, any, IncreareBalanceWalletReqBody>, res: Response) {
  const user = req.decoded_authorization;
  const user_id = user?._id as string;

  const result = await walletService.decreaseBalance({ user_id, payload: req.body });

  res.json({
    message: WALLETS_MESSAGE.INCREASE_BALANCE_SUCCESS.replace("%s", `${req.body.amount}`).replace("%s", user_id),
    result,
  });
}

export async function changeStatusController(req: Request<any, any, any>, res: Response) {
  const user = req.decoded_authorization;
  const user_id = user?._id as string;

  const result = await walletService.changeWalletStatus(user_id, req.body.newStatus);

  res.json({
    message: WALLETS_MESSAGE.CHANGE_STATUS_SUCCESS.replace("%s", user_id),
    result,
  });
}
