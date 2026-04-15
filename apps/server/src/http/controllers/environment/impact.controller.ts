import type { RouteHandler } from "@hono/zod-openapi";
import type { EnvironmentContracts, ServerErrorResponse } from "@mebike/shared";

import {
  EnvironmentErrorCodeSchema,
  environmentErrorMessages,
  serverRoutes,
} from "@mebike/shared";
import { Effect, Match } from "effect";

import { EnvironmentImpactServiceTag } from "@/domain/environment";
import {
  toContractEnvironmentImpact,
  toContractEnvironmentImpactDetail,
  toContractEnvironmentImpactHistoryItem,
  toContractEnvironmentSummary,
} from "@/http/presenters/environment.presenter";

type EnvironmentRoutes = typeof serverRoutes.environment;

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
    items: result.items.map(toContractEnvironmentImpactHistoryItem),
    page: result.page,
    pageSize: result.pageSize,
    totalItems: result.total,
    totalPages: result.totalPages,
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
  calculateFromRental,
} as const;
