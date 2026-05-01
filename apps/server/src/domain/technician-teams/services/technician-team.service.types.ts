import type { Effect } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  TechnicianTeamInternalStationRequired,
  TechnicianTeamNotFound,
  TechnicianTeamStationAlreadyAssigned,
  TechnicianTeamStationNotFound,
} from "../domain-errors";
import type {
  CreateTechnicianTeamInput,
  TechnicianTeamAvailableOption,
  TechnicianTeamDetailRow,
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
  getTechnicianTeamDetail: (
    id: string,
  ) => Effect.Effect<TechnicianTeamDetailRow, TechnicianTeamNotFound>;
  listTechnicianTeams: (
    filter: TechnicianTeamFilter,
    pageReq: PageRequest,
  ) => Effect.Effect<PageResult<TechnicianTeamRow>>;
  listAvailableTechnicianTeams: (args?: {
    readonly stationId?: string;
  }) => Effect.Effect<readonly TechnicianTeamAvailableOption[]>;
};
