import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { Prisma } from "generated/prisma/client";
import type { RedistributionStatus } from "generated/prisma/enums";

import type {
  MyInStationRedistributionFilter,
  RedistributionRequestDetailRow,
  RedistributionRequestRow,
  RedistributionRequestSummaryRow,
  RedistributionSortField,
} from "../models";

export type CreateRedistributionRequestInput = {
  requestedByUserId: string;
  sourceStationId: string;
  targetStationId: string;
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
  create: (
    data: CreateRedistributionRequestInput,
  ) => Effect.Effect<RedistributionRequestRow>;

  listMyInStationRequests: (
    userId: string,
    stationId: string,
    filter: MyInStationRedistributionFilter,
    pageReq: PageRequest<RedistributionSortField>,
  ) => Effect.Effect<PageResult<RedistributionRequestSummaryRow>>;

  getMyInStationRequest: (
    userId: string,
    stationId: string,
    requestId: string,
  ) => Effect.Effect<Option.Option<RedistributionRequestDetailRow>>;

  // Core activities
  findById: (
    requestId: string,
  ) => Effect.Effect<Option.Option<RedistributionRequestRow>>;

  findOne: (
    where: Prisma.RedistributionRequestWhereUniqueInput,
  ) => Effect.Effect<Option.Option<RedistributionRequestRow>>;

  findAndPopulate: (
    where: Prisma.RedistributionRequestWhereUniqueInput,
  ) => Effect.Effect<Option.Option<RedistributionRequestDetailRow>>;

  listWithOffset: (
    where: Prisma.RedistributionRequestWhereInput,
    pageReq: PageRequest<RedistributionSortField>,
  ) => Effect.Effect<PageResult<RedistributionRequestSummaryRow>>;

  update: (
    where: Prisma.RedistributionRequestWhereUniqueInput,
    data: UpdateRedistributionRequestData,
  ) => Effect.Effect<Option.Option<RedistributionRequestRow>>;

  updateAndFindWithPopulation: (
    where: Prisma.RedistributionRequestWhereUniqueInput,
    data: UpdateRedistributionRequestData,
  ) => Effect.Effect<Option.Option<RedistributionRequestDetailRow>>;

  updateItemDeliveredAt: (
    requestId: string,
    bikeIds: string[],
    deliveredAt: Date,
  ) => Effect.Effect<void>;
};
