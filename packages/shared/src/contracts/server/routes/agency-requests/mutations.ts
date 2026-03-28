import { createRoute, z } from "@hono/zod-openapi";

import {
  OptionalPhoneNumberNullableSchema,
  OptionalTrimmedNullableStringSchema,
  ServerErrorResponseSchema,
} from "../../schemas";
import { AgencyRequestSchema } from "../../agency-requests/models";

const SubmitAgencyRequestRequestSchema = z.object({
  requesterEmail: z.string().email(),
  requesterPhone: OptionalPhoneNumberNullableSchema,
  agencyName: z.string().min(1),
  agencyAddress: OptionalTrimmedNullableStringSchema,
  agencyContactPhone: OptionalPhoneNumberNullableSchema,
  description: OptionalTrimmedNullableStringSchema,
}).openapi("SubmitAgencyRequestRequest");

const SubmitAgencyRequestResponseSchema = AgencyRequestSchema.openapi("SubmitAgencyRequestResponse");

export const submitAgencyRequestRoute = createRoute({
  method: "post",
  path: "/v1/agency-requests",
  tags: ["Agency Requests"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: SubmitAgencyRequestRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Agency request submitted",
      content: {
        "application/json": {
          schema: SubmitAgencyRequestResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid request payload",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
        },
      },
    },
  },
});

export type SubmitAgencyRequestRequest = z.infer<typeof SubmitAgencyRequestRequestSchema>;
export type SubmitAgencyRequestResponse = z.infer<typeof SubmitAgencyRequestResponseSchema>;
