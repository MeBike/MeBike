import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";

export class UserRepositoryError extends Data.TaggedError("UserRepositoryError")<
  WithGenericError
> {}

export class DuplicateUserEmail extends Data.TaggedError("DuplicateUserEmail")<{
  readonly email: string;
}> {}

export class DuplicateUserPhoneNumber extends Data.TaggedError(
  "DuplicateUserPhoneNumber",
)<{
    readonly phoneNumber: string;
  }> {}

export class InvalidCurrentPassword extends Data.TaggedError("InvalidCurrentPassword")<{
  readonly userId: string;
}> {}

export class InvalidOrgAssignment extends Data.TaggedError("InvalidOrgAssignment")<{
  readonly role: string;
  readonly stationId: string | null;
  readonly agencyId: string | null;
  readonly technicianTeamId: string | null;
}> {}

export class TechnicianTeamMemberLimitExceeded extends Data.TaggedError("TechnicianTeamMemberLimitExceeded")<{
  readonly technicianTeamId: string;
  readonly memberLimit: number;
}> {}

export class StationRoleAssignmentLimitExceeded extends Data.TaggedError("StationRoleAssignmentLimitExceeded")<{
  readonly stationId: string;
  readonly role: "STAFF" | "MANAGER";
  readonly assignmentLimit: number;
}> {}

export class InvalidStatsRange extends Data.TaggedError("InvalidStatsRange")<{
  readonly startDate: Date;
  readonly endDate: Date;
}> {}

export class InvalidStatsGroupBy extends Data.TaggedError("InvalidStatsGroupBy")<{
  readonly groupBy: string;
}> {}
