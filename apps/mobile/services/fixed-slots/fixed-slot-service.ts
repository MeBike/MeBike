import type { Result } from "@lib/result";
import type { z } from "zod";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { toSearchParams } from "@services/shared/search-params";
import { StatusCodes } from "http-status-codes";

import type {
  CreateFixedSlotTemplatePayload,
  FixedSlotTemplate,
  FixedSlotTemplateListParams,
  FixedSlotTemplateListResponse,
  UpdateFixedSlotTemplatePayload,
} from "@/contracts/server";

import type { FixedSlotError } from "./fixed-slot-error";

import { asNetworkError, parseFixedSlotError } from "./fixed-slot-error";

export type { FixedSlotError } from "./fixed-slot-error";

async function decodeFixedSlotResponse<TValue>(
  response: Response,
  schema: z.ZodType<TValue>,
): Promise<Result<TValue, FixedSlotError>> {
  try {
    const data = await readJson(response);
    const parsed = decodeWithSchema(schema, data);
    return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
  }
  catch {
    return err({ _tag: "DecodeError" });
  }
}

export const fixedSlotService = {
  getList: async (
    params: FixedSlotTemplateListParams = {},
  ): Promise<Result<FixedSlotTemplateListResponse, FixedSlotError>> => {
    try {
      const response = await kyClient.get(routePath(ServerRoutes.fixedSlotTemplates.listFixedSlotTemplates), {
        searchParams: toSearchParams(params),
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.fixedSlotTemplates.listFixedSlotTemplates.responses[200].content["application/json"].schema;
        return decodeFixedSlotResponse(response, okSchema as z.ZodType<FixedSlotTemplateListResponse>);
      }

      return err(await parseFixedSlotError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  getDetail: async (id: string): Promise<Result<FixedSlotTemplate, FixedSlotError>> => {
    try {
      const path = routePath(ServerRoutes.fixedSlotTemplates.getFixedSlotTemplate, { id });
      const response = await kyClient.get(path, { throwHttpErrors: false });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.fixedSlotTemplates.getFixedSlotTemplate.responses[200].content["application/json"].schema;
        return decodeFixedSlotResponse(response, okSchema as z.ZodType<FixedSlotTemplate>);
      }

      return err(await parseFixedSlotError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  create: async (
    payload: CreateFixedSlotTemplatePayload,
  ): Promise<Result<FixedSlotTemplate, FixedSlotError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.fixedSlotTemplates.createFixedSlotTemplate), {
        json: payload,
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.CREATED) {
        const okSchema = ServerRoutes.fixedSlotTemplates.createFixedSlotTemplate.responses[201].content["application/json"].schema;
        return decodeFixedSlotResponse(response, okSchema as z.ZodType<FixedSlotTemplate>);
      }

      return err(await parseFixedSlotError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  update: async (
    id: string,
    payload: UpdateFixedSlotTemplatePayload,
  ): Promise<Result<FixedSlotTemplate, FixedSlotError>> => {
    try {
      const path = routePath(ServerRoutes.fixedSlotTemplates.updateFixedSlotTemplate, { id });
      const response = await kyClient.patch(path, {
        json: payload,
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.fixedSlotTemplates.updateFixedSlotTemplate.responses[200].content["application/json"].schema;
        return decodeFixedSlotResponse(response, okSchema as z.ZodType<FixedSlotTemplate>);
      }

      return err(await parseFixedSlotError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  cancel: async (id: string): Promise<Result<FixedSlotTemplate, FixedSlotError>> => {
    try {
      const path = routePath(ServerRoutes.fixedSlotTemplates.cancelFixedSlotTemplate, { id });
      const response = await kyClient.post(path, { throwHttpErrors: false });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.fixedSlotTemplates.cancelFixedSlotTemplate.responses[200].content["application/json"].schema;
        return decodeFixedSlotResponse(response, okSchema as z.ZodType<FixedSlotTemplate>);
      }

      return err(await parseFixedSlotError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
};
