import type { Effect, Option } from "effect";

import type {
  CreateTechnicianTeamInput,
  TechnicianTeamAvailableOption,
  TechnicianTeamFilter,
  TechnicianTeamRow,
} from "../models";

export type TechnicianTeamQueryRepo = {
  readonly getById: (
    id: string,
  ) => Effect.Effect<Option.Option<TechnicianTeamRow>>;
  readonly list: (args?: TechnicianTeamFilter) => Effect.Effect<readonly TechnicianTeamRow[]>;
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
};
