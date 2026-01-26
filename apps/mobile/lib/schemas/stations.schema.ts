import { z } from "zod";

const NumberLike = z.union([z.number(), z.string()]);

export const PaginationMetaSchema = z.looseObject({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const StationGraphqlSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: NumberLike,
  longitude: NumberLike,
  capacity: NumberLike,
  totalBike: z.number().nullable().optional(),
  availableBike: z.number().nullable().optional(),
  bookedBike: z.number().nullable().optional(),
  brokenBike: z.number().nullable().optional(),
  reservedBike: z.number().nullable().optional(),
  maintanedBike: z.number().nullable().optional(),
  unavailable: z.number().nullable().optional(),
  distance: z.number().nullable().optional(),
  status: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const StationsEnvelopeSchema = z.looseObject({
  success: z.boolean().optional(),
  message: z.string().optional(),
  statusCode: z.number().optional(),
  errors: z.array(z.string()).nullable().optional(),
  activeStation: z.number().nullable().optional(),
  inactiveStation: z.number().nullable().optional(),
  data: z.array(StationGraphqlSchema).optional(),
  pagination: PaginationMetaSchema.optional(),
});

export const StationsResponseSchema = z.looseObject({
  data: z
    .looseObject({
      Stations: StationsEnvelopeSchema.optional(),
    })
    .optional(),
});
