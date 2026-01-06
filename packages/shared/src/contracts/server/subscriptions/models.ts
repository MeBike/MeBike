import { z } from "../../../zod";

export const SubscriptionStatusSchema = z
  .enum(["PENDING", "ACTIVE", "EXPIRED", "CANCELLED"])
  .openapi("SubscriptionStatus");

export const SubscriptionPackageSchema = z
  .enum(["basic", "premium", "unlimited"])
  .openapi("SubscriptionPackage");

export const SubscriptionPackageDetailSchema = z.object({
  packageName: SubscriptionPackageSchema,
  price: z.string().openapi({ example: "1190" }),
  maxUsages: z.number().int().nullable(),
  currency: z.literal("usd").openapi({ example: "usd" }),
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
  price: z.string().openapi({ example: "1190" }),
  updatedAt: z.string().datetime(),
}).openapi("SubscriptionDetail");

export type SubscriptionDetail = z.infer<typeof SubscriptionDetailSchema>;
