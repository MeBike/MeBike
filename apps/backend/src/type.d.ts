import type { TokenPayLoad } from "./models/requests/users.requests";
import type User from "./models/schemas/user.schema";

declare module "express" {
  interface Request {
    // TypeScript đã tự hiểu 'Request' ở đây là của Express nên không cần import
    user?: User;
    decoded_authorization?: TokenPayLoad;
    decoded_refresh_token?: TokenPayLoad;
    decoded_email_verify_token?: TokenPayLoad;
    decoded_forgot_password_token?: TokenPayLoad;
  };
}
