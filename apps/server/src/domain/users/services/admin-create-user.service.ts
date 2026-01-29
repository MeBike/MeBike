import { Effect } from "effect";

import type { UserRow } from "../models";

import { hashPassword } from "../../auth/services/auth.service";
import { UserServiceTag } from "./user.service";

export function adminCreateUserUseCase(args: {
  fullname: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
  username?: string | null;
  avatar?: string | null;
  location?: string | null;
  role?: import("../models").UserRow["role"];
  verify?: import("../models").UserRow["verify"];
  nfcCardUid?: string | null;
}): Effect.Effect<
  UserRow,
  import("../domain-errors").UserRepositoryError
    | import("../domain-errors").DuplicateUserEmail
    | import("../domain-errors").DuplicateUserPhoneNumber,
  UserServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* UserServiceTag;
    const { password, ...rest } = args;
    const passwordHash = yield* hashPassword(password);
    return yield* service.create({ ...rest, passwordHash });
  });
}
