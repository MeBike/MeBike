import { Router } from "express";
import { loginController } from "~/controllers/users.controllers";

import { loginValidator } from "~/middlewares/users.middlewares";
import { wrapAsync } from "~/utils/handler";

const usersRouter = Router();

usersRouter.post("/login", loginValidator, wrapAsync(loginController));

export default usersRouter
