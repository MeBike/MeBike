import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match } from "effect";

import type {
  FixedSlotTemplateBillingConflict,
  FixedSlotTemplateConflict,
  FixedSlotTemplateDateLocked,
  FixedSlotTemplateDateNotFound,
  FixedSlotTemplateDateNotFuture,
  FixedSlotTemplateNotFound,
  FixedSlotTemplateUpdateConflict,
} from "@/domain/reservations";
import type {
  InsufficientWalletBalance,
  WalletNotFound,
} from "@/domain/wallets/domain-errors";

import { FixedSlotTemplateServiceTag } from "@/domain/reservations";
import { withLoggedCause } from "@/domain/shared";
import { toFixedSlotTemplate } from "@/http/presenters/fixed-slot-templates.presenter";

import type {
  CreateFixedSlotTemplateResponse,
  FixedSlotTemplateErrorResponse,
  FixedSlotTemplateResponse,
  FixedSlotTemplatesRoutes,
  ListFixedSlotTemplatesResponse,
  UpdateFixedSlotTemplateResponse,
} from "./shared";

import {
  FixedSlotTemplateErrorCodeSchema,
  fixedSlotTemplateErrorMessages,
  unauthorizedBody,
} from "./shared";

type UpdateFixedSlotTemplateError
  = | FixedSlotTemplateBillingConflict
    | FixedSlotTemplateConflict
    | FixedSlotTemplateDateLocked
    | FixedSlotTemplateDateNotFuture
    | FixedSlotTemplateNotFound
    | FixedSlotTemplateUpdateConflict
    | InsufficientWalletBalance
    | WalletNotFound;

type RemoveFixedSlotTemplateDateError
  = | FixedSlotTemplateDateLocked
    | FixedSlotTemplateDateNotFound
    | FixedSlotTemplateNotFound
    | FixedSlotTemplateUpdateConflict;

const createFixedSlotTemplate: RouteHandler<FixedSlotTemplatesRoutes["createFixedSlotTemplate"]> = async (c) => {
  const userId = c.var.currentUser?.userId ?? null;
  if (!userId) {
    return c.json(unauthorizedBody, 401);
  }

  const body = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.flatMap(FixedSlotTemplateServiceTag, service =>
      service.createForUser({
        userId,
        stationId: body.stationId,
        slotStart: body.slotStart,
        slotDates: body.slotDates,
      })),
    "POST /v1/fixed-slot-templates",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  if (result._tag === "Right") {
    return c.json<CreateFixedSlotTemplateResponse, 201>(toFixedSlotTemplate(result.right), 201);
  }

  return Match.value(result.left).pipe(
    Match.tag("FixedSlotTemplateDateNotFuture", ({ slotDate }) =>
      c.json<FixedSlotTemplateErrorResponse, 400>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_DATE_NOT_FUTURE,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_DATE_NOT_FUTURE,
          slotDate,
        },
      }, 400)),
    Match.tag("FixedSlotTemplateStationNotFound", ({ stationId }) =>
      c.json<FixedSlotTemplateErrorResponse, 404>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_STATION_NOT_FOUND,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_STATION_NOT_FOUND,
          stationId,
        },
      }, 404)),
    Match.tag("FixedSlotTemplateConflict", ({ slotStart, slotDates }) =>
      c.json<FixedSlotTemplateErrorResponse, 409>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_TEMPLATE_CONFLICT,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_TEMPLATE_CONFLICT,
          slotStart,
          slotDates: [...slotDates],
        },
      }, 409)),
    Match.tag("WalletNotFound", () =>
      c.json<FixedSlotTemplateErrorResponse, 400>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_WALLET_NOT_FOUND,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_WALLET_NOT_FOUND,
        },
      }, 400)),
    Match.tag("InsufficientWalletBalance", ({ balance, attemptedDebit }) =>
      c.json<FixedSlotTemplateErrorResponse, 400>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_INSUFFICIENT_BALANCE,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_INSUFFICIENT_BALANCE,
          balance: balance.toString(),
          requiredAmount: attemptedDebit.toString(),
        },
      }, 400)),
    Match.tag("FixedSlotTemplateBillingConflict", () =>
      c.json<FixedSlotTemplateErrorResponse, 409>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_BILLING_CONFLICT,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_BILLING_CONFLICT,
        },
      }, 409)),
    Match.orElse((error) => {
      throw error;
    }),
  );
};

const listFixedSlotTemplates: RouteHandler<FixedSlotTemplatesRoutes["listFixedSlotTemplates"]> = async (c) => {
  const userId = c.var.currentUser?.userId ?? null;
  if (!userId) {
    return c.json(unauthorizedBody, 401);
  }

  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.flatMap(FixedSlotTemplateServiceTag, service =>
      service.listForUser({
        userId,
        filter: {
          status: query.status,
          stationId: query.stationId,
        },
        page: query.page,
        pageSize: query.pageSize,
      })),
    "GET /v1/fixed-slot-templates",
  );

  const page = await c.var.runPromise(eff);

  return c.json<ListFixedSlotTemplatesResponse, 200>({
    data: page.items.map(toFixedSlotTemplate),
    pagination: {
      page: page.page,
      pageSize: page.pageSize,
      total: page.total,
      totalPages: page.totalPages,
    },
  }, 200);
};

const getFixedSlotTemplate: RouteHandler<FixedSlotTemplatesRoutes["getFixedSlotTemplate"]> = async (c) => {
  const userId = c.var.currentUser?.userId ?? null;
  if (!userId) {
    return c.json(unauthorizedBody, 401);
  }

  const { id } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.flatMap(FixedSlotTemplateServiceTag, service =>
      service.getByIdForUser({
        userId,
        templateId: id,
      })),
    "GET /v1/fixed-slot-templates/{id}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  if (result._tag === "Right") {
    return c.json<FixedSlotTemplateResponse, 200>(toFixedSlotTemplate(result.right), 200);
  }

  return Match.value(result.left).pipe(
    Match.tag("FixedSlotTemplateNotFound", () =>
      c.json<FixedSlotTemplateErrorResponse, 404>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_TEMPLATE_NOT_FOUND,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_TEMPLATE_NOT_FOUND,
        },
      }, 404)),
    Match.orElse((error) => {
      throw error;
    }),
  );
};

const cancelFixedSlotTemplate: RouteHandler<FixedSlotTemplatesRoutes["cancelFixedSlotTemplate"]> = async (c) => {
  const userId = c.var.currentUser?.userId ?? null;
  if (!userId) {
    return c.json(unauthorizedBody, 401);
  }

  const { id } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.flatMap(FixedSlotTemplateServiceTag, service =>
      service.cancelForUser({
        userId,
        templateId: id,
      })),
    "POST /v1/fixed-slot-templates/{id}/cancel",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  if (result._tag === "Right") {
    return c.json<FixedSlotTemplateResponse, 200>(toFixedSlotTemplate(result.right), 200);
  }

  return Match.value(result.left).pipe(
    Match.tag("FixedSlotTemplateNotFound", () =>
      c.json<FixedSlotTemplateErrorResponse, 404>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_TEMPLATE_NOT_FOUND,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_TEMPLATE_NOT_FOUND,
        },
      }, 404)),
    Match.tag("FixedSlotTemplateCancelConflict", () =>
      c.json<FixedSlotTemplateErrorResponse, 409>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_TEMPLATE_CANCEL_CONFLICT,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_TEMPLATE_CANCEL_CONFLICT,
        },
      }, 409)),
    Match.orElse((error) => {
      throw error;
    }),
  );
};

const updateFixedSlotTemplate: RouteHandler<FixedSlotTemplatesRoutes["updateFixedSlotTemplate"]> = async (c) => {
  const userId = c.var.currentUser?.userId ?? null;
  if (!userId) {
    return c.json(unauthorizedBody, 401);
  }

  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.flatMap(FixedSlotTemplateServiceTag, service =>
      service.updateForUser({
        userId,
        templateId: id,
        slotStart: body.slotStart,
        slotDates: body.slotDates,
      })),
    "PATCH /v1/fixed-slot-templates/{id}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  if (result._tag === "Right") {
    return c.json<UpdateFixedSlotTemplateResponse, 200>(toFixedSlotTemplate(result.right), 200);
  }

  return Match.value(result.left as UpdateFixedSlotTemplateError).pipe(
    Match.tag("FixedSlotTemplateNotFound", () =>
      c.json<FixedSlotTemplateErrorResponse, 404>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_TEMPLATE_NOT_FOUND,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_TEMPLATE_NOT_FOUND,
        },
      }, 404)),
    Match.tag("FixedSlotTemplateDateNotFuture", ({ slotDate }) =>
      c.json<FixedSlotTemplateErrorResponse, 400>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_DATE_NOT_FUTURE,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_DATE_NOT_FUTURE,
          slotDate,
        },
      }, 400)),
    Match.tag("FixedSlotTemplateDateLocked", ({ slotDate }) =>
      c.json<FixedSlotTemplateErrorResponse, 409>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_DATE_LOCKED,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_DATE_LOCKED,
          slotDate,
        },
      }, 409)),
    Match.tag("FixedSlotTemplateConflict", ({ slotStart, slotDates }) =>
      c.json<FixedSlotTemplateErrorResponse, 409>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_TEMPLATE_CONFLICT,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_TEMPLATE_CONFLICT,
          slotStart,
          slotDates: [...slotDates],
        },
      }, 409)),
    Match.tag("WalletNotFound", () =>
      c.json<FixedSlotTemplateErrorResponse, 400>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_WALLET_NOT_FOUND,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_WALLET_NOT_FOUND,
        },
      }, 400)),
    Match.tag("InsufficientWalletBalance", ({ balance, attemptedDebit }) =>
      c.json<FixedSlotTemplateErrorResponse, 400>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_INSUFFICIENT_BALANCE,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_INSUFFICIENT_BALANCE,
          balance: balance.toString(),
          requiredAmount: attemptedDebit.toString(),
        },
      }, 400)),
    Match.tag("FixedSlotTemplateBillingConflict", () =>
      c.json<FixedSlotTemplateErrorResponse, 409>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_BILLING_CONFLICT,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_BILLING_CONFLICT,
        },
      }, 409)),
    Match.tag("FixedSlotTemplateUpdateConflict", () =>
      c.json<FixedSlotTemplateErrorResponse, 409>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_TEMPLATE_UPDATE_CONFLICT,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_TEMPLATE_UPDATE_CONFLICT,
        },
      }, 409)),
    Match.exhaustive,
  );
};

const removeFixedSlotTemplateDate: RouteHandler<FixedSlotTemplatesRoutes["removeFixedSlotTemplateDate"]> = async (c) => {
  const userId = c.var.currentUser?.userId ?? null;
  if (!userId) {
    return c.json(unauthorizedBody, 401);
  }

  const { id, slotDate } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.flatMap(FixedSlotTemplateServiceTag, service =>
      service.removeDateForUser({
        userId,
        templateId: id,
        slotDate,
      })),
    "DELETE /v1/fixed-slot-templates/{id}/dates/{slotDate}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  if (result._tag === "Right") {
    return c.json<FixedSlotTemplateResponse, 200>(toFixedSlotTemplate(result.right), 200);
  }

  return Match.value(result.left as RemoveFixedSlotTemplateDateError).pipe(
    Match.tag("FixedSlotTemplateNotFound", () =>
      c.json<FixedSlotTemplateErrorResponse, 404>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_TEMPLATE_NOT_FOUND,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_TEMPLATE_NOT_FOUND,
        },
      }, 404)),
    Match.tag("FixedSlotTemplateDateNotFound", ({ slotDate }) =>
      c.json<FixedSlotTemplateErrorResponse, 404>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_DATE_NOT_FOUND,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_DATE_NOT_FOUND,
          slotDate,
        },
      }, 404)),
    Match.tag("FixedSlotTemplateDateLocked", ({ slotDate }) =>
      c.json<FixedSlotTemplateErrorResponse, 409>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_DATE_LOCKED,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_DATE_LOCKED,
          slotDate,
        },
      }, 409)),
    Match.tag("FixedSlotTemplateUpdateConflict", () =>
      c.json<FixedSlotTemplateErrorResponse, 409>({
        error: fixedSlotTemplateErrorMessages.FIXED_SLOT_TEMPLATE_UPDATE_CONFLICT,
        details: {
          code: FixedSlotTemplateErrorCodeSchema.enum.FIXED_SLOT_TEMPLATE_UPDATE_CONFLICT,
        },
      }, 409)),
    Match.exhaustive,
  );
};

export const FixedSlotTemplateMeController = {
  cancelFixedSlotTemplate,
  createFixedSlotTemplate,
  getFixedSlotTemplate,
  listFixedSlotTemplates,
  removeFixedSlotTemplateDate,
  updateFixedSlotTemplate,
} as const;
