import type { Effect, Option } from "effect";

import type {
  TechnicianTeamAvailableOption,
  TechnicianTeamRow,
} from "../models";

export type TechnicianTeamQueryRepo = {
  readonly getById: (
    id: string,
  ) => Effect.Effect<Option.Option<TechnicianTeamRow>>;
  readonly listAvailable: (args?: {
    readonly stationId?: string;
  }) => Effect.Effect<readonly TechnicianTeamAvailableOption[]>;
  readonly countMembers: (
    technicianTeamId: string,
    options?: { readonly excludeUserId?: string },
  ) => Effect.Effect<number>;
};
