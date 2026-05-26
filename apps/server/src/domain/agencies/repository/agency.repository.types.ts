import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { StationRepositoryError } from "@/domain/stations";

import type { AgencyRepositoryError } from "../domain-errors";
import type {
  AgencyDetailRow,
  AgencyFilter,
  AgencyRow,
  AgencySortField,
  CreateAgencyInput,
  UpdateAgencyInput,
  UpdateAgencyStatusInput,
} from "../models";

export type AgencyRepo = {
  readonly create: (input: CreateAgencyInput) => Effect.Effect<AgencyRow, AgencyRepositoryError>;
  readonly getById: (id: string) => Effect.Effect<Option.Option<AgencyRow>, AgencyRepositoryError>;
  readonly getDetailById: (id: string) => Effect.Effect<Option.Option<AgencyDetailRow>, AgencyRepositoryError | StationRepositoryError>;
  readonly listWithOffset: (
    filter: AgencyFilter,
    pageReq: PageRequest<AgencySortField>,
  ) => Effect.Effect<PageResult<AgencyRow>, AgencyRepositoryError>;
  readonly update: (
    id: string,
    input: UpdateAgencyInput,
  ) => Effect.Effect<Option.Option<AgencyRow>, AgencyRepositoryError>;
  readonly updateStatus: (
    id: string,
    input: UpdateAgencyStatusInput,
  ) => Effect.Effect<Option.Option<AgencyRow>, AgencyRepositoryError>;
};
