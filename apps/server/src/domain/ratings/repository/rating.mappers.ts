import type {
  AdminRatingBikeRow,
  AdminRatingDetailRow,
  AdminRatingListItemRow,
  AdminRatingStationRow,
  RatingRow,
} from "../models";

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

type RatingReasonPayload = {
  reason: {
    id: string;
    type: "ISSUE" | "COMPLIMENT";
    appliesTo: "bike" | "station";
    message: string;
  };
};

type AdminRatingBasePayload = {
  id: string;
  rentalId: string;
  bikeId: string | null;
  stationId: string | null;
  bikeScore: number;
  stationScore: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  editedAt: Date | null;
  user: {
    id: string;
    fullName: string;
    phoneNumber: string | null;
  };
  reasons: RatingReasonPayload[];
};

export function toAdminRatingListItemRow(
  row: AdminRatingBasePayload,
  bike: AdminRatingBikeRow | null,
  station: AdminRatingStationRow | null,
): AdminRatingListItemRow {
  return {
    id: row.id,
    rentalId: row.rentalId,
    user: row.user,
    bike,
    station,
    bikeScore: row.bikeScore,
    stationScore: row.stationScore,
    comment: row.comment,
    reasons: row.reasons.map(({ reason }) => ({
      id: reason.id,
      type: reason.type,
      appliesTo: reason.appliesTo,
      message: reason.message,
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    editedAt: row.editedAt,
  };
}

export function toAdminRatingDetailRow(
  row: AdminRatingBasePayload & {
    rental: {
      id: string;
      status: "RENTED" | "COMPLETED" | "OVERDUE_UNRETURNED";
      startTime: Date;
      endTime: Date | null;
    };
  },
  bike: AdminRatingBikeRow | null,
  station: AdminRatingStationRow | null,
): AdminRatingDetailRow {
  return {
    ...toAdminRatingListItemRow(row, bike, station),
    rental: {
      id: row.rental.id,
      status: row.rental.status,
      startTime: row.rental.startTime,
      endTime: row.rental.endTime,
    },
  };
}
