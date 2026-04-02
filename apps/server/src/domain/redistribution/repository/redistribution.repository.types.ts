import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
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

export type UpdateRedistributionRequestStatusInput = {
  requestId: string;
  status: RedistributionStatus;
  approvedByUserId?: string | null;
};

export type RedistributionRepo = {
  // Staff activities
  createRequest: (
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

  findById: (
    requestId: string,
  ) => Effect.Effect<
    Option.Option<RedistributionRequestDetailRow>,
    RedistributionRepositoryError
  >;

  // Admin activities
  adminListRequests: (
    filter: AdminRedistributionFilter,
    pageReq: PageRequest<RedistributionSortField>,
  ) => Effect.Effect<
    PageResult<RedistributionRequestSummaryRow>,
    RedistributionRepositoryError
  >;

  // Manager activities
  updateRequestStatus: (
    data: UpdateRedistributionRequestStatusInput,
  ) => Effect.Effect<
    Option.Option<RedistributionRequestRow>,
    RedistributionRepositoryError
  >;
};
