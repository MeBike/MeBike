import type { z } from "zod";

import { tool } from "ai";
import { Effect } from "effect";

import type { CreateCustomerToolsArgs } from "./customer-tool-helpers";

import {
  bikeToolPage,

  getStationByIdOrNull,
  NearbyStationsFromLocationInputSchema,
  NearbyStationsInputSchema,
  StationAvailableBikesInputSchema,
  StationDetailInputSchema,
  StationSearchInputSchema,
  stationToolPage,
  toBikeAiDetail,
  toNearbyStationAiDetail,
  toStationAiDetail,
} from "./customer-tool-helpers";
import {
  NearbyStationsFromLocationToolOutputSchema,
  NearbyStationsToolOutputSchema,
  StationAvailableBikesToolOutputSchema,
  StationDetailToolOutputSchema,
  StationSearchToolOutputSchema,
} from "./customer-tool-schemas";

export function createCustomerStationTools(args: CreateCustomerToolsArgs) {
  return {
    getStationDetail: tool({
      description: "Get one station detail. Prefer the current screen context when a station is already open.",
      inputSchema: StationDetailInputSchema,
      outputSchema: StationDetailToolOutputSchema,
      execute: async (input): Promise<z.infer<typeof StationDetailToolOutputSchema>> => {
        let stationId = input.stationId ?? null;

        if (!stationId && input.reference === "context") {
          stationId = args.context?.stationId ?? null;
        }

        if (!stationId) {
          return { reference: input.reference, detail: null };
        }

        const station = await getStationByIdOrNull(args.stationQueryService, stationId);

        return {
          reference: input.reference,
          detail: station ? toStationAiDetail(station) : null,
        };
      },
    }),
    searchStations: tool({
      description: "Search stations by name first, then by address if needed. Use this when the user mentions a station by words instead of station id.",
      inputSchema: StationSearchInputSchema,
      outputSchema: StationSearchToolOutputSchema,
      execute: async (input): Promise<z.infer<typeof StationSearchToolOutputSchema>> => {
        const byName = await Effect.runPromise(
          args.stationQueryService.listStations(
            { name: input.query },
            { ...stationToolPage, pageSize: input.limit },
          ),
        );

        if (byName.items.length > 0) {
          return {
            query: input.query,
            stations: byName.items.map(toStationAiDetail),
          };
        }

        const byAddress = await Effect.runPromise(
          args.stationQueryService.listStations(
            { address: input.query },
            { ...stationToolPage, pageSize: input.limit },
          ),
        );

        return {
          query: input.query,
          stations: byAddress.items.map(toStationAiDetail),
        };
      },
    }),
    getNearbyStationsFromLocation: tool({
      description: "Get stations near the user's live location when location context is available. Use this for requests like nearest station near me or stations close to my current position.",
      inputSchema: NearbyStationsFromLocationInputSchema,
      outputSchema: NearbyStationsFromLocationToolOutputSchema,
      execute: async (input): Promise<z.infer<typeof NearbyStationsFromLocationToolOutputSchema>> => {
        const location = args.context?.location ?? null;

        if (!location) {
          return {
            hasLocation: false,
            origin: null,
            stations: [],
          };
        }

        const nearby = await Effect.runPromise(
          args.stationQueryService.listNearestStations({
            latitude: location.latitude,
            longitude: location.longitude,
            maxDistanceMeters: input.maxDistanceMeters,
            page: 1,
            pageSize: input.limit,
          }),
        );

        return {
          hasLocation: true,
          origin: location,
          stations: nearby.items.map(toNearbyStationAiDetail),
        };
      },
    }),
    getNearbyStations: tool({
      description: "Get nearby stations around a known station context. Use this for alternative pickup or return suggestions.",
      inputSchema: NearbyStationsInputSchema,
      outputSchema: NearbyStationsToolOutputSchema,
      execute: async (input): Promise<z.infer<typeof NearbyStationsToolOutputSchema>> => {
        let stationId = input.stationId ?? null;

        if (!stationId && input.reference === "context") {
          stationId = args.context?.stationId ?? null;
        }

        if (!stationId) {
          return {
            reference: input.reference,
            originStationId: null,
            stations: [],
          };
        }

        const originStation = await getStationByIdOrNull(args.stationQueryService, stationId);

        if (!originStation) {
          return {
            reference: input.reference,
            originStationId: stationId,
            stations: [],
          };
        }

        const nearby = await Effect.runPromise(
          args.stationQueryService.listNearestStations({
            latitude: originStation.latitude,
            longitude: originStation.longitude,
            maxDistanceMeters: input.maxDistanceMeters,
            page: 1,
            pageSize: input.limit + 1,
          }),
        );

        return {
          reference: input.reference,
          originStationId: stationId,
          stations: nearby.items
            .filter(station => station.id !== stationId)
            .slice(0, input.limit)
            .map(toNearbyStationAiDetail),
        };
      },
    }),
    getStationAvailableBikes: tool({
      description: "Get currently available bikes at one station. Prefer current station context when possible.",
      inputSchema: StationAvailableBikesInputSchema,
      outputSchema: StationAvailableBikesToolOutputSchema,
      execute: async (input): Promise<z.infer<typeof StationAvailableBikesToolOutputSchema>> => {
        let stationId = input.stationId ?? null;

        if (!stationId && input.reference === "context") {
          stationId = args.context?.stationId ?? null;
        }

        if (!stationId) {
          return {
            reference: input.reference,
            stationId: null,
            availableBikeCount: 0,
            bikes: [],
          };
        }

        const availableBikes = await Effect.runPromise(
          args.bikeService.listBikes(
            { stationId, status: "AVAILABLE" },
            { ...bikeToolPage, pageSize: input.limit },
          ),
        );

        return {
          reference: input.reference,
          stationId,
          availableBikeCount: availableBikes.total,
          bikes: availableBikes.items.map(toBikeAiDetail),
        };
      },
    }),
  } as const;
}
