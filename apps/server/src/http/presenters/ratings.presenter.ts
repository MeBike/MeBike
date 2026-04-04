import type { RatingsContracts } from "@mebike/shared";

import type {
  AdminRatingDetailRow,
  AdminRatingListItemRow,
  RatingRow,
  RatingSummary,
} from "@/domain/ratings";

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

export function toAdminRatingListItem(
  row: AdminRatingListItemRow,
): RatingsContracts.AdminRatingListItem {
  return {
    id: row.id,
    rentalId: row.rentalId,
    user: {
      id: row.user.id,
      fullName: row.user.fullName,
      phoneNumber: row.user.phoneNumber,
    },
    bike: row.bike
      ? {
          id: row.bike.id,
          chipId: row.bike.chipId,
        }
      : null,
    station: row.station
      ? {
          id: row.station.id,
          name: row.station.name,
          address: row.station.address,
        }
      : null,
    bikeScore: row.bikeScore,
    stationScore: row.stationScore,
    comment: row.comment,
    reasons: row.reasons.map(reason => ({
      id: reason.id,
      type: reason.type,
      appliesTo: reason.appliesTo,
      message: reason.message,
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    editedAt: row.editedAt ? row.editedAt.toISOString() : null,
  };
}

export function toAdminRatingDetail(
  row: AdminRatingDetailRow,
): RatingsContracts.AdminRatingDetail {
  return {
    ...toAdminRatingListItem(row),
    rental: {
      id: row.rental.id,
      status: row.rental.status,
      startTime: row.rental.startTime.toISOString(),
      endTime: row.rental.endTime ? row.rental.endTime.toISOString() : null,
    },
  };
}
