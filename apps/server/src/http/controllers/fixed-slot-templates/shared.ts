import {
  FixedSlotTemplatesContracts,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
} from "@mebike/shared";

export type FixedSlotTemplatesRoutes = typeof import("@mebike/shared")["serverRoutes"]["fixedSlotTemplates"];

export const {
  FixedSlotTemplateErrorCodeSchema,
  fixedSlotTemplateErrorMessages,
} = FixedSlotTemplatesContracts;

export type CreateFixedSlotTemplateResponse = FixedSlotTemplatesContracts.CreateFixedSlotTemplateResponse;
export type FixedSlotTemplateErrorResponse = FixedSlotTemplatesContracts.FixedSlotTemplateErrorResponse;
export type FixedSlotTemplateResponse = FixedSlotTemplatesContracts.FixedSlotTemplate;
export type ListFixedSlotTemplatesResponse = FixedSlotTemplatesContracts.ListFixedSlotTemplatesResponse;
export type UpdateFixedSlotTemplateResponse = FixedSlotTemplatesContracts.UpdateFixedSlotTemplateResponse;

/** Body lỗi unauthorized dùng chung cho các route fixed-slot template. */
export const unauthorizedBody = {
  error: unauthorizedErrorMessages.UNAUTHORIZED,
  details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
} as const;
