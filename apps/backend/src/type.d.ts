import type { TokenPayLoad } from "./models/requests/users.requests";
import type Bike from "./models/schemas/bike.schema";
import type Rental from "./models/schemas/rental.schema";
import Reservation from "./models/schemas/reservation.schema";
import type Station from "./models/schemas/station.schema";
import type User from "./models/schemas/user.schema";

declare module "express" {
  interface Request {
    // TypeScript đã tự hiểu 'Request' ở đây là của Express nên không cần import
    user?: User;
    decoded_authorization?: TokenPayLoad;
    decoded_refresh_token?: TokenPayLoad;
    decoded_email_verify_token?: TokenPayLoad;
    decoded_forgot_password_token?: TokenPayLoad;
    bike?: Bike;
    station?: Station;
    rental?: Rental;
    reservation?: Reservation;
  };
}
