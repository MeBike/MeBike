import type { RouteHandler } from "@hono/zod-openapi";
import type { IncidentsContracts } from "@mebike/shared";

import {
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
} from "@mebike/shared";
import { Effect, Match } from "effect";

import type { IncidentStatus } from "generated/kysely/types";

import {
  IncidentImageUploadServiceTag,
  IncidentServiceTag,
} from "@/domain/incidents";
import { withLoggedCause } from "@/domain/shared";
import { toIncidentSummary } from "@/http/presenters/incidents.presenter";
import { Prisma } from "generated/prisma/client";

import type { IncidentRoutes, IncidentSummary } from "./shared";

import { IncidentErrorCodeSchema, incidentErrorMessages } from "./shared";

function respondUnauthorized(c: Parameters<RouteHandler<any>>[0]) {
  return c.json(
    {
      error: unauthorizedErrorMessages.UNAUTHORIZED,
      details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
    },
    c.var.authFailure === "forbidden" ? 403 : 401,
  );
}

function pickIncidentImageFiles(
  value: string | File | Array<string | File> | undefined,
) {
  if (value instanceof File) {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((entry): entry is File => entry instanceof File);
  }

  return [];
}

const uploadIncidentImages: RouteHandler<IncidentRoutes["uploadIncidentImages"]> = async (
  c,
) => {
  const userId = c.var.currentUser?.userId;
  if (!userId) {
    return respondUnauthorized(c);
  }

  const form = await c.req.parseBody({ all: true });
  const files = pickIncidentImageFiles(form.files);

  if (files.length === 0) {
    return c.json<IncidentsContracts.IncidentErrorResponse, 400>(
      {
        error: incidentErrorMessages.INVALID_INCIDENT_IMAGE,
        details: { code: IncidentErrorCodeSchema.enum.INVALID_INCIDENT_IMAGE },
      },
      400,
    );
  }

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* IncidentImageUploadServiceTag;

      return yield* service.uploadForUser({
        userId,
        files: yield* Effect.forEach(files, file =>
          Effect.promise(async () => ({
            bytes: new Uint8Array(await file.arrayBuffer()),
            originalFilename: file.name,
          }))),
      });
    }),
    "POST /v1/incidents/images",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => c.json<IncidentsContracts.UploadIncidentImagesResponse, 200>(right, 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("IncidentImageTooLarge", () =>
          c.json<IncidentsContracts.IncidentErrorResponse, 400>(
            {
              error: incidentErrorMessages.INCIDENT_IMAGE_TOO_LARGE,
              details: { code: IncidentErrorCodeSchema.enum.INCIDENT_IMAGE_TOO_LARGE },
            },
            400,
          )),
        Match.tag("IncidentImageUnsupportedType", () =>
          c.json<IncidentsContracts.IncidentErrorResponse, 400>(
            {
              error: incidentErrorMessages.INVALID_INCIDENT_IMAGE,
              details: { code: IncidentErrorCodeSchema.enum.INVALID_INCIDENT_IMAGE },
            },
            400,
          )),
        Match.tag("IncidentImageInvalid", () =>
          c.json<IncidentsContracts.IncidentErrorResponse, 400>(
            {
              error: incidentErrorMessages.INVALID_INCIDENT_IMAGE,
              details: { code: IncidentErrorCodeSchema.enum.INVALID_INCIDENT_IMAGE },
            },
            400,
          )),
        Match.tag("IncidentImageDimensionsExceeded", () =>
          c.json<IncidentsContracts.IncidentErrorResponse, 400>(
            {
              error: incidentErrorMessages.INCIDENT_IMAGE_DIMENSIONS_TOO_LARGE,
              details: {
                code: IncidentErrorCodeSchema.enum.INCIDENT_IMAGE_DIMENSIONS_TOO_LARGE,
              },
            },
            400,
          )),
        Match.tag("FirebaseStorageInitError", () =>
          c.json<IncidentsContracts.IncidentErrorResponse, 503>(
            {
              error: incidentErrorMessages.INCIDENT_IMAGE_UPLOAD_UNAVAILABLE,
              details: {
                code: IncidentErrorCodeSchema.enum.INCIDENT_IMAGE_UPLOAD_UNAVAILABLE,
              },
            },
            503,
          )),
        Match.tag("FirebaseStorageUploadError", () =>
          c.json<IncidentsContracts.IncidentErrorResponse, 503>(
            {
              error: incidentErrorMessages.INCIDENT_IMAGE_UPLOAD_UNAVAILABLE,
              details: {
                code: IncidentErrorCodeSchema.enum.INCIDENT_IMAGE_UPLOAD_UNAVAILABLE,
              },
            },
            503,
          )),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

const listIncidents: RouteHandler<IncidentRoutes["listIncidents"]> = async (
  c,
) => {
  const user = c.var.currentUser;
  const query = c.req.valid("query");
  if (!user) {
    return respondUnauthorized(c);
  }

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* IncidentServiceTag;
      return yield* service.listIncidents(
        user!.role,
        {
          rentalId: query.rentalId,
          stationId: query.stationId,
          statuses: query.statuses as IncidentStatus[] | undefined,
          status: query.status as IncidentStatus,
          userId: user?.role === "ADMIN"
            ? undefined
            : user?.userId,
        },
        {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 50,
          sortBy: query.sortBy ?? "resolvedAt",
          sortDir: query.sortDir ?? "asc",
        },
      );
    }),
    "GET /v1/incidents",
  );

  const value = await c.var.runPromise(eff);
  return c.json<IncidentsContracts.IncidentListResponse, 200>(
    {
      data: value.items,
      pagination: {
        page: value.page,
        pageSize: value.pageSize,
        total: value.total,
        totalPages: value.totalPages,
      },
    },
    200,
  );
};

const getIncident: RouteHandler<IncidentRoutes["getIncident"]> = async (c) => {
  const user = c.var.currentUser;
  const { incidentId } = c.req.valid("param");
  if (!user) {
    return respondUnauthorized(c);
  }

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* IncidentServiceTag;
      return yield* service.getIncidentById(
        incidentId,
        user?.userId,
        user?.role,
      );
    }),
    "GET /v1/incidents/:incidentId",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      return c.json(right, 200);
    }),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("IncidentNotFound", () =>
          c.json(
            {
              error: incidentErrorMessages.INCIDENT_NOT_FOUND,
              details: {
                code: IncidentErrorCodeSchema.enum.INCIDENT_NOT_FOUND,
                incidentId,
              },
            },
            404,
          )),
        Match.tag("UnauthorizedIncidentAccess", ({ incidentId, userId }) =>
          c.json(
            {
              error: incidentErrorMessages.UNAUTHORIZED_INCIDENT_ACCESS,
              details: {
                code: IncidentErrorCodeSchema.enum.UNAUTHORIZED_INCIDENT_ACCESS,
                incidentId,
                userId,
              },
            },
            403,
          )),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

const createIncident: RouteHandler<IncidentRoutes["createIncident"]> = async (
  c,
) => {
  const currentUser = c.var.currentUser;
  if (!currentUser) {
    return c.json(
      {
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      },
      401,
    );
  }
  const userId = currentUser.userId;
  const currentRole = currentUser.role;
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* IncidentServiceTag;
      return yield* service.createIncident({
        reporterUserId: userId,
        reporterRole: currentRole,
        rentalId: body.rentalId ?? null,
        bikeId: body.bikeId ?? null,
        stationId: body.stationId ?? null,
        incidentType: body.incidentType,
        description: body.description ?? null,
        latitude: body.latitude ? new Prisma.Decimal(body.latitude) : null,
        longitude: body.longitude ? new Prisma.Decimal(body.longitude) : null,
        fileUrls: body.fileUrls ?? [],
      });
    }),
    "POST /v1/incidents",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<IncidentSummary, 201>(toIncidentSummary(right), 201)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("AdminRentalNotFound", () =>
          c.json(
            {
              error: incidentErrorMessages.RENTAL_NOT_FOUND,
              details: {
                code: IncidentErrorCodeSchema.enum.RENTAL_NOT_FOUND,
                rentalId: body.rentalId,
              },
            },
            404,
          )),
        Match.tag("BikeNotFound", ({ id }) =>
          c.json(
            {
              error: incidentErrorMessages.BIKE_NOT_FOUND,
              details: {
                code: IncidentErrorCodeSchema.enum.BIKE_NOT_FOUND,
                bikeId: id,
              },
            },
            404,
          )),
        Match.tag("StationNotFound", ({ id }) =>
          c.json(
            {
              error: incidentErrorMessages.STATION_NOT_FOUND,
              details: {
                code: IncidentErrorCodeSchema.enum.STATION_NOT_FOUND,
                stationId: id,
              },
            },
            404,
          )),
        Match.tag("NoNearestStationFound", ({ latitude, longitude }) =>
          c.json(
            {
              error: incidentErrorMessages.NO_NEAREST_STATION_FOUND,
              details: {
                code: IncidentErrorCodeSchema.enum.NO_NEAREST_STATION_FOUND,
                latitude,
                longitude,
              },
            },
            404,
          )),
        Match.tag("BikeNotAvailable", ({ bikeId, status }) =>
          c.json(
            {
              error: incidentErrorMessages.BIKE_NOT_AVAILABLE,
              details: {
                code: IncidentErrorCodeSchema.enum.BIKE_NOT_AVAILABLE,
                bikeId,
                status,
              },
            },
            404,
          )),
        Match.tag("NoAvailableTechnicianFound", ({ latitude, longitude }) =>
          c.json(
            {
              error: incidentErrorMessages.NO_AVAILABLE_TECHNICIAN_FOUND,
              details: {
                code: IncidentErrorCodeSchema.enum
                  .NO_AVAILABLE_TECHNICIAN_FOUND,
                latitude,
                longitude,
              },
            },
            404,
          )),
        Match.tag("ActiveIncidentAlreadyExists", () =>
          c.json(
            {
              error: incidentErrorMessages.ACTIVE_INCIDENT_ALREADY_EXISTS,
              details: {
                code: IncidentErrorCodeSchema.enum
                  .ACTIVE_INCIDENT_ALREADY_EXISTS,
                rentalId: body.rentalId,
                bikeId: body.bikeId,
                stationId: body.stationId,
              },
            },
            400,
          )),
        Match.tag("IncidentInternalStationRequired", ({ stationId, stationType }) =>
          c.json(
            {
              error: incidentErrorMessages.INCIDENT_INTERNAL_STATION_REQUIRED,
              details: {
                code: IncidentErrorCodeSchema.enum
                  .INCIDENT_INTERNAL_STATION_REQUIRED,
                stationId,
                stationType,
              },
            },
            400,
          )),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

const updateIncident: RouteHandler<IncidentRoutes["updateIncident"]> = async (
  c,
) => {
  const currentUser = c.var.currentUser;
  if (!currentUser) {
    return c.json(
      {
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      },
      401,
    );
  }
  const userId = currentUser.userId;
  const { incidentId } = c.req.valid("param");
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* IncidentServiceTag;
      return yield* service.updateIncident(userId, incidentId, body);
    }),
    "PUT /v1/incidents/:incidentId",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => c.json(right, 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("IncidentNotFound", () =>
          c.json(
            {
              error: incidentErrorMessages.INCIDENT_NOT_FOUND,
              details: {
                code: IncidentErrorCodeSchema.enum.INCIDENT_NOT_FOUND,
                incidentId,
              },
            },
            404,
          )),
        Match.tag("UnauthorizedIncidentAccess", ({ incidentId, userId }) =>
          c.json(
            {
              error: incidentErrorMessages.UNAUTHORIZED_INCIDENT_ACCESS,
              details: {
                code: IncidentErrorCodeSchema.enum.UNAUTHORIZED_INCIDENT_ACCESS,
                incidentId,
                userId,
              },
            },
            403,
          )),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

export const IncidentPublicController = {
  listIncidents,
  getIncident,
  uploadIncidentImages,
  createIncident,
  updateIncident,
} as const;
