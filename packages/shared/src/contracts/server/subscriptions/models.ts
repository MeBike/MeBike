import { z } from "../../../zod";

export const SubscriptionStatusSchema = z
  .enum(["PENDING", "ACTIVE", "EXPIRED", "CANCELLED"])
  .openapi("SubscriptionStatus");

export const SubscriptionPackageSchema = z
  .enum(["basic", "premium", "ultra"])
  .openapi("SubscriptionPackage");

export const SubscriptionPackageDetailSchema = z.object({
  packageName: SubscriptionPackageSchema,
  price: z.string().openapi({ example: "119000" }),
  maxUsages: z.number().int().nullable(),
  currency: z.literal("vnd").openapi({ example: "vnd" }),
}).openapi("SubscriptionPackageDetail");

export const SubscriptionDetailSchema = z.object({
  id: z.uuidv7(),
  userId: z.uuidv7(),
  packageName: SubscriptionPackageSchema,
  maxUsages: z.number().int().nullable(),
  usageCount: z.number().int(),
  status: SubscriptionStatusSchema,
  activatedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  price: z.string().openapi({ example: "119000" }),
  updatedAt: z.string().datetime(),
}).openapi("SubscriptionDetail");

export const SubscriptionOwnerSchema = z.object({
  id: z.uuidv7(),
  fullName: z.string(),
  email: z.string().email(),
}).openapi("SubscriptionOwner");

export const AdminSubscriptionDetailSchema = SubscriptionDetailSchema.extend({
  user: SubscriptionOwnerSchema,
}).openapi("AdminSubscriptionDetail");

export type SubscriptionDetail = z.infer<typeof SubscriptionDetailSchema>;
export type AdminSubscriptionDetail = z.infer<typeof AdminSubscriptionDetailSchema>;
