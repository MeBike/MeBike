import { serverRoutes } from "@mebike/shared";

import { AuthController } from "@/http/controllers/auth.controller";

export function registerAuthRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const auth = serverRoutes.auth;

  app.openapi(auth.register, AuthController.register);

  app.openapi(auth.login, AuthController.login);

  app.openapi(auth.refresh, AuthController.refresh);

  app.openapi(auth.logout, AuthController.logout);

  app.openapi(auth.logoutAll, AuthController.logoutAll);

  app.openapi(auth.sendVerifyEmail, AuthController.sendVerifyEmail);

  app.openapi(auth.resendVerifyEmail, AuthController.resendVerifyEmail);

  app.openapi(auth.verifyEmailOtp, AuthController.verifyEmailOtp);

  app.openapi(auth.sendResetPassword, AuthController.sendResetPassword);

  app.openapi(auth.resetPassword, AuthController.resetPassword);
}
