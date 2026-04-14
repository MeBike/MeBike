import { z } from "../../../zod";
import {
  paginationQueryFields,
  PaginationSchema,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../schemas";
import {
  FixedSlotDateStringSchema,
  FixedSlotTemplateSchema,
  FixedSlotTemplateStatusSchema,
  FixedSlotTimeStringSchema,
} from "./models";

export const FixedSlotTemplateErrorCodeSchema = z
  .enum([
    "FIXED_SLOT_TEMPLATE_NOT_FOUND",
    "FIXED_SLOT_STATION_NOT_FOUND",
    "FIXED_SLOT_DATE_NOT_FUTURE",
    "FIXED_SLOT_DATE_LOCKED",
    "FIXED_SLOT_DATE_NOT_FOUND",
    "FIXED_SLOT_TEMPLATE_CONFLICT",
    "FIXED_SLOT_WALLET_NOT_FOUND",
    "FIXED_SLOT_INSUFFICIENT_BALANCE",
    "FIXED_SLOT_BILLING_CONFLICT",
    "FIXED_SLOT_TEMPLATE_CANCEL_CONFLICT",
    "FIXED_SLOT_TEMPLATE_UPDATE_CONFLICT",
  ])
  .openapi("FixedSlotTemplateErrorCode");

export const fixedSlotTemplateErrorMessages = {
  FIXED_SLOT_TEMPLATE_NOT_FOUND: "Fixed-slot template not found",
  FIXED_SLOT_STATION_NOT_FOUND: "Station not found",
  FIXED_SLOT_DATE_NOT_FUTURE: "Fixed-slot dates must be in the future",
  FIXED_SLOT_DATE_LOCKED: "Fixed-slot date can no longer be changed",
  FIXED_SLOT_DATE_NOT_FOUND: "Fixed-slot date not found on template",
  FIXED_SLOT_TEMPLATE_CONFLICT: "An active fixed-slot template already exists for one or more selected dates at this time",
  FIXED_SLOT_WALLET_NOT_FOUND: "Wallet not found",
  FIXED_SLOT_INSUFFICIENT_BALANCE: "Insufficient balance for fixed-slot upfront payment",
  FIXED_SLOT_BILLING_CONFLICT: "Fixed-slot billing could not be completed safely",
  FIXED_SLOT_TEMPLATE_CANCEL_CONFLICT: "Fixed-slot template could not be cancelled safely",
  FIXED_SLOT_TEMPLATE_UPDATE_CONFLICT: "Fixed-slot template could not be updated safely",
} as const;

export const FixedSlotTemplateErrorResponseSchema = z.object({
  error: z.string(),
  details: z.object({
    code: FixedSlotTemplateErrorCodeSchema,
    stationId: z.uuidv7().optional(),
    slotDate: FixedSlotDateStringSchema.optional(),
    slotStart: FixedSlotTimeStringSchema.optional(),
    slotDates: z.array(FixedSlotDateStringSchema).optional(),
    requiredAmount: z.string().optional(),
    balance: z.string().optional(),
  }),
}).openapi("FixedSlotTemplateErrorResponse");

export const CreateFixedSlotTemplateRequestSchema = z.object({
  stationId: z.uuidv7(),
  slotStart: FixedSlotTimeStringSchema,
  slotDates: z.array(FixedSlotDateStringSchema)
    .min(1)
    .refine(values => new Set(values).size === values.length, {
      message: "slotDates must be unique",
    }),
}).openapi("CreateFixedSlotTemplateRequest");

export const CreateFixedSlotTemplateResponseSchema = FixedSlotTemplateSchema.openapi(
  "CreateFixedSlotTemplateResponse",
);

export const UpdateFixedSlotTemplateRequestSchema = z.object({
  slotStart: FixedSlotTimeStringSchema.optional(),
  slotDates: z.array(FixedSlotDateStringSchema)
    .refine(values => new Set(values).size === values.length, {
      message: "slotDates must be unique",
    })
    .optional(),
}).refine(
  value => value.slotStart !== undefined || value.slotDates !== undefined,
  {
    message: "slotStart or slotDates is required",
  },
).openapi("UpdateFixedSlotTemplateRequest");

export const UpdateFixedSlotTemplateResponseSchema = FixedSlotTemplateSchema.openapi(
  "UpdateFixedSlotTemplateResponse",
);

export const ListFixedSlotTemplatesQuerySchema = z.object({
  ...paginationQueryFields,
  status: FixedSlotTemplateStatusSchema.optional(),
  stationId: z.uuidv7().optional(),
}).openapi("ListFixedSlotTemplatesQuery");

export const ListFixedSlotTemplatesResponseSchema = z.object({
  data: FixedSlotTemplateSchema.array(),
  pagination: PaginationSchema,
}).openapi("ListFixedSlotTemplatesResponse");

export type FixedSlotTemplateErrorResponse = z.infer<typeof FixedSlotTemplateErrorResponseSchema>;
export type CreateFixedSlotTemplateRequest = z.infer<typeof CreateFixedSlotTemplateRequestSchema>;
export type CreateFixedSlotTemplateResponse = z.infer<typeof CreateFixedSlotTemplateResponseSchema>;
export type UpdateFixedSlotTemplateRequest = z.infer<typeof UpdateFixedSlotTemplateRequestSchema>;
export type UpdateFixedSlotTemplateResponse = z.infer<typeof UpdateFixedSlotTemplateResponseSchema>;
export type ListFixedSlotTemplatesResponse = z.infer<typeof ListFixedSlotTemplatesResponseSchema>;

export {
  FixedSlotDateStringSchema,
  FixedSlotTemplateSchema,
  FixedSlotTemplateStatusSchema,
  FixedSlotTimeStringSchema,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
};
