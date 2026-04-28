import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";

export class TechnicianTeamRepositoryError extends Data.TaggedError("TechnicianTeamRepositoryError")<
  WithGenericError
> {}

export class TechnicianTeamStationNotFound extends Data.TaggedError("TechnicianTeamStationNotFound")<{
  readonly stationId: string;
}> {}

export class TechnicianTeamInternalStationRequired extends Data.TaggedError("TechnicianTeamInternalStationRequired")<{
  readonly stationId: string;
  readonly stationType: "INTERNAL" | "AGENCY";
}> {}

export class TechnicianTeamStationAlreadyAssigned extends Data.TaggedError("TechnicianTeamStationAlreadyAssigned")<{
  readonly stationId: string;
  readonly teamId?: string;
}> {}

export class TechnicianTeamNotFound extends Data.TaggedError("TechnicianTeamNotFound")<{
  readonly id: string;
}> {}
