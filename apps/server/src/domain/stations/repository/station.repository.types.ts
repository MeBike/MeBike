import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type {
  StationLocationAlreadyExists,
  StationNameAlreadyExists,
  StationOutsideSupportedArea,
} from "../errors";
import type {
  CreateStationInput,
  NearestSearchArgs,
  NearestStationRow,
  StationContextRow,
  StationFilter,
  StationRow,
  StationSortField,
  UpdateStationInput,
} from "../models";

export type StationCommandRepo = {
  create: (
    input: CreateStationInput,
  ) => Effect.Effect<
    StationRow,
    StationNameAlreadyExists | StationLocationAlreadyExists | StationOutsideSupportedArea
  >;
  update: (
    id: string,
    input: UpdateStationInput,
  ) => Effect.Effect<
    Option.Option<StationRow>,
    StationNameAlreadyExists | StationLocationAlreadyExists | StationOutsideSupportedArea
  >;
};

export type StationQueryRepo = {
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
  existsByExactLocation: (
    args: {
      readonly address: string;
      readonly latitude: number;
      readonly longitude: number;
    },
  ) => Effect.Effect<boolean>;
  findIdNameAddressByIds: (
    ids: readonly string[],
  ) => Effect.Effect<readonly { id: string; name: string; address: string }[]>;
  listContextExcludingId: (
    excludedId: string,
  ) => Effect.Effect<readonly StationContextRow[]>;
  listNearest: (
    args: NearestSearchArgs,
  ) => Effect.Effect<PageResult<NearestStationRow>>;
};

export type StationRepo = StationCommandRepo & StationQueryRepo;
