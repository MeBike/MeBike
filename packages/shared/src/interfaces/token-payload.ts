import type { UserVerifyStatus } from "../constants";

export type TokenPayload = {
  user_id: string;
  verify: UserVerifyStatus;
};
