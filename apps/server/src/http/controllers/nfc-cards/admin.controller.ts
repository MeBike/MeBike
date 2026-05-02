import type { RouteHandler } from "@hono/zod-openapi";
import type { NfcCardsContracts } from "@mebike/shared";

import { Effect, Match } from "effect";

import {
  NfcCardCommandServiceTag,
  NfcCardQueryServiceTag,
} from "@/domain/nfc-cards";
import { withLoggedCause } from "@/domain/shared";
import { toContractNfcCard } from "@/http/presenters/nfc-cards.presenter";

import type { NfcCardsRoutes } from "./shared";

import {
  NfcCardErrorCodeSchema,
  nfcCardErrorMessages,
} from "./shared";

function notFoundBody(nfcCardId: string): NfcCardsContracts.NfcCardErrorResponse {
  return {
    error: nfcCardErrorMessages.NFC_CARD_NOT_FOUND,
    details: {
      code: NfcCardErrorCodeSchema.enum.NFC_CARD_NOT_FOUND,
      nfcCardId,
    },
  };
}

const adminListNfcCards: RouteHandler<NfcCardsRoutes["adminList"]> = async (c) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.flatMap(NfcCardQueryServiceTag, service =>
      service.list({
        status: query.status,
        assignedUserId: query.assignedUserId,
        uid: query.uid,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
      })),
    "GET /v1/admin/nfc-cards",
  );

  const cards = await c.var.runPromise(eff);
  return c.json<NfcCardsContracts.NfcCardListResponse, 200>({
    data: cards.items.map(toContractNfcCard),
    pagination: {
      page: cards.page,
      pageSize: cards.pageSize,
      total: cards.total,
      totalPages: cards.totalPages,
    },
  }, 200);
};

const adminGetNfcCard: RouteHandler<NfcCardsRoutes["adminGet"]> = async (c) => {
  const { nfcCardId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.flatMap(NfcCardQueryServiceTag, service => service.getById(nfcCardId)),
    "GET /v1/admin/nfc-cards/{nfcCardId}",
  );

  const result = await c.var.runPromise(eff);
  if (result._tag === "Some") {
    return c.json<NfcCardsContracts.NfcCard, 200>(toContractNfcCard(result.value), 200);
  }

  return c.json<NfcCardsContracts.NfcCardErrorResponse, 404>({
    error: nfcCardErrorMessages.NFC_CARD_NOT_FOUND,
    details: {
      code: NfcCardErrorCodeSchema.enum.NFC_CARD_NOT_FOUND,
      nfcCardId,
    },
  }, 404);
};

const adminCreateNfcCard: RouteHandler<NfcCardsRoutes["adminCreate"]> = async (c) => {
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.flatMap(NfcCardCommandServiceTag, service => service.createCard({ uid: body.uid })),
    "POST /v1/admin/nfc-cards",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<NfcCardsContracts.NfcCard, 201>(toContractNfcCard(right), 201)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("DuplicateNfcCardUid", ({ uid }) =>
          c.json<NfcCardsContracts.NfcCardErrorResponse, 409>({
            error: nfcCardErrorMessages.DUPLICATE_NFC_CARD_UID,
            details: {
              code: NfcCardErrorCodeSchema.enum.DUPLICATE_NFC_CARD_UID,
              uid,
            },
          }, 409)),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

const adminAssignNfcCard: RouteHandler<NfcCardsRoutes["adminAssign"]> = async (c) => {
  const { nfcCardId } = c.req.valid("param");
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.flatMap(NfcCardCommandServiceTag, service =>
      service.assignCard({
        nfcCardId,
        userId: body.userId,
        now: new Date(),
      })),
    "PATCH /v1/admin/nfc-cards/{nfcCardId}/assign",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<NfcCardsContracts.NfcCard, 200>(toContractNfcCard(right), 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("NfcCardAlreadyAssigned", ({ nfcCardId: failedCardId, assignedUserId }) =>
          c.json<NfcCardsContracts.NfcCardErrorResponse, 409>({
            error: nfcCardErrorMessages.NFC_CARD_ALREADY_ASSIGNED,
            details: {
              code: NfcCardErrorCodeSchema.enum.NFC_CARD_ALREADY_ASSIGNED,
              nfcCardId: failedCardId,
              assignedUserId,
            },
          }, 409)),
        Match.tag("UserAlreadyHasNfcCard", ({ userId, nfcCardId: existingNfcCardId }) =>
          c.json<NfcCardsContracts.NfcCardErrorResponse, 409>({
            error: nfcCardErrorMessages.USER_ALREADY_HAS_NFC_CARD,
            details: {
              code: NfcCardErrorCodeSchema.enum.USER_ALREADY_HAS_NFC_CARD,
              userId,
              nfcCardId: existingNfcCardId,
            },
          }, 409)),
        Match.tag("NfcCardAssigneeNotFound", ({ userId }) =>
          c.json<NfcCardsContracts.NfcCardErrorResponse, 404>({
            error: nfcCardErrorMessages.NFC_CARD_ASSIGNEE_NOT_FOUND,
            details: {
              code: NfcCardErrorCodeSchema.enum.NFC_CARD_ASSIGNEE_NOT_FOUND,
              userId,
            },
          }, 404)),
        Match.tag("NfcCardNotFound", ({ nfcCardId: failedCardId }) =>
          c.json<NfcCardsContracts.NfcCardErrorResponse, 404>(notFoundBody(failedCardId), 404)),
        Match.tag("NfcCardUserNotEligible", ({ userId, reason }) =>
          c.json<NfcCardsContracts.NfcCardErrorResponse, 400>({
            error: nfcCardErrorMessages.NFC_CARD_USER_NOT_ELIGIBLE,
            details: {
              code: NfcCardErrorCodeSchema.enum.NFC_CARD_USER_NOT_ELIGIBLE,
              userId,
              reason,
            },
          }, 400)),
        Match.tag("NfcCardInvalidState", ({ nfcCardId: failedCardId, status, message }) =>
          c.json<NfcCardsContracts.NfcCardErrorResponse, 400>({
            error: nfcCardErrorMessages.NFC_CARD_INVALID_STATE,
            details: {
              code: NfcCardErrorCodeSchema.enum.NFC_CARD_INVALID_STATE,
              nfcCardId: failedCardId,
              status,
              message,
            },
          }, 400)),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

const adminUnassignNfcCard: RouteHandler<NfcCardsRoutes["adminUnassign"]> = async (c) => {
  const { nfcCardId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.flatMap(NfcCardCommandServiceTag, service =>
      service.unassignCard({
        nfcCardId,
        now: new Date(),
      })),
    "PATCH /v1/admin/nfc-cards/{nfcCardId}/unassign",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<NfcCardsContracts.NfcCard, 200>(toContractNfcCard(right), 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("NfcCardNotFound", ({ nfcCardId: failedCardId }) =>
          c.json<NfcCardsContracts.NfcCardErrorResponse, 404>(notFoundBody(failedCardId), 404)),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

const adminUpdateNfcCardStatus: RouteHandler<NfcCardsRoutes["adminUpdateStatus"]> = async (c) => {
  const { nfcCardId } = c.req.valid("param");
  const body = c.req.valid("json");

  const eff = withLoggedCause(
    Effect.flatMap(NfcCardCommandServiceTag, service =>
      service.updateStatus({
        nfcCardId,
        status: body.status,
        now: new Date(),
      })),
    "PATCH /v1/admin/nfc-cards/{nfcCardId}/status",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<NfcCardsContracts.NfcCard, 200>(toContractNfcCard(right), 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("NfcCardAssigneeNotFound", ({ userId }) =>
          c.json<NfcCardsContracts.NfcCardErrorResponse, 404>({
            error: nfcCardErrorMessages.NFC_CARD_ASSIGNEE_NOT_FOUND,
            details: {
              code: NfcCardErrorCodeSchema.enum.NFC_CARD_ASSIGNEE_NOT_FOUND,
              userId,
            },
          }, 404)),
        Match.tag("NfcCardNotFound", ({ nfcCardId: failedCardId }) =>
          c.json<NfcCardsContracts.NfcCardErrorResponse, 404>(notFoundBody(failedCardId), 404)),
        Match.tag("NfcCardUserNotEligible", ({ userId, reason }) =>
          c.json<NfcCardsContracts.NfcCardErrorResponse, 400>({
            error: nfcCardErrorMessages.NFC_CARD_USER_NOT_ELIGIBLE,
            details: {
              code: NfcCardErrorCodeSchema.enum.NFC_CARD_USER_NOT_ELIGIBLE,
              userId,
              reason,
            },
          }, 400)),
        Match.tag("NfcCardInvalidState", ({ nfcCardId: failedCardId, status, message }) =>
          c.json<NfcCardsContracts.NfcCardErrorResponse, 400>({
            error: nfcCardErrorMessages.NFC_CARD_INVALID_STATE,
            details: {
              code: NfcCardErrorCodeSchema.enum.NFC_CARD_INVALID_STATE,
              nfcCardId: failedCardId,
              status,
              message,
            },
          }, 400)),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

export const NfcCardsAdminController = {
  adminAssignNfcCard,
  adminCreateNfcCard,
  adminGetNfcCard,
  adminListNfcCards,
  adminUnassignNfcCard,
  adminUpdateNfcCardStatus,
};
