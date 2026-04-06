import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { Prisma } from "generated/prisma/client";
import type { RedistributionStatus } from "generated/prisma/enums";

import type { RedistributionRepositoryError } from "../domain-errors";
import type {
  AdminRedistributionFilter,
  MyInStationRedistributionFilter,
  RedistributionRequestDetailRow,
  RedistributionRequestRow,
  RedistributionRequestSummaryRow,
  RedistributionSortField,
} from "../models";

export type CreateRedistributionRequestInput = {
  requestedByUserId: string;
  sourceStationId: string;
  targetStationId?: string | null;
  targetAgencyId?: string | null;
  requestedQuantity: number;
  reason?: string | null;
  bikeIds?: string[];
};

export type UpdateRedistributionRequestData = {
  status?: RedistributionStatus;
  approvedByUserId?: string | null;
  requestedQuantity?: number;
  reason?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
};

export type RedistributionRepo = {
  // Staff activities
  create: (
    data: CreateRedistributionRequestInput,
  ) => Effect.Effect<RedistributionRequestRow, RedistributionRepositoryError>;

  listMyInStationRequests: (
    userId: string,
    stationId: string,
    filter: MyInStationRedistributionFilter,
    pageReq: PageRequest<RedistributionSortField>,
  ) => Effect.Effect<
    PageResult<RedistributionRequestSummaryRow>,
    RedistributionRepositoryError
  >;

  getMyInStationRequest: (
    userId: string,
    stationId: string,
    requestId: string,
  ) => Effect.Effect<
    Option.Option<RedistributionRequestDetailRow>,
    RedistributionRepositoryError
  >;

  // Core activities
  findById: (
    requestId: string,
  ) => Effect.Effect<
    Option.Option<RedistributionRequestRow>,
    RedistributionRepositoryError
  >;

  findOne: (
    where: Prisma.RedistributionRequestWhereUniqueInput,
  ) => Effect.Effect<
    Option.Option<RedistributionRequestRow>,
    RedistributionRepositoryError
  >;

  findAndPopulate: (
    where: Prisma.RedistributionRequestWhereUniqueInput,
  ) => Effect.Effect<
    Option.Option<RedistributionRequestDetailRow>,
    RedistributionRepositoryError
  >;

  listWithOffset: (
    where: Prisma.RedistributionRequestWhereInput,
    pageReq: PageRequest<RedistributionSortField>,
  ) => Effect.Effect<
    PageResult<RedistributionRequestSummaryRow>,
    RedistributionRepositoryError
  >;

  update: (
    where: Prisma.RedistributionRequestWhereUniqueInput,
    data: UpdateRedistributionRequestData,
  ) => Effect.Effect<
    Option.Option<RedistributionRequestRow>,
    RedistributionRepositoryError
  >;

  updateAndFindWithPopulation: (
    where: Prisma.RedistributionRequestWhereUniqueInput,
    data: UpdateRedistributionRequestData,
  ) => Effect.Effect<
    Option.Option<RedistributionRequestDetailRow>,
    RedistributionRepositoryError
  >;
};
