import { Router } from "express";

import { loginController, registerController } from "~/controllers/users.controllers";
import { loginValidator, registerValidator } from "~/middlewares/users.middlewares";
import { wrapAsync } from "~/utils/handler";

const usersRouter = Router();

usersRouter.post("/login", loginValidator, wrapAsync(loginController));
usersRouter.post("/register", registerValidator, wrapAsync(registerController));

export default usersRouter;
