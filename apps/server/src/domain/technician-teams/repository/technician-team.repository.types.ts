import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  CreateTechnicianTeamInput,
  TechnicianTeamAvailableOption,
  TechnicianTeamDetailRow,
  TechnicianTeamFilter,
  TechnicianTeamRow,
  UpdateTechnicianTeamInput,
} from "../models";

export type TechnicianTeamQueryRepo = {
  readonly getById: (
    id: string,
  ) => Effect.Effect<Option.Option<TechnicianTeamRow>>;
  readonly getDetailById: (
    id: string,
  ) => Effect.Effect<Option.Option<TechnicianTeamDetailRow>>;
  readonly list: (
    filter: TechnicianTeamFilter,
    pageReq: PageRequest,
  ) => Effect.Effect<PageResult<TechnicianTeamRow>>;
  readonly listAvailable: (args?: {
    readonly stationId?: string;
  }) => Effect.Effect<readonly TechnicianTeamAvailableOption[]>;
  readonly countMembers: (
    technicianTeamId: string,
    options?: { readonly excludeUserId?: string },
  ) => Effect.Effect<number>;
};

export type TechnicianTeamCommandRepo = {
  readonly create: (
    input: Required<CreateTechnicianTeamInput>,
  ) => Effect.Effect<TechnicianTeamRow>;
  readonly update: (
    id: string,
    input: UpdateTechnicianTeamInput,
  ) => Effect.Effect<TechnicianTeamRow>;
};
