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

export const CouponRuleIdParamSchema = z.object({
  ruleId: z.uuidv7().openapi({
    description: "Coupon rule identifier",
    example: "019b17bd-d130-7e7d-be69-91ceef7b7202",
  }),
}).openapi("CouponRuleIdParam", {
  description: "Path params for coupon rule id",
});

export const AdminCouponRuleWritableStatusSchema = z
  .enum(["ACTIVE", "INACTIVE"])
  .openapi("AdminCouponRuleWritableStatus");

export const CreateAdminCouponRuleBodySchema = z
  .object({
    name: z.string().trim().min(1),
    triggerType: z.literal("RIDING_DURATION").openapi({
      example: "RIDING_DURATION",
    }),
    minRidingMinutes: z.number().int().positive(),
    discountType: z.literal("FIXED_AMOUNT").openapi({
      example: "FIXED_AMOUNT",
    }),
    discountValue: z.number().int().positive(),
    priority: z.number().int().optional().default(100),
    status: AdminCouponRuleWritableStatusSchema.optional().default("INACTIVE"),
    activeFrom: z.iso.datetime().nullable().optional().default(null),
    activeTo: z.iso.datetime().nullable().optional().default(null),
  })
  .superRefine((value, ctx) => {
    if (
      value.activeFrom
      && value.activeTo
      && new Date(value.activeFrom).getTime() > new Date(value.activeTo).getTime()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["activeFrom"],
        message: "activeFrom must be less than or equal to activeTo",
      });
    }
  })
  .openapi("CreateAdminCouponRuleBody", {
    example: {
      name: "Ride 2h discount",
      triggerType: "RIDING_DURATION",
      minRidingMinutes: 120,
      discountType: "FIXED_AMOUNT",
      discountValue: 2000,
      priority: 100,
      status: "INACTIVE",
      activeFrom: null,
      activeTo: null,
    },
  });

export const UpdateAdminCouponRuleBodySchema = z
  .object({
    name: z.string().trim().min(1),
    triggerType: z.literal("RIDING_DURATION").openapi({
      example: "RIDING_DURATION",
    }),
    minRidingMinutes: z.number().int().positive(),
    discountType: z.literal("FIXED_AMOUNT").openapi({
      example: "FIXED_AMOUNT",
    }),
    discountValue: z.number().int().positive(),
    priority: z.number().int(),
    status: AdminCouponRuleWritableStatusSchema,
    activeFrom: z.iso.datetime().nullable(),
    activeTo: z.iso.datetime().nullable(),
  })
  .superRefine((value, ctx) => {
    if (
      value.activeFrom
      && value.activeTo
      && new Date(value.activeFrom).getTime() > new Date(value.activeTo).getTime()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["activeFrom"],
        message: "activeFrom must be less than or equal to activeTo",
      });
    }
  })
  .openapi("UpdateAdminCouponRuleBody", {
    example: {
      name: "Ride 2h discount updated",
      triggerType: "RIDING_DURATION",
      minRidingMinutes: 120,
      discountType: "FIXED_AMOUNT",
      discountValue: 2500,
      priority: 90,
      status: "INACTIVE",
      activeFrom: null,
      activeTo: null,
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

export const CouponRuleErrorCodeSchema = z.enum([
  "COUPON_RULE_NOT_FOUND",
]).openapi("CouponRuleErrorCode");

export const CouponRuleErrorDetailSchema = z.object({
  code: CouponRuleErrorCodeSchema,
  ruleId: z.uuidv7().optional(),
}).openapi("CouponRuleErrorDetail");

export const CouponRuleErrorResponseSchema = z.object({
  error: z.string(),
  details: CouponRuleErrorDetailSchema,
}).openapi("CouponRuleErrorResponse");

export const couponRuleErrorMessages = {
  COUPON_RULE_NOT_FOUND: "Coupon rule not found",
} as const;

export type CouponDiscountType = z.infer<typeof CouponDiscountTypeSchema>;
export type CouponTriggerType = z.infer<typeof CouponTriggerTypeSchema>;
export type ActiveCouponRule = z.infer<typeof ActiveCouponRuleSchema>;
export type ActiveCouponRulesResponse = z.infer<
  typeof ActiveCouponRulesResponseSchema
>;
export type AdminCouponRuleWritableStatus = z.infer<
  typeof AdminCouponRuleWritableStatusSchema
>;
export type AdminCouponRule = z.infer<typeof AdminCouponRuleSchema>;
export type CreateAdminCouponRuleBody = z.infer<
  typeof CreateAdminCouponRuleBodySchema
>;
export type UpdateAdminCouponRuleBody = z.infer<
  typeof UpdateAdminCouponRuleBodySchema
>;
export type AdminCouponRulesListQuery = z.infer<
  typeof AdminCouponRulesListQuerySchema
>;
export type AdminCouponRulesListResponse = z.infer<
  typeof AdminCouponRulesListResponseSchema
>;
export type CouponRuleErrorResponse = z.infer<
  typeof CouponRuleErrorResponseSchema
>;
