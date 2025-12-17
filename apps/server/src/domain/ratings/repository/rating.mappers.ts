import type { Rating } from "../../../../generated/prisma/client";
import type { RatingRow } from "../models";

export const selectRatingRow = {
  id: true,
  userId: true,
  rentalId: true,
  rating: true,
  comment: true,
  reasons: {
    select: {
      reasonId: true,
    },
  },
  updatedAt: true,
} as const;

export function toRatingRow(row: {
  id: string;
  userId: string;
  rentalId: string;
  rating: number;
  comment: string | null;
  updatedAt: Date;
  reasons?: { reasonId: string }[];
}): RatingRow {
  return {
    id: row.id,
    userId: row.userId,
    rentalId: row.rentalId,
    rating: row.rating,
    comment: row.comment,
    reasonIds: Array.isArray(row.reasons) ? row.reasons.map(r => r.reasonId) : [],
    updatedAt: row.updatedAt,
  };
}
