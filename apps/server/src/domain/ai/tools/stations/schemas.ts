import { StationsContracts } from "@mebike/shared";
import { z } from "zod";

import { BikeAiDetailSchema } from "../bikes/schemas";

const StationDetailReferenceSchema = z.enum(["id"]);

const StationReservationPolicySchema = z.object({
  canAcceptNewReservation: z.boolean(),
  requiredAvailableBikes: z.number().int().nonnegative(),
}).strict();

const StationAiDetailSchema = StationsContracts.StationReadSummarySchema.extend({
  reservationPolicy: StationReservationPolicySchema,
}).strict();

const NearbyStationAiSchema = StationsContracts.NearbyStationSchema.extend({
  reservationPolicy: StationReservationPolicySchema,
}).strict();

const LocationOriginSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
}).strict();

export const StationDetailToolOutputSchema = z.object({
  reference: StationDetailReferenceSchema,
  detail: StationAiDetailSchema.nullable(),
}).strict();

export const StationSearchToolOutputSchema = z.object({
  query: z.string(),
  stations: z.array(StationAiDetailSchema),
}).strict();

export const NearbyStationsToolOutputSchema = z.object({
  reference: StationDetailReferenceSchema,
  originStationId: z.uuidv7().nullable(),
  stations: z.array(NearbyStationAiSchema),
}).strict();

export const NearbyStationsFromLocationToolOutputSchema = z.object({
  hasLocation: z.boolean(),
  origin: LocationOriginSchema.nullable(),
  stations: z.array(NearbyStationAiSchema),
}).strict();

export const StationAvailableBikesToolOutputSchema = z.object({
  reference: StationDetailReferenceSchema,
  stationId: z.uuidv7().nullable(),
  availableBikeCount: z.number().int().nonnegative(),
  bikes: z.array(BikeAiDetailSchema),
}).strict();
