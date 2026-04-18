import type { Result } from "@lib/result";
import type { z } from "zod";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { toSearchParams } from "@services/shared/search-params";
import { StatusCodes } from "http-status-codes";

import type {
  CreateIncidentPayload,
  IncidentDetail,
  IncidentListResponse,
  IncidentSummary,
  TechnicianAssignmentSummary,
  UpdateIncidentPayload,
} from "@/contracts/server";

import type { IncidentError } from "./incident-error";

import { asNetworkError, parseIncidentError } from "./incident-error";

export type UploadIncidentImagePayload = {
  name?: string | null;
  type?: string | null;
  uri: string;
};

export type IncidentListParams = z.infer<
  typeof ServerRoutes.incidents.listIncidents.request.query
>;

async function decodeIncidentResponse<TValue>(
  response: Response,
  schema: z.ZodType<TValue>,
): Promise<Result<TValue, IncidentError>> {
  try {
    const data = await readJson(response);
    const parsed = decodeWithSchema(schema, data);
    return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
  }
  catch {
    return err({ _tag: "DecodeError" });
  }
}

export const incidentService = {
  uploadIncidentImages: async (
    payloads: ReadonlyArray<UploadIncidentImagePayload>,
  ): Promise<Result<{ fileUrls: string[] }, IncidentError>> => {
    try {
      const formData = new FormData();

      for (const payload of payloads) {
        formData.append("files", {
          uri: payload.uri,
          name: payload.name ?? "incident-image.jpg",
          type: payload.type ?? "image/jpeg",
        } as never);
      }

      const response = await kyClient.post(routePath(ServerRoutes.incidents.uploadIncidentImages), {
        body: formData,
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.incidents.uploadIncidentImages.responses[200].content["application/json"].schema;
        return decodeIncidentResponse(response, okSchema as z.ZodType<{ fileUrls: string[] }>);
      }

      return err(await parseIncidentError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  listIncidents: async (
    params: IncidentListParams = {},
  ): Promise<Result<IncidentListResponse, IncidentError>> => {
    try {
      const response = await kyClient.get(routePath(ServerRoutes.incidents.listIncidents), {
        searchParams: toSearchParams(params),
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.incidents.listIncidents.responses[200].content["application/json"].schema;
        return decodeIncidentResponse(response, okSchema as z.ZodType<IncidentListResponse>);
      }

      return err(await parseIncidentError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  getIncident: async (incidentId: string): Promise<Result<IncidentDetail, IncidentError>> => {
    try {
      const path = routePath(ServerRoutes.incidents.getIncident, { incidentId });
      const response = await kyClient.get(path, { throwHttpErrors: false });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.incidents.getIncident.responses[200].content["application/json"].schema;
        return decodeIncidentResponse(response, okSchema as z.ZodType<IncidentDetail>);
      }

      return err(await parseIncidentError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  createIncident: async (
    payload: CreateIncidentPayload,
  ): Promise<Result<IncidentSummary, IncidentError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.incidents.createIncident), {
        json: payload,
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.CREATED) {
        const okSchema = ServerRoutes.incidents.createIncident.responses[201].content["application/json"].schema;
        return decodeIncidentResponse(response, okSchema as z.ZodType<IncidentSummary>);
      }

      return err(await parseIncidentError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  updateIncident: async (
    incidentId: string,
    payload: UpdateIncidentPayload,
  ): Promise<Result<IncidentDetail, IncidentError>> => {
    try {
      const path = routePath(ServerRoutes.incidents.updateIncident, { incidentId });
      const response = await kyClient.put(path, {
        json: payload,
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.incidents.updateIncident.responses[200].content["application/json"].schema;
        return decodeIncidentResponse(response, okSchema as z.ZodType<IncidentDetail>);
      }

      return err(await parseIncidentError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  acceptIncident: async (
    incidentId: string,
  ): Promise<Result<TechnicianAssignmentSummary, IncidentError>> => {
    try {
      const path = routePath(ServerRoutes.incidents.acceptIncident, { incidentId });
      const response = await kyClient.patch(path, { throwHttpErrors: false });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.incidents.acceptIncident.responses[200].content["application/json"].schema;
        return decodeIncidentResponse(response, okSchema as z.ZodType<TechnicianAssignmentSummary>);
      }

      return err(await parseIncidentError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  rejectIncident: async (
    incidentId: string,
  ): Promise<Result<TechnicianAssignmentSummary, IncidentError>> => {
    try {
      const path = routePath(ServerRoutes.incidents.rejectIncident, { incidentId });
      const response = await kyClient.patch(path, { throwHttpErrors: false });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.incidents.rejectIncident.responses[200].content["application/json"].schema;
        return decodeIncidentResponse(response, okSchema as z.ZodType<TechnicianAssignmentSummary>);
      }

      return err(await parseIncidentError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  startIncident: async (
    incidentId: string,
  ): Promise<Result<IncidentDetail, IncidentError>> => {
    try {
      const path = routePath(ServerRoutes.incidents.startIncident, { incidentId });
      const response = await kyClient.patch(path, { throwHttpErrors: false });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.incidents.startIncident.responses[200].content["application/json"].schema;
        return decodeIncidentResponse(response, okSchema as z.ZodType<IncidentDetail>);
      }

      return err(await parseIncidentError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  resolveIncident: async (
    incidentId: string,
  ): Promise<Result<IncidentDetail, IncidentError>> => {
    try {
      const path = routePath(ServerRoutes.incidents.resolveIncident, { incidentId });
      const response = await kyClient.patch(path, { throwHttpErrors: false });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.incidents.resolveIncident.responses[200].content["application/json"].schema;
        return decodeIncidentResponse(response, okSchema as z.ZodType<IncidentDetail>);
      }

      return err(await parseIncidentError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
};
