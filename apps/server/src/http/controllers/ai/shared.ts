import {
  AiContracts,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
} from "@mebike/shared";

export type AiRoutes = typeof import("@mebike/shared")["serverRoutes"]["ai"];

export const { AiErrorCodeSchema, aiErrorMessages } = AiContracts;

export type AiErrorResponse = AiContracts.AiErrorResponse;

export const unauthorizedBody = {
  error: unauthorizedErrorMessages.UNAUTHORIZED,
  details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
} as const;
