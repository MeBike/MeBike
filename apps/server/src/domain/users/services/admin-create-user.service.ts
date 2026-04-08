import { Effect } from "effect";

import type { UserRow } from "../models";

import { hashPassword } from "../../auth/services/auth.service";
import { UserCommandServiceTag } from "./user-command.live";

export function adminCreateUserUseCase(args: {
  fullname: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
  username?: string | null;
  avatar?: string | null;
  location?: string | null;
  role?: import("../models").UserRow["role"];
  accountStatus?: import("../models").UserRow["accountStatus"];
  verify?: import("../models").UserRow["verify"];
  orgAssignment?: import("../models").UserOrgAssignmentPatch | null;
  nfcCardUid?: string | null;
}): Effect.Effect<
  UserRow,
  import("../domain-errors").DuplicateUserEmail
    | import("../domain-errors").DuplicateUserPhoneNumber
    | import("../domain-errors").InvalidOrgAssignment
    | import("../domain-errors").StationRoleAssignmentLimitExceeded
    | import("../domain-errors").TechnicianTeamMemberLimitExceeded,
  UserCommandServiceTag
> {
  return Effect.gen(function* () {
    const service = yield* UserCommandServiceTag;
    const { password, ...rest } = args;
    const passwordHash = yield* hashPassword(password);
    return yield* service.create({ ...rest, passwordHash });
  });
}
