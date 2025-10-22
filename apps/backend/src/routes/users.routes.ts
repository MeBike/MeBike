import { Router } from "express";

import type { UpdateMeReqBody } from "~/models/requests/users.requests";

import { adminGetAllUsersController, changePasswordController, forgotPasswordController, getMeController, loginController, logoutController, refreshController, registerController, resendEmailVerifyController, resetPasswordController, updateMeController, verifyEmailOtpController } from "~/controllers/users.controllers";
import { filterMiddleware } from "~/middlewares/common.middlewares";
import { accessTokenValidator, adminGetAllUsersValidator, changePasswordValidator, forgotPasswordValidator, loginValidator, refreshTokenValidator, registerValidator, resetPasswordValidator, updateMeValidator, verifiedUserValidator, verifyEmailOtpValidator } from "~/middlewares/users.middlewares";
import { wrapAsync } from "~/utils/handler";
import { isAdminValidator } from "~/middlewares/admin.middlewares";

const usersRouter = Router();

usersRouter.post("/login", loginValidator, wrapAsync(loginController));
usersRouter.post("/register", registerValidator, wrapAsync(registerController));
usersRouter.post("/logout", accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController));
usersRouter.post("/forgot-password", forgotPasswordValidator, wrapAsync(forgotPasswordController));
usersRouter.post(
  "/reset-password",
  resetPasswordValidator,
  wrapAsync(resetPasswordController),
);
usersRouter.post("/verify-email", verifyEmailOtpValidator, wrapAsync(verifyEmailOtpController));
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
  filterMiddleware<UpdateMeReqBody>(["fullname", "location", "username", "avatar", "phone_number"]),
  updateMeValidator,
  wrapAsync(updateMeController),
);
usersRouter.post("/refresh-token", refreshTokenValidator, wrapAsync(refreshController));
usersRouter.get("/manage-users", accessTokenValidator, isAdminValidator, adminGetAllUsersValidator, wrapAsync(adminGetAllUsersController))

export default usersRouter;
