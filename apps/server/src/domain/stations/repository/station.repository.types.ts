import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  StationNameAlreadyExists,
  StationOutsideSupportedArea,
  StationRepositoryError,
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
    StationRepositoryError | StationNameAlreadyExists | StationOutsideSupportedArea
  >;
  update: (
    id: string,
    input: UpdateStationInput,
  ) => Effect.Effect<
    Option.Option<StationRow>,
    StationRepositoryError | StationNameAlreadyExists | StationOutsideSupportedArea
  >;
  listWithOffset: (
    filter: StationFilter,
    pageReq: PageRequest<StationSortField>,
  ) => Effect.Effect<PageResult<StationRow>, StationRepositoryError>;
  getById: (
    id: string,
  ) => Effect.Effect<Option.Option<StationRow>, StationRepositoryError>;
  listNearest: (
    args: NearestSearchArgs,
  ) => Effect.Effect<PageResult<NearestStationRow>, StationRepositoryError>;
};
