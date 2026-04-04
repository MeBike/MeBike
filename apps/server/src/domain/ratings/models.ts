import type { PageRequest } from "@/domain/shared/pagination";

import type { AppliesToEnum, RatingReasonType, RentalStatus } from "../../../generated/prisma/enums";

export type RatingRow = {
  readonly id: string;
  readonly userId: string;
  readonly rentalId: string;
  readonly bikeId: string | null;
  readonly stationId: string | null;
  readonly bikeScore: number;
  readonly stationScore: number;
  readonly comment: string | null;
  readonly reasonIds: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly editedAt: Date | null;
};

export type RatingReasonRow = {
  readonly id: string;
  readonly type: RatingReasonType;
  readonly appliesTo: AppliesToEnum;
  readonly message: string;
  readonly isDefault: boolean;
  readonly isActive: boolean;
};

export type AdminRatingUserRow = {
  readonly id: string;
  readonly fullName: string;
  readonly phoneNumber: string | null;
};

export type AdminRatingBikeRow = {
  readonly id: string;
  readonly chipId: string;
};

export type AdminRatingStationRow = {
  readonly id: string;
  readonly name: string;
  readonly address: string;
};

export type AdminRatingRentalRow = {
  readonly id: string;
  readonly status: RentalStatus;
  readonly startTime: Date;
  readonly endTime: Date | null;
};

export type AdminRatingListItemRow = {
  readonly id: string;
  readonly rentalId: string;
  readonly user: AdminRatingUserRow;
  readonly bike: AdminRatingBikeRow | null;
  readonly station: AdminRatingStationRow | null;
  readonly bikeScore: number;
  readonly stationScore: number;
  readonly comment: string | null;
  readonly reasons: readonly Pick<RatingReasonRow, "id" | "type" | "appliesTo" | "message">[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly editedAt: Date | null;
};

export type AdminRatingDetailRow = AdminRatingListItemRow & {
  readonly rental: AdminRatingRentalRow;
};

export type AdminRatingSortField = "createdAt" | "updatedAt" | "bikeScore" | "stationScore";

export type AdminRatingFilters = {
  readonly userId?: string;
  readonly rentalId?: string;
  readonly bikeId?: string;
  readonly stationId?: string;
};

export type AdminRatingPageRequest = PageRequest<AdminRatingSortField>;

export type CreateRatingInput = {
  readonly userId: string;
  readonly rentalId: string;
  readonly bikeId?: string | null;
  readonly stationId?: string | null;
  readonly bikeScore: number;
  readonly stationScore: number;
  readonly reasonIds: readonly string[];
  readonly comment?: string | null;
};

export type RatingSummaryBreakdown = {
  readonly oneStar: number;
  readonly twoStar: number;
  readonly threeStar: number;
  readonly fourStar: number;
  readonly fiveStar: number;
};

export type RatingSummary = {
  readonly averageRating: number;
  readonly totalRatings: number;
  readonly breakdown: RatingSummaryBreakdown;
};

export type RatingAggregate = {
  readonly averageRating: number;
  readonly totalRatings: number;
};
