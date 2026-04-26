import type { Effect } from "effect";

import type {
  TechnicianTeamInternalStationRequired,
  TechnicianTeamNotFound,
  TechnicianTeamStationAlreadyAssigned,
  TechnicianTeamStationNotFound,
} from "../domain-errors";
import type {
  CreateTechnicianTeamInput,
  TechnicianTeamAvailableOption,
  TechnicianTeamFilter,
  TechnicianTeamRow,
  UpdateTechnicianTeamInput,
} from "../models";

export type TechnicianTeamCommandService = {
  createTechnicianTeam: (
    input: CreateTechnicianTeamInput,
  ) => Effect.Effect<
    TechnicianTeamRow,
    TechnicianTeamStationNotFound | TechnicianTeamInternalStationRequired | TechnicianTeamStationAlreadyAssigned
  >;
  updateTechnicianTeam: (
    id: string,
    input: UpdateTechnicianTeamInput,
  ) => Effect.Effect<TechnicianTeamRow, TechnicianTeamNotFound>;
};

export type TechnicianTeamQueryService = {
  listTechnicianTeams: (
    filter?: TechnicianTeamFilter,
  ) => Effect.Effect<readonly TechnicianTeamRow[]>;
  listAvailableTechnicianTeams: (args?: {
    readonly stationId?: string;
  }) => Effect.Effect<readonly TechnicianTeamAvailableOption[]>;
};
