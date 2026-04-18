import type { RouteHandler } from "@hono/zod-openapi";
import type { EnvironmentContracts, ServerErrorResponse } from "@mebike/shared";

import {
  EnvironmentErrorCodeSchema,
  environmentErrorMessages,
} from "@mebike/shared";
import { Effect, Match } from "effect";

import { EnvironmentImpactServiceTag } from "@/domain/environment";
import {
  toContractAdminEnvironmentImpactDetail,
  toContractAdminEnvironmentImpactListItem,
  toContractAdminEnvironmentUserSummary,
  toContractEnvironmentImpact,
  toContractEnvironmentImpactDetail,
  toContractEnvironmentImpactHistoryItem,
  toContractEnvironmentSummary,
} from "@/http/presenters/environment.presenter";
import { toContractPage } from "@/http/shared/pagination";

type EnvironmentRoutes = typeof import("@mebike/shared")["serverRoutes"]["environment"];

const getMySummary: RouteHandler<
  EnvironmentRoutes["getMyEnvironmentSummary"]
> = async (c) => {
  const userId = c.var.currentUser!.userId;

  const eff = Effect.flatMap(EnvironmentImpactServiceTag, service =>
    service.getMySummary(userId));

  const summary = await c.var.runPromise(eff);

  return c.json<EnvironmentContracts.EnvironmentSummary, 200>(
    toContractEnvironmentSummary(summary),
    200,
  );
};

const getMyHistory: RouteHandler<
  EnvironmentRoutes["getMyEnvironmentImpactHistory"]
> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const query = c.req.valid("query");

  const eff = Effect.flatMap(EnvironmentImpactServiceTag, service =>
    service.getMyHistory(userId, {
      page: query.page,
      pageSize: query.pageSize,
      sortOrder: query.sortOrder,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    }));

  const result = await c.var.runPromise(eff);

  return c.json<EnvironmentContracts.EnvironmentImpactHistoryResponse, 200>({
    data: result.items.map(toContractEnvironmentImpactHistoryItem),
    pagination: toContractPage(result),
  }, 200);
};

const getMyRentalImpact: RouteHandler<
  EnvironmentRoutes["getMyEnvironmentImpactByRental"]
> = async (c) => {
  const userId = c.var.currentUser!.userId;
  const { rentalId } = c.req.valid("param");

  const eff = Effect.flatMap(EnvironmentImpactServiceTag, service =>
    service.getMyRentalImpact(userId, rentalId));

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<EnvironmentContracts.EnvironmentImpactDetail, 200>(
        toContractEnvironmentImpactDetail(right),
        200,
      )),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("EnvironmentImpactNotFound", () =>
          c.json<ServerErrorResponse, 404>({
            error: environmentErrorMessages.ENVIRONMENT_IMPACT_NOT_FOUND,
            details: {
              code: EnvironmentErrorCodeSchema.enum.ENVIRONMENT_IMPACT_NOT_FOUND,
            },
          }, 404)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const listAdminImpacts: RouteHandler<
  EnvironmentRoutes["listAdminEnvironmentImpacts"]
> = async (c) => {
  const query = c.req.valid("query");

  const eff = Effect.flatMap(EnvironmentImpactServiceTag, service =>
    service.listAdminImpactHistory({
      page: query.page,
      pageSize: query.pageSize,
      sortOrder: query.sortOrder,
      userId: query.userId,
      rentalId: query.rentalId,
      policyId: query.policyId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    }));

  const result = await c.var.runPromise(eff);

  return c.json<EnvironmentContracts.AdminEnvironmentImpactListResponse, 200>({
    data: result.items.map(toContractAdminEnvironmentImpactListItem),
    pagination: toContractPage(result),
  }, 200);
};

const getAdminImpactDetail: RouteHandler<
  EnvironmentRoutes["getAdminEnvironmentImpactDetail"]
> = async (c) => {
  const { impactId } = c.req.valid("param");

  const eff = Effect.flatMap(EnvironmentImpactServiceTag, service =>
    service.getAdminImpactDetail(impactId));

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<EnvironmentContracts.AdminEnvironmentImpactDetail, 200>(
        toContractAdminEnvironmentImpactDetail(right),
        200,
      )),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("EnvironmentImpactNotFound", () =>
          c.json<ServerErrorResponse, 404>({
            error: environmentErrorMessages.ENVIRONMENT_IMPACT_NOT_FOUND,
            details: {
              code: EnvironmentErrorCodeSchema.enum.ENVIRONMENT_IMPACT_NOT_FOUND,
            },
          }, 404)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const getAdminUserSummary: RouteHandler<
  EnvironmentRoutes["getAdminEnvironmentUserSummary"]
> = async (c) => {
  const { userId } = c.req.valid("param");

  const eff = Effect.flatMap(EnvironmentImpactServiceTag, service =>
    service.getAdminUserSummary(userId));

  const summary = await c.var.runPromise(eff);

  return c.json<EnvironmentContracts.AdminEnvironmentUserSummary, 200>(
    toContractAdminEnvironmentUserSummary(userId, summary),
    200,
  );
};

const calculateFromRental: RouteHandler<
  EnvironmentRoutes["calculateEnvironmentImpactFromRental"]
> = async (c) => {
  const { rentalId } = c.req.valid("param");

  const eff = Effect.flatMap(EnvironmentImpactServiceTag, service =>
    service.calculateFromRental(rentalId));

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<EnvironmentContracts.EnvironmentImpact, 200>(
        toContractEnvironmentImpact(
          right.impact,
          right.alreadyCalculated,
        ),
        200,
      )),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("EnvironmentImpactRentalNotFound", () =>
          c.json<ServerErrorResponse, 404>({
            error: environmentErrorMessages.ENVIRONMENT_IMPACT_RENTAL_NOT_FOUND,
            details: {
              code: EnvironmentErrorCodeSchema.enum.ENVIRONMENT_IMPACT_RENTAL_NOT_FOUND,
            },
          }, 404)),
        Match.tag("EnvironmentImpactRentalNotCompleted", () =>
          c.json<ServerErrorResponse, 409>({
            error: environmentErrorMessages.ENVIRONMENT_IMPACT_RENTAL_NOT_COMPLETED,
            details: {
              code: EnvironmentErrorCodeSchema.enum.ENVIRONMENT_IMPACT_RENTAL_NOT_COMPLETED,
            },
          }, 409)),
        Match.tag("ActiveEnvironmentPolicyNotFound", () =>
          c.json<ServerErrorResponse, 404>({
            error: environmentErrorMessages.ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND,
            details: {
              code: EnvironmentErrorCodeSchema.enum.ACTIVE_ENVIRONMENT_POLICY_NOT_FOUND,
            },
          }, 404)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

export const EnvironmentImpactController = {
  getMySummary,
  getMyHistory,
  getMyRentalImpact,
  listAdminImpacts,
  getAdminImpactDetail,
  getAdminUserSummary,
  calculateFromRental,
} as const;
