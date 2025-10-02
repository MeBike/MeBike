import { UserRole } from "../constants";

export interface TokenPayload {
  user_id: string;
  role: UserRole;
}
