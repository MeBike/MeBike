import { Router } from "express";

import type { UpdateMeReqBody } from "~/models/requests/users.requests";

import { changePasswordController, emailVerifyTokenController, forgotPasswordController, getMeController, loginController, logoutController, refreshController, registerController, resendEmailVerifyController, resetPasswordController, updateMeController, verifyForgotPasswordTokenController } from "~/controllers/users.controllers";
import { filterMiddleware } from "~/middlewares/common.middlewares";
import { accessTokenValidator, changePasswordValidator, checkNewPasswordValidator, emailVerifyTokenValidator, forgotPasswordValidator, loginValidator, refreshTokenValidator, registerValidator, resetPasswordValidator, updateMeValidator, verifiedUserValidator, verifyForgotPasswordTokenValidator } from "~/middlewares/users.middlewares";
import { wrapAsync } from "~/utils/handler";

const usersRouter = Router();

usersRouter.post("/login", loginValidator, wrapAsync(loginController));
usersRouter.post("/register", registerValidator, wrapAsync(registerController));
usersRouter.post("/logout", accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController));
usersRouter.post("/forgot-password", forgotPasswordValidator, wrapAsync(forgotPasswordController));
usersRouter.post(
  "/verify-forgot-password",
  verifyForgotPasswordTokenValidator,
  wrapAsync(verifyForgotPasswordTokenController),
);
usersRouter.post(
  "/reset-password",
  resetPasswordValidator,
  verifyForgotPasswordTokenValidator,
  checkNewPasswordValidator,
  wrapAsync(resetPasswordController),
);
usersRouter.post("/verify-email", emailVerifyTokenValidator, wrapAsync(emailVerifyTokenController));
usersRouter.post("/resend-verify-email", accessTokenValidator, wrapAsync(resendEmailVerifyController));
usersRouter.put(
  "/change-password",
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapAsync(changePasswordController),
);
usersRouter.get("/me", accessTokenValidator, wrapAsync(getMeController));
usersRouter.patch(
  "/me",
  accessTokenValidator,
  filterMiddleware<UpdateMeReqBody>(["fullname", "location", "username", "avatar"]),
  updateMeValidator,
  wrapAsync(updateMeController),
);
usersRouter.post("/refresh-token", refreshTokenValidator, wrapAsync(refreshController));

export default usersRouter;
