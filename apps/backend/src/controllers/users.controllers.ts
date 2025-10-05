import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";

import { ObjectId } from "mongodb";

import type { ChangePasswordReqBody, LoginReqBody, LogoutReqBody, RegisterReqBody, resetPasswordReqBody, TokenPayLoad, VerifyEmailReqBody } from "~/models/requests/users.requests";
import type User from "~/models/schemas/user.schema";

import { UserVerifyStatus } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { USERS_MESSAGES } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import databaseService from "~/services/database.services";
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

export async function resetPasswordController(req: Request<ParamsDictionary, any, resetPasswordReqBody>, res: Response) {
  const { user_id } = req.decoded_forgot_password_token as TokenPayLoad;
  const { password } = req.body;
  const result = await usersService.resetPassword({ user_id, password });
  res.json(result);
}

export async function emailVerifyTokenController(req: Request<ParamsDictionary, any, VerifyEmailReqBody>, res: Response) {
  const { user_id } = req.decoded_email_verify_token as TokenPayLoad;
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
  if (user === null) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: 404,
    });
  }
  if (user.verify === UserVerifyStatus.Verified && user.email_verify_token === "") {
    res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE,
    });
  }
  if (user.email_verify_token !== (req.body.email_verify_token as string)) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INCORRECT,
      status: HTTP_STATUS.UNAUTHORIZED,
    });
  }
  const result = await usersService.verifyEmail(user_id);
  res.json({
    message: USERS_MESSAGES.VERIFY_EMAIL_SUCCESS,
    result,
  });
}

export async function resendEmailVerifyController(req: Request, res: Response) {
  const { user_id } = (req as Request).decoded_authorization as TokenPayLoad;
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
  if (user === null) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: 404,
    });
  }
  if (user.verify === UserVerifyStatus.Verified && user.email_verify_token === "") {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE,
    });
  }
  if (user.verify === UserVerifyStatus.Banned) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_BANNED,
      status: HTTP_STATUS.FORBIDDEN,
    });
  }
  const result = await usersService.resendEmailVerify(user_id);
  res.json(result);
}

export async function changePasswordController(req: Request<ParamsDictionary, any, ChangePasswordReqBody>, res: Response, _next: NextFunction) {
  const { user_id } = req.decoded_authorization as TokenPayLoad;
  const { password } = req.body;
  const result = await usersService.changePassword(user_id, password);
  res.json(result);
}

export async function getMeController(req: Request, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad;
  const user = await usersService.getMe(user_id);
  res.json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: user,
  });
}

export async function updateMeController(req: Request, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad;
  const { body } = req;
  const result = await usersService.updateMe(user_id, body);
  res.json({
    message: USERS_MESSAGES.UPDATE_ME_SUCCESS,
    result,
  });
}
