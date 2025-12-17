import type { AppliesToEnum, RatingReasonType } from "../../../generated/prisma/enums";

export type RatingRow = {
  readonly id: string;
  readonly userId: string;
  readonly rentalId: string;
  readonly rating: number;
  readonly comment: string | null;
  readonly reasonIds: readonly string[];
  readonly updatedAt: Date;
};

export type RatingReasonRow = {
  readonly id: string;
  readonly type: RatingReasonType;
  readonly appliesTo: AppliesToEnum;
  readonly messages: string;
};

export type CreateRatingInput = {
  readonly userId: string;
  readonly rentalId: string;
  readonly rating: number;
  readonly reasonIds: readonly string[];
  readonly comment?: string | null;
};
