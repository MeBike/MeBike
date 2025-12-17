import type { Rating } from "../../../../generated/prisma/client";
import type { RatingRow } from "../models";

export const selectRatingRow = {
  id: true,
  userId: true,
  rentalId: true,
  rating: true,
  comment: true,
  updatedAt: true,
} satisfies Record<keyof RatingRow, true>;

export function toRatingRow(row: Pick<Rating, keyof typeof selectRatingRow>): RatingRow {
  return {
    id: row.id,
    userId: row.userId,
    rentalId: row.rentalId,
    rating: row.rating,
    comment: row.comment,
    updatedAt: row.updatedAt,
  };
}
