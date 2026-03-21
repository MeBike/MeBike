import type { AppliesToEnum, RatingReasonType } from "../../../generated/prisma/enums";

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
