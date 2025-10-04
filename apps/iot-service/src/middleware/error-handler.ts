import type { IotService } from "@mebike/shared";
import type { MiddlewareHandler } from "hono";

import { env } from "node:process";
import { z } from "zod";

type ErrorStatus = 400 | 409 | 422 | 500;

type ErrorResponse = IotService.ErrorResponse;

export enum ErrorDomain {
  VALIDATION = "VALIDATION",
  BUSINESS_LOGIC = "BUSINESS_LOGIC",
  INFRASTRUCTURE = "INFRASTRUCTURE",
  UNKNOWN = "UNKNOWN",
}

function toErrorResponse(error: string, details?: Record<string, unknown>): ErrorResponse {
  return details
    ? { error, details }
    : { error };
}

function normalizeDetails(details?: unknown): Record<string, unknown> | undefined {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return undefined;
  }
  return details as Record<string, unknown>;
}

export function errorHandler(): MiddlewareHandler {
  return async (c, next) => {
    try {
      await next();
    }
    catch (err) {
      if (err instanceof z.ZodError || (err instanceof Error && err.name === "ZodError")) {
        const rawIssues = err instanceof z.ZodError
          ? err.issues
          : Array.isArray((err as any).issues)
            ? (err as any).issues as Array<Record<string, unknown>>
            : [];

        const issues = rawIssues.map((issue) => {
          const pathValue = (issue as any).path;
          const pathArray = Array.isArray(pathValue) ? pathValue as Array<string | number> : [];
          const path = pathArray.length ? pathArray.join(".") : "body";
          return {
            path,
            message: String((issue as any).message ?? "Invalid value"),
            code: (issue as any).code ? String((issue as any).code) : undefined,
            expected: (issue as any).expected,
            received: (issue as any).received,
          };
        });

        return c.json<ErrorResponse, 400>(
          toErrorResponse("Invalid command payload", {
            code: "VALIDATION_ERROR",
            ...(issues.length ? { issues } : {}),
          }),
          400,
        );
      }

      if (err instanceof BusinessLogicError) {
        const details = normalizeDetails(err.details) ?? {};
        const response: ErrorResponse = toErrorResponse(err.message, {
          code: (details.code as string | undefined) ?? "BUSINESS_LOGIC_ERROR",
          ...details,
        });

        const status: ErrorStatus = err.status ?? 400;
        return c.json(response, status);
      }
      if (err instanceof Error && err.name === "InfrastructureError") {
        const isDevelopment = env.NODE_ENV === "development";
        return c.json<ErrorResponse, 500>(
          toErrorResponse(
            "A system error occurred. Please try again later.",
            isDevelopment ? { code: "INFRASTRUCTURE_ERROR", detail: err.message } : { code: "INFRASTRUCTURE_ERROR" },
          ),
          500,
        );
      }

      const error = err instanceof Error ? err : new Error(String(err));
      const isDevelopment = env.NODE_ENV === "development";
      return c.json<ErrorResponse, 500>(
        toErrorResponse(
          error.message || "An unexpected error occurred",
          isDevelopment
            ? {
                code: "INTERNAL_ERROR",
                stack: error.stack,
              }
            : { code: "INTERNAL_ERROR" },
        ),
        500,
      );
    }
  };
}

export class BusinessLogicError extends Error {
  constructor(
    message: string,
    options?: {
      details?: Record<string, unknown>;
      status?: ErrorStatus;
    },
  ) {
    super(message);
    this.name = "BusinessLogicError";
    this.details = options?.details;
    this.status = options?.status ?? 400;
  }

  details?: Record<string, unknown>;
  status: ErrorStatus;
}

export class InfrastructureError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = "InfrastructureError";
  }
}
