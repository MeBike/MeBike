import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";

export class TechnicianTeamRepositoryError extends Data.TaggedError("TechnicianTeamRepositoryError")<
  WithGenericError
> {}

export class TechnicianTeamStationNotFound extends Data.TaggedError("TechnicianTeamStationNotFound")<{
  readonly stationId: string;
}> {}
