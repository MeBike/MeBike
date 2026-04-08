import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  StationNameAlreadyExists,
  StationOutsideSupportedArea,
} from "../errors";
import type {
  CreateStationInput,
  NearestSearchArgs,
  NearestStationRow,
  StationFilter,
  StationRow,
  StationSortField,
  UpdateStationInput,
} from "../models";

export type StationRepo = {
  create: (
    input: CreateStationInput,
  ) => Effect.Effect<
    StationRow,
    StationNameAlreadyExists | StationOutsideSupportedArea
  >;
  update: (
    id: string,
    input: UpdateStationInput,
  ) => Effect.Effect<
    Option.Option<StationRow>,
    StationNameAlreadyExists | StationOutsideSupportedArea
  >;
  listWithOffset: (
    filter: StationFilter,
    pageReq: PageRequest<StationSortField>,
  ) => Effect.Effect<PageResult<StationRow>>;
  getById: (
    id: string,
  ) => Effect.Effect<Option.Option<StationRow>>;
  getByAgencyId: (
    agencyId: string,
  ) => Effect.Effect<Option.Option<StationRow>>;
  findIdNameAddressByIds: (
    ids: readonly string[],
  ) => Effect.Effect<readonly { id: string; name: string; address: string }[]>;
  listNearest: (
    args: NearestSearchArgs,
  ) => Effect.Effect<PageResult<NearestStationRow>>;
};
