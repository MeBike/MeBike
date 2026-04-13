import { z } from "../../../zod";
import { BikeStatusSchema } from "../bikes";
import { UserRoleSchema, VerifyStatusSchema } from "../users";
import { PaginationSchema } from "../schemas";

export const RedistributionStatusSchema = z.enum([
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "IN_TRANSIT",
  "PARTIALLY_COMPLETED",
  "COMPLETED",
  "CANCELLED",
]);

export const RedistributionRequestItemSchema = z.object({
  id: z.uuidv7(),
  redistributionRequestId: z.uuidv7(),
  bikeId: z.uuidv7(),
  deliveredAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
});

export const RedistributionRequestSchema = z.object({
  id: z.uuidv7(),
  requestedByUserId: z.uuidv7(),
  approvedByUserId: z.uuidv7().optional(),
  sourceStationId: z.uuidv7(),
  targetStationId: z.uuidv7(),
  requestedQuantity: z.number(),
  reason: z.string().optional(),
  items: z.array(RedistributionRequestItemSchema),
  status: RedistributionStatusSchema,
  startedAt: z.iso.datetime().nullable(),
  completedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedat: z.iso.datetime(),
});

// User info for redistribution
export const RedistributionUserSummarySchema = z.object({
  id: z.uuidv7(),
  fullName: z.string(),
});

export const RedistributionUserDetailSchema = z.object({
  id: z.uuidv7(),
  fullName: z.string(),
  email: z.string(),
  verify: VerifyStatusSchema,
  location: z.string(),
  username: z.string(),
  phoneNumber: z.string(),
  avatar: z.string(),
  role: UserRoleSchema,
  nfcCardUid: z.string().optional(),
  updatedAt: z.iso.datetime(),
});

// Station info for redistribution
export const RedistributionStationSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  totalCapacity: z.number(),
  updatedAt: z.iso.datetime(),
  locationGeo: z
    .object({
      type: z.literal("Point"),
      coordinates: z.tuple([z.number(), z.number()]),
    })
    .optional(),
});

export const RedistributionStationSummarySchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
});

// Bike info for redistribution
export const RedistributionBikeSchema = z.object({
  id: z.uuidv7(),
  chipId: z.string(),
  status: BikeStatusSchema,
  supplierId: z.uuidv7().optional(),
  updatedAt: z.iso.datetime(),
});

// Detail redistribution request with populated data
export const RedistributionRequestItemDetailSchema = z.object({
  id: z.uuidv7(),
  redistributionRequestId: z.uuidv7(),
  bike: RedistributionBikeSchema,
  deliveredAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
});

export const RedistributionRequestDetailBaseSchema = z.object({
  id: z.uuidv7(),
  reason: z.string().nullable(),
  requestedQuantity: z.number(),
  status: RedistributionStatusSchema,
  startedAt: z.iso.datetime().nullable(),
  completedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedat: z.iso.datetime(),
});

export const RedistributionRequestDetailSchema =
  RedistributionRequestDetailBaseSchema.extend({
    requestedByUser: RedistributionUserDetailSchema,
    approvedByUser: RedistributionUserDetailSchema.nullable(),
    sourceStation: RedistributionStationSchema,
    targetStation: RedistributionStationSchema,
    items: z.array(RedistributionRequestItemDetailSchema),
  });

// Redistribution list item (for paginated lists)
export const RedistributionRequestListItemSchema =
  RedistributionRequestDetailBaseSchema.extend({
    requestedByUser: RedistributionUserSummarySchema,
    approvedByUser: RedistributionUserSummarySchema.nullable(),
    sourceStation: RedistributionStationSummarySchema,
    targetStation: RedistributionStationSummarySchema,
    items: z.array(RedistributionRequestItemSchema),
  });

// Redistribution list response
export const RedistributionRequestListResponseSchema = z.object({
  data: z.array(RedistributionRequestListItemSchema),
  pagination: PaginationSchema,
});

export const CreateRedistributionRequestSchema = z
  .object({
    sourceStationId: z.uuidv7(),
    targetStationId: z.uuidv7(),
    requestedQuantity: z.number().int().positive().max(20),
    reason: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.targetStationId === data.sourceStationId) {
      ctx.addIssue({
        code: "custom",
        message: "Target station cannot be the same as source station",
        path: ["targetStationId"],
      });
    }
  });

export const CancelRedistributionRequestSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters long")
    .max(200, "Reason must be at most 200 characters long"),
});

export const RejectRedistributionRequestSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters long")
    .max(200, "Reason must be at most 200 characters long"),
});

export const ConfirmRedistributionRequestCompletionSchema = z.object({
  completedBikeIds: z
    .array(z.uuidv7())
    .min(1, "At least one bike must be completed"),
});

export type RedistributionRequest = z.infer<typeof RedistributionRequestSchema>;
export type RedistributionRequestDetail = z.infer<
  typeof RedistributionRequestDetailSchema
>;
export type RedistributionRequestList = z.infer<
  typeof RedistributionRequestListResponseSchema
>;
export type RedistributionRequestListItem = z.infer<
  typeof RedistributionRequestListItemSchema
>;

export type CreateRedistributionRequest = z.infer<
  typeof CreateRedistributionRequestSchema
>;

export type ConfirmRedistributionRequestCompletion = z.infer<
  typeof ConfirmRedistributionRequestCompletionSchema
>;
