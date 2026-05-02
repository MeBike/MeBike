import type { RouteConfig } from "@hono/zod-openapi";

import { serverRoutes } from "@mebike/shared";

import { NfcCardsAdminController } from "@/http/controllers/nfc-cards";
import { requireAdminMiddleware } from "@/http/middlewares/auth";

export function registerNfcCardRoutes(
  app: import("@hono/zod-openapi").OpenAPIHono,
) {
  const nfcCards = serverRoutes.nfcCards;
  const adminListRoute = {
    ...nfcCards.adminList,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminGetRoute = {
    ...nfcCards.adminGet,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminCreateRoute = {
    ...nfcCards.adminCreate,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminAssignRoute = {
    ...nfcCards.adminAssign,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminUnassignRoute = {
    ...nfcCards.adminUnassign,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;
  const adminUpdateStatusRoute = {
    ...nfcCards.adminUpdateStatus,
    middleware: [requireAdminMiddleware] as const,
  } satisfies RouteConfig;

  app.openapi(adminListRoute, NfcCardsAdminController.adminListNfcCards);
  app.openapi(adminGetRoute, NfcCardsAdminController.adminGetNfcCard);
  app.openapi(adminCreateRoute, NfcCardsAdminController.adminCreateNfcCard);
  app.openapi(adminAssignRoute, NfcCardsAdminController.adminAssignNfcCard);
  app.openapi(adminUnassignRoute, NfcCardsAdminController.adminUnassignNfcCard);
  app.openapi(adminUpdateStatusRoute, NfcCardsAdminController.adminUpdateNfcCardStatus);
}
