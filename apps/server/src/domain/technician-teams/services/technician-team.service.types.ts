import type { Effect } from "effect";

import type {
  TechnicianTeamInternalStationRequired,
  TechnicianTeamStationNotFound,
} from "../domain-errors";
import type {
  CreateTechnicianTeamInput,
  TechnicianTeamAvailableOption,
  TechnicianTeamFilter,
  TechnicianTeamRow,
} from "../models";

export type TechnicianTeamCommandService = {
  createTechnicianTeam: (
    input: CreateTechnicianTeamInput,
  ) => Effect.Effect<
    TechnicianTeamRow,
    TechnicianTeamStationNotFound | TechnicianTeamInternalStationRequired
  >;
};

export type TechnicianTeamQueryService = {
  listTechnicianTeams: (
    filter?: TechnicianTeamFilter,
  ) => Effect.Effect<readonly TechnicianTeamRow[]>;
  listAvailableTechnicianTeams: (args?: {
    readonly stationId?: string;
  }) => Effect.Effect<readonly TechnicianTeamAvailableOption[]>;
};
