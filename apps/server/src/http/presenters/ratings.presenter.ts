import type { RatingsContracts } from "@mebike/shared";

import type { RatingRow, RatingSummary } from "@/domain/ratings";

export function toRatingDetail(row: RatingRow): RatingsContracts.RatingDetail {
  return {
    id: row.id,
    rentalId: row.rentalId,
    userId: row.userId,
    bikeId: row.bikeId,
    stationId: row.stationId,
    bikeScore: row.bikeScore,
    stationScore: row.stationScore,
    comment: row.comment,
    reasonIds: [...row.reasonIds],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    editedAt: row.editedAt ? row.editedAt.toISOString() : null,
  };
}

export function toRatingSummary(summary: RatingSummary): RatingsContracts.RatingSummaryResponse {
  return {
    averageRating: summary.averageRating,
    totalRatings: summary.totalRatings,
    breakdown: {
      oneStar: summary.breakdown.oneStar,
      twoStar: summary.breakdown.twoStar,
      threeStar: summary.breakdown.threeStar,
      fourStar: summary.breakdown.fourStar,
      fiveStar: summary.breakdown.fiveStar,
    },
  };
}
