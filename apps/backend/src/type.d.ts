import { Request } from "express";

import type User from "./models/schemas/user.schema";

declare module "express" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  // prettier-ignore
  type Request = {
    user?: User;
    decoded_authorization?: TokenPayLoad;
    decoded_refresh_token?: TokenPayLoad;
    decoded_email_verify_token?: TokenPayLoad;
    decoded_forgot_password_token?: TokenPayLoad;
  };
}
