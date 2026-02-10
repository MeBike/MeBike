import type { RatingsContracts } from "@mebike/shared";

import type { RatingRow } from "@/domain/ratings";

export function toRatingDetail(row: RatingRow): RatingsContracts.RatingDetail {
  return {
    id: row.id,
    rentalId: row.rentalId,
    userId: row.userId,
    rating: row.rating,
    comment: row.comment,
    reasonIds: [...row.reasonIds],
    updatedAt: row.updatedAt.toISOString(),
  };
}
