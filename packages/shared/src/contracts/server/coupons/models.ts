import { z } from "../../../zod";
import {
  paginationQueryFields,
  PaginationSchema,
} from "../schemas";
import { AccountStatusSchema } from "../users/schemas";

export const CouponDiscountTypeSchema = z
  .enum(["PERCENTAGE", "FIXED_AMOUNT"])
  .openapi("CouponDiscountType");

export const CouponTriggerTypeSchema = z
  .enum([
    "RIDING_DURATION",
    "USAGE_FREQUENCY",
    "CAMPAIGN",
    "MEMBERSHIP_MILESTONE",
    "MANUAL_GRANT",
  ])
  .openapi("CouponTriggerType");

export const ActiveCouponRuleSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  triggerType: CouponTriggerTypeSchema,
  minRidingMinutes: z.number().int().nonnegative(),
  minBillableHours: z.number().nonnegative(),
  discountType: CouponDiscountTypeSchema,
  discountValue: z.number().nonnegative(),
  status: AccountStatusSchema,
  priority: z.number().int(),
  activeFrom: z.iso.datetime().nullable(),
  activeTo: z.iso.datetime().nullable(),
  displayLabel: z.string(),
}).openapi("ActiveCouponRule");

export const ActiveCouponRulesResponseSchema = z.object({
  data: z.array(ActiveCouponRuleSchema),
}).openapi("ActiveCouponRulesResponse");

export const AdminCouponRuleSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  triggerType: CouponTriggerTypeSchema,
  minRidingMinutes: z.number().int().nonnegative().nullable(),
  minBillableHours: z.number().nonnegative().nullable(),
  discountType: CouponDiscountTypeSchema,
  discountValue: z.number().nonnegative(),
  status: AccountStatusSchema,
  priority: z.number().int(),
  activeFrom: z.iso.datetime().nullable(),
  activeTo: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}).openapi("AdminCouponRule", {
  example: {
    id: "018fa100-0000-7000-8000-000000000010",
    name: "Ride 2h discount",
    triggerType: "RIDING_DURATION",
    minRidingMinutes: 120,
    minBillableHours: 2,
    discountType: "FIXED_AMOUNT",
    discountValue: 2000,
    status: "ACTIVE",
    priority: 100,
    activeFrom: null,
    activeTo: null,
    createdAt: "2026-04-17T00:00:00.000Z",
    updatedAt: "2026-04-17T00:00:00.000Z",
  },
});

export const AdminCouponRulesListQuerySchema = z.object({
  ...paginationQueryFields,
  status: AccountStatusSchema.optional(),
  triggerType: CouponTriggerTypeSchema.optional(),
  discountType: CouponDiscountTypeSchema.optional(),
}).openapi("AdminCouponRulesListQuery");

export const AdminCouponRulesListResponseSchema = z.object({
  data: z.array(AdminCouponRuleSchema),
  pagination: PaginationSchema,
}).openapi("AdminCouponRulesListResponse", {
  example: {
    data: [
      {
        id: "018fa100-0000-7000-8000-000000000010",
        name: "Ride 2h discount",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 120,
        minBillableHours: 2,
        discountType: "FIXED_AMOUNT",
        discountValue: 2000,
        status: "ACTIVE",
        priority: 100,
        activeFrom: null,
        activeTo: null,
        createdAt: "2026-04-17T00:00:00.000Z",
        updatedAt: "2026-04-17T00:00:00.000Z",
      },
    ],
    pagination: {
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    },
  },
});

export type CouponDiscountType = z.infer<typeof CouponDiscountTypeSchema>;
export type CouponTriggerType = z.infer<typeof CouponTriggerTypeSchema>;
export type ActiveCouponRule = z.infer<typeof ActiveCouponRuleSchema>;
export type ActiveCouponRulesResponse = z.infer<
  typeof ActiveCouponRulesResponseSchema
>;
export type AdminCouponRule = z.infer<typeof AdminCouponRuleSchema>;
export type AdminCouponRulesListQuery = z.infer<
  typeof AdminCouponRulesListQuerySchema
>;
export type AdminCouponRulesListResponse = z.infer<
  typeof AdminCouponRulesListResponseSchema
>;
