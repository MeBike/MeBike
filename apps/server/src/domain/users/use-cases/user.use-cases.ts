import { Effect } from "effect";

import type { UserRow } from "../models";

import { hashPassword } from "../../auth/services/auth.service";
import { UserServiceTag } from "../services/user.service";

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
    const passwordHash = yield* hashPassword(args.password);
    return yield* service.create({
      fullname: args.fullname,
      email: args.email,
      passwordHash,
      phoneNumber: args.phoneNumber,
      username: args.username,
      avatar: args.avatar,
      location: args.location,
      role: args.role,
      verify: args.verify,
      nfcCardUid: args.nfcCardUid,
    });
  });
}
