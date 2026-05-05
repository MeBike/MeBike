import { z } from "zod";

export const RentalDetailInputSchema = z.object({
  rentalId: z.uuidv7().optional(),
  reference: z.enum(["current", "latest", "id"]).default("current"),
});

export const RentalDetailsInputSchema = z.object({
  rentalIds: z.array(z.uuidv7()).min(1).max(20),
});

export const QueryRentalsScopeSchema = z.enum(["current", "recent", "all"]);

export const QueryRentalsInputSchema = z.object({
  scope: QueryRentalsScopeSchema.default("recent"),
  status: z.enum(["RENTED", "COMPLETED", "OVERDUE_UNRETURNED"]).optional(),
  limit: z.number().int().min(1).max(20).default(5),
  includeCounts: z.boolean().default(true),
});

export const ReservationDetailInputSchema = z.object({
  reservationId: z.uuidv7().optional(),
  reference: z.enum(["latestPendingOrActive", "id"]).default("latestPendingOrActive"),
});

export const WalletTransactionDetailInputSchema = z.object({
  transactionId: z.uuidv7().optional(),
  reference: z.enum(["latest", "id"]).default("latest"),
});

export const StationReferenceSchema = z.enum(["id"]);

export const StationDetailInputSchema = z.object({
  stationId: z.uuidv7().optional(),
  reference: StationReferenceSchema.default("id"),
});

export const StationSearchInputSchema = z.object({
  query: z.string().trim().min(1),
  limit: z.number().int().min(1).max(10).default(5),
});

export const NearbyStationsInputSchema = z.object({
  stationId: z.uuidv7().optional(),
  reference: StationReferenceSchema.default("id"),
  limit: z.number().int().min(1).max(10).default(5),
  maxDistanceMeters: z.number().int().positive().max(50000).optional(),
});

export const NearbyStationsFromLocationInputSchema = z.object({
  limit: z.number().int().min(1).max(10).default(5),
  maxDistanceMeters: z.number().int().positive().max(50000).optional(),
});

export const StationAvailableBikesInputSchema = z.object({
  stationId: z.uuidv7().optional(),
  reference: StationReferenceSchema.default("id"),
  limit: z.number().int().min(1).max(10).default(5),
});

export const BikeDetailInputSchema = z.object({
  bikeId: z.uuidv7().optional(),
  reference: z.enum(["id"]).default("id"),
});

export const rentalToolPage = {
  page: 1,
  pageSize: 5,
  sortBy: "updatedAt",
  sortDir: "desc",
} as const;

export const stationToolPage = {
  page: 1,
  pageSize: 5,
  sortBy: "name",
  sortDir: "asc",
} as const;

export const bikeToolPage = {
  page: 1,
  pageSize: 5,
  sortBy: "status",
  sortDir: "asc",
} as const;
