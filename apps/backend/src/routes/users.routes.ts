import { Router } from "express";

import { emailVerifyTokenController, forgotPasswordController, loginController, logoutController, registerController, resendEmailVerifyController, resetPasswordController, verifyForgotPasswordTokenController } from "~/controllers/users.controllers";
import { accessTokenValidator, checkNewPasswordValidator, emailVerifyTokenValidator, forgotPasswordValidator, loginValidator, refreshTokenValidator, registerValidator, resetPasswordValidator, verifyForgotPasswordTokenValidator } from "~/middlewares/users.middlewares";
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

export default usersRouter;
