// import type { Rating } from "generated/prisma/client";
import type { RatingRow } from "../models";

export const selectRatingRow = {
  id: true,
  userId: true,
  rentalId: true,
  bikeId: true,
  stationId: true,
  bikeScore: true,
  stationScore: true,
  comment: true,
  reasons: {
    select: {
      reasonId: true,
    },
  },
  createdAt: true,
  updatedAt: true,
  editedAt: true,
} as const;

export function toRatingRow(row: {
  id: string;
  userId: string;
  rentalId: string;
  bikeId: string | null;
  stationId: string | null;
  bikeScore: number;
  stationScore: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  editedAt: Date | null;
  reasons?: { reasonId: string }[];
}): RatingRow {
  return {
    id: row.id,
    userId: row.userId,
    rentalId: row.rentalId,
    bikeId: row.bikeId,
    stationId: row.stationId,
    bikeScore: row.bikeScore,
    stationScore: row.stationScore,
    comment: row.comment,
    reasonIds: Array.isArray(row.reasons) ? row.reasons.map(r => r.reasonId) : [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    editedAt: row.editedAt,
  };
}
