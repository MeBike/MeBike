import type { Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ObjectId } from "mongodb";

import type { LoginReqBody, LogoutReqBody, RegisterReqBody } from "~/models/requests/users.requests";
import type User from "~/models/schemas/user.schema";

import { USERS_MESSAGES } from "~/constants/messages";
import usersService from "~/services/users.services";

export async function loginController(req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) {
  const user = req.user as User;
  const user_id = user._id as ObjectId;

  const result = await usersService.login({
    user_id: user_id.toString(),
    verify: user.verify,
  });

  res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result,
  });
}

export async function registerController(req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) {
  const result = await usersService.register(req.body);
  res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result,
  });
}

export async function logoutController(req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) {
  const { refresh_token } = req.body;
  const result = await usersService.logout(refresh_token);
  res.json(result);
}

export async function forgotPasswordController(req: Request, res: Response) {
  const { _id, email, fullname, verify } = req.user as User;
  const result = await usersService.forgotPassword({
    user_id: (_id as ObjectId).toString(),
    email,
    fullname,
    verify,
  });
  res.json(result);
}

export async function verifyForgotPasswordTokenController(req: Request, res: Response) {
  res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS,
  });
}
