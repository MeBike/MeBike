import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { Prisma } from "generated/prisma/client";
import type { RedistributionStatus } from "generated/prisma/enums";

import type {
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
  // Core activities
  findById: (
    requestId: string,
  ) => Effect.Effect<Option.Option<RedistributionRequestRow>>;

  findOne: (
    where: Prisma.RedistributionRequestWhereUniqueInput,
  ) => Effect.Effect<Option.Option<RedistributionRequestRow>>;

  findWhere: (
    where: Prisma.RedistributionRequestWhereInput,
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
