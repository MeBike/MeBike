import { Router } from "express";

import { loginController, logoutController, registerController } from "~/controllers/users.controllers";
import { accessTokenValidator, loginValidator, refreshTokenValidator, registerValidator } from "~/middlewares/users.middlewares";
import { wrapAsync } from "~/utils/handler";

const usersRouter = Router();

usersRouter.post("/login", loginValidator, wrapAsync(loginController));
usersRouter.post("/register", registerValidator, wrapAsync(registerController));
usersRouter.post("/logout", accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController));

export default usersRouter;
