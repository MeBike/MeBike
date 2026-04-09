import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match } from "effect";

import { StationServiceTag } from "@/domain/stations";
import { toContractStationReadSummary } from "@/http/presenters/stations.presenter";

import type {
  StationErrorResponse,
  StationListResponse,
  StationsRoutes,
  StationSummary,
} from "./shared";

import { StationErrorCodeSchema, stationErrorMessages } from "./shared";

const listStations: RouteHandler<StationsRoutes["adminListStations"]> = async (c) => {
  const query = c.req.valid("query");

  const eff = Effect.flatMap(StationServiceTag, service =>
    service.listStations(
      {
        name: query.name,
        address: query.address,
        stationType: query.stationType,
        agencyId: query.agencyId,
        totalCapacity: query.totalCapacity,
        excludeAssignedStaff: true,
      },
      {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
        sortBy: query.sortBy ?? "name",
        sortDir: query.sortDir ?? "asc",
      },
    ));

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<StationListResponse, 200>({
        data: right.items.map(toContractStationReadSummary),
        pagination: {
          page: right.page,
          pageSize: right.pageSize,
          total: right.total,
          totalPages: right.totalPages,
        },
      }, 200)),
    Match.tag("Left", () =>
      c.json<StationErrorResponse, 400>({
        error: stationErrorMessages.INVALID_QUERY_PARAMS,
        details: { code: StationErrorCodeSchema.enum.INVALID_QUERY_PARAMS },
      }, 400)),
    Match.exhaustive,
  );
};

const createStation: RouteHandler<StationsRoutes["createStation"]> = async (c) => {
  const body = c.req.valid("json");

  const eff = Effect.flatMap(StationServiceTag, service =>
    service.createStation({
      name: body.name,
      address: body.address,
      stationType: body.stationType,
      agencyId: body.agencyId ?? null,
      totalCapacity: body.totalCapacity,
      pickupSlotLimit: body.pickupSlotLimit,
      returnSlotLimit: body.returnSlotLimit,
      latitude: body.latitude,
      longitude: body.longitude,
    }));

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => c.json<StationSummary, 201>(right, 201)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("StationNameAlreadyExists", () =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.STATION_NAME_ALREADY_EXISTS,
            details: {
              code: StationErrorCodeSchema.enum.STATION_NAME_ALREADY_EXISTS,
            },
          }, 400)),
        Match.tag("StationCapacityLimitExceeded", () =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.CAPACITY_LIMIT_EXCEEDED,
            details: {
              code: StationErrorCodeSchema.enum.CAPACITY_LIMIT_EXCEEDED,
            },
          }, 400)),
        Match.tag("StationCapacitySplitInvalid", () =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.CAPACITY_SPLIT_INVALID,
            details: {
              code: StationErrorCodeSchema.enum.CAPACITY_SPLIT_INVALID,
            },
          }, 400)),
        Match.tag("StationCapacityBelowActiveUsage", ({ stationId, totalCapacity, totalBikes, activeReturnSlots }) =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.CAPACITY_BELOW_ACTIVE_USAGE,
            details: {
              code: StationErrorCodeSchema.enum.CAPACITY_BELOW_ACTIVE_USAGE,
              stationId,
              totalCapacity,
              totalBikes,
              activeReturnSlots,
            },
          }, 400)),
        Match.tag("StationReturnSlotLimitBelowActiveReservations", ({ stationId, returnSlotLimit, activeReturnSlots }) =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.RETURN_SLOT_LIMIT_BELOW_ACTIVE_RESERVATIONS,
            details: {
              code: StationErrorCodeSchema.enum.RETURN_SLOT_LIMIT_BELOW_ACTIVE_RESERVATIONS,
              stationId,
              returnSlotLimit,
              activeReturnSlots,
            },
          }, 400)),
        Match.tag("StationPickupSlotLimitBelowPendingReservations", ({ stationId, pickupSlotLimit, pendingReservations }) =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.PICKUP_SLOT_LIMIT_BELOW_PENDING_RESERVATIONS,
            details: {
              code: StationErrorCodeSchema.enum.PICKUP_SLOT_LIMIT_BELOW_PENDING_RESERVATIONS,
              stationId,
              pickupSlotLimit,
              pendingReservations,
            },
          }, 400)),
        Match.tag("StationOutsideSupportedArea", () =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.OUTSIDE_SUPPORTED_AREA,
            details: {
              code: StationErrorCodeSchema.enum.OUTSIDE_SUPPORTED_AREA,
            },
          }, 400)),
        Match.tag("StationAgencyRequired", () =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.STATION_AGENCY_REQUIRED,
            details: {
              code: StationErrorCodeSchema.enum.STATION_AGENCY_REQUIRED,
            },
          }, 400)),
        Match.tag("StationAgencyForbidden", () =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.STATION_AGENCY_FORBIDDEN,
            details: {
              code: StationErrorCodeSchema.enum.STATION_AGENCY_FORBIDDEN,
            },
          }, 400)),
        Match.tag("StationAgencyNotFound", ({ agencyId }) =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.STATION_AGENCY_NOT_FOUND,
            details: {
              code: StationErrorCodeSchema.enum.STATION_AGENCY_NOT_FOUND,
              agencyId,
            },
          }, 400)),
        Match.tag("StationAgencyAlreadyAssigned", ({ stationId }) =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.STATION_AGENCY_ALREADY_ASSIGNED,
            details: {
              code: StationErrorCodeSchema.enum.STATION_AGENCY_ALREADY_ASSIGNED,
              stationId,
            },
          }, 400)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const updateStation: RouteHandler<StationsRoutes["updateStation"]> = async (c) => {
  const params = c.req.valid("param");
  const body = c.req.valid("json");

  const eff = Effect.flatMap(StationServiceTag, service =>
    service.updateStation(params.stationId, body));

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => c.json<StationSummary, 200>(right, 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("StationNotFound", ({ id }) =>
          c.json<StationErrorResponse, 404>({
            error: stationErrorMessages.STATION_NOT_FOUND,
            details: {
              code: StationErrorCodeSchema.enum.STATION_NOT_FOUND,
              stationId: id,
            },
          }, 404)),
        Match.tag("StationNameAlreadyExists", () =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.STATION_NAME_ALREADY_EXISTS,
            details: {
              code: StationErrorCodeSchema.enum.STATION_NAME_ALREADY_EXISTS,
            },
          }, 400)),
        Match.tag("StationCapacityLimitExceeded", () =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.CAPACITY_LIMIT_EXCEEDED,
            details: {
              code: StationErrorCodeSchema.enum.CAPACITY_LIMIT_EXCEEDED,
            },
          }, 400)),
        Match.tag("StationCapacitySplitInvalid", () =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.CAPACITY_SPLIT_INVALID,
            details: {
              code: StationErrorCodeSchema.enum.CAPACITY_SPLIT_INVALID,
            },
          }, 400)),
        Match.tag("StationCapacityBelowActiveUsage", ({ stationId, totalCapacity, totalBikes, activeReturnSlots }) =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.CAPACITY_BELOW_ACTIVE_USAGE,
            details: {
              code: StationErrorCodeSchema.enum.CAPACITY_BELOW_ACTIVE_USAGE,
              stationId,
              totalCapacity,
              totalBikes,
              activeReturnSlots,
            },
          }, 400)),
        Match.tag("StationReturnSlotLimitBelowActiveReservations", ({ stationId, returnSlotLimit, activeReturnSlots }) =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.RETURN_SLOT_LIMIT_BELOW_ACTIVE_RESERVATIONS,
            details: {
              code: StationErrorCodeSchema.enum.RETURN_SLOT_LIMIT_BELOW_ACTIVE_RESERVATIONS,
              stationId,
              returnSlotLimit,
              activeReturnSlots,
            },
          }, 400)),
        Match.tag("StationPickupSlotLimitBelowPendingReservations", ({ stationId, pickupSlotLimit, pendingReservations }) =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.PICKUP_SLOT_LIMIT_BELOW_PENDING_RESERVATIONS,
            details: {
              code: StationErrorCodeSchema.enum.PICKUP_SLOT_LIMIT_BELOW_PENDING_RESERVATIONS,
              stationId,
              pickupSlotLimit,
              pendingReservations,
            },
          }, 400)),
        Match.tag("StationOutsideSupportedArea", () =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.OUTSIDE_SUPPORTED_AREA,
            details: {
              code: StationErrorCodeSchema.enum.OUTSIDE_SUPPORTED_AREA,
            },
          }, 400)),
        Match.tag("StationAgencyRequired", () =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.STATION_AGENCY_REQUIRED,
            details: {
              code: StationErrorCodeSchema.enum.STATION_AGENCY_REQUIRED,
            },
          }, 400)),
        Match.tag("StationAgencyForbidden", () =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.STATION_AGENCY_FORBIDDEN,
            details: {
              code: StationErrorCodeSchema.enum.STATION_AGENCY_FORBIDDEN,
            },
          }, 400)),
        Match.tag("StationAgencyNotFound", ({ agencyId }) =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.STATION_AGENCY_NOT_FOUND,
            details: {
              code: StationErrorCodeSchema.enum.STATION_AGENCY_NOT_FOUND,
              agencyId,
            },
          }, 400)),
        Match.tag("StationAgencyAlreadyAssigned", ({ stationId }) =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.STATION_AGENCY_ALREADY_ASSIGNED,
            details: {
              code: StationErrorCodeSchema.enum.STATION_AGENCY_ALREADY_ASSIGNED,
              stationId,
            },
          }, 400)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

export const StationAdminController = {
  listStations,
  createStation,
  updateStation,
} as const;
