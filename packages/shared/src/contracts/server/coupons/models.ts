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

const GLOBAL_AUTO_DISCOUNT_TIERS = [
  { minRidingMinutes: 60, discountValue: 1000 },
  { minRidingMinutes: 120, discountValue: 2000 },
  { minRidingMinutes: 240, discountValue: 4000 },
  { minRidingMinutes: 360, discountValue: 6000 },
] as const;

function isAllowedGlobalAutoDiscountTier(value: {
  readonly minRidingMinutes: number;
  readonly discountValue: number;
}) {
  return GLOBAL_AUTO_DISCOUNT_TIERS.some(tier =>
    tier.minRidingMinutes === value.minRidingMinutes
    && tier.discountValue === value.discountValue,
  );
}

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
    if (!isAllowedGlobalAutoDiscountTier(value)) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message:
          "discountValue must match one of the fixed coupon tiers: 60->1000, 120->2000, 240->4000, 360->6000",
      });
    }

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
    if (!isAllowedGlobalAutoDiscountTier(value)) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message:
          "discountValue must match one of the fixed coupon tiers: 60->1000, 120->2000, 240->4000, 360->6000",
      });
    }

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
      discountValue: 2000,
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

const CouponStatsBoundSchema = z
  .union([
    z.iso.datetime(),
    z.iso.date(),
  ])
  .openapi({
    description:
      "ISO datetime or date. Date-only values are normalized to UTC day bounds on the server.",
    example: "2026-04-01T00:00:00.000Z",
  });

export const AdminCouponStatsQuerySchema = z
  .object({
    from: CouponStatsBoundSchema.optional(),
    to: CouponStatsBoundSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.from && !value.to) || (!value.from && value.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [value.from ? "to" : "from"],
        message: "from and to must be provided together",
      });
    }

    if (value.from && value.to && new Date(value.from) > new Date(value.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["from"],
        message: "from must not be after to",
      });
    }
  })
  .openapi("AdminCouponStatsQuery", {
    description:
      "Optional completed-rental end time range. Provide both from and to, or omit both for all-time statistics.",
    example: {
      from: "2026-04-01T00:00:00.000Z",
      to: "2026-04-30T23:59:59.999Z",
    },
  });

const optionalPositiveIntegerQuery = (field: string) =>
  z.preprocess(
    value =>
      value === undefined || value === null
        ? undefined
        : typeof value === "string"
          ? Number(value)
          : value,
    z.number().int().positive({
      message: `${field} must be a positive integer`,
    }).optional(),
  );

const optionalBooleanQuery = (field: string) =>
  z.preprocess(
    (value) => {
      if (value === undefined || value === null) {
        return undefined;
      }

      if (typeof value === "boolean") {
        return value;
      }

      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true") {
          return true;
        }
        if (normalized === "false") {
          return false;
        }
      }

      return value;
    },
    z.boolean({
      message: `${field} must be true or false`,
    }).optional(),
  );

export const CouponUsageDerivedTierSchema = z
  .enum([
    "TIER_1H_2H",
    "TIER_2H_4H",
    "TIER_4H_6H",
    "TIER_6H_PLUS",
  ])
  .openapi("CouponUsageDerivedTier");

export const CouponUsageLogRentalStatusSchema = z
  .enum(["RENTED", "COMPLETED", "CANCELLED"])
  .openapi("CouponUsageLogRentalStatus");

export const AdminCouponUsageLogsQuerySchema = z
  .object({
    ...paginationQueryFields,
    from: CouponStatsBoundSchema.optional(),
    to: CouponStatsBoundSchema.optional(),
    userId: z.uuidv7().optional(),
    rentalId: z.uuidv7().optional(),
    discountAmount: optionalPositiveIntegerQuery("discountAmount").openapi({
      description: "Exact coupon discount amount in VND recorded in finalized billing",
      example: 2000,
    }),
    subscriptionApplied: optionalBooleanQuery("subscriptionApplied").openapi({
      description:
        "Filter by whether the finalized rental has a subscription_id. Useful for anomaly auditing because global auto discount should normally have false here.",
      example: false,
    }),
  })
  .superRefine((value, ctx) => {
    if (value.from && value.to && new Date(value.from) > new Date(value.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["from"],
        message: "from must not be after to",
      });
    }
  })
  .openapi("AdminCouponUsageLogsQuery", {
    description:
      "Optional pagination and filters for finalized global auto discount usage logs. from/to are applied against billing record creation time (appliedAt).",
    example: {
      page: 1,
      pageSize: 20,
      from: "2026-04-01T00:00:00.000Z",
      to: "2026-04-30T23:59:59.999Z",
      userId: "018fa100-0000-7000-8000-000000000111",
      discountAmount: 2000,
      subscriptionApplied: false,
    },
  });

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

export const CouponStatsRangeSchema = z.object({
  from: z.iso.datetime().nullable(),
  to: z.iso.datetime().nullable(),
}).openapi("CouponStatsRange", {
  example: {
    from: "2026-04-01T00:00:00.000Z",
    to: "2026-04-30T23:59:59.999Z",
  },
});

export const CouponStatsSummarySchema = z.object({
  totalCompletedRentals: z.number().int().nonnegative(),
  discountedRentalsCount: z.number().int().nonnegative(),
  nonDiscountedRentalsCount: z.number().int().nonnegative(),
  discountRate: z.number().nonnegative(),
  totalDiscountAmount: z.number().nonnegative(),
  avgDiscountAmount: z.number().nonnegative(),
}).openapi("CouponStatsSummary");

export const CouponStatsByDiscountAmountSchema = z.object({
  discountAmount: z.number().nonnegative(),
  rentalsCount: z.number().int().nonnegative(),
  totalDiscountAmount: z.number().nonnegative(),
}).openapi("CouponStatsByDiscountAmount");

export const CouponStatsByRuleSchema = z.object({
  ruleId: z.uuidv7(),
  name: z.string(),
  triggerType: CouponTriggerTypeSchema,
  minRidingMinutes: z.number().int().nonnegative().nullable(),
  minBillableHours: z.number().nonnegative().nullable(),
  discountType: CouponDiscountTypeSchema,
  discountValue: z.number().nonnegative(),
  appliedCount: z.number().int().nonnegative(),
  totalDiscountAmount: z.number().nonnegative(),
  source: z.enum(["BILLING_RECORD_RULE", "BILLING_RECORD_SNAPSHOT"]),
}).openapi("CouponStatsByRule");

export const CouponTopAppliedRuleSchema = z.object({
  ruleId: z.uuidv7(),
  name: z.string(),
  triggerType: CouponTriggerTypeSchema,
  minRidingMinutes: z.number().int().nonnegative().nullable(),
  minBillableHours: z.number().nonnegative().nullable(),
  discountType: CouponDiscountTypeSchema,
  discountValue: z.number().nonnegative(),
  appliedCount: z.number().int().nonnegative(),
  inferredFrom: z.enum(["BILLING_RECORD_RULE", "BILLING_RECORD_SNAPSHOT"]),
}).openapi("CouponTopAppliedRule");

export const AdminCouponStatsResponseSchema = z.object({
  range: CouponStatsRangeSchema,
  summary: CouponStatsSummarySchema,
  statsByRule: z.array(CouponStatsByRuleSchema),
  statsByDiscountAmount: z.array(CouponStatsByDiscountAmountSchema),
  topAppliedRule: CouponTopAppliedRuleSchema.nullable(),
}).openapi("AdminCouponStatsResponse", {
  example: {
    range: {
      from: "2026-04-01T00:00:00.000Z",
      to: "2026-04-30T23:59:59.999Z",
    },
    summary: {
      totalCompletedRentals: 120,
      discountedRentalsCount: 52,
      nonDiscountedRentalsCount: 68,
      discountRate: 0.4333,
      totalDiscountAmount: 138000,
      avgDiscountAmount: 2653.85,
    },
    statsByDiscountAmount: [
      {
        discountAmount: 1000,
        rentalsCount: 10,
        totalDiscountAmount: 10000,
      },
      {
        discountAmount: 2000,
        rentalsCount: 20,
        totalDiscountAmount: 40000,
      },
      {
        discountAmount: 4000,
        rentalsCount: 15,
        totalDiscountAmount: 60000,
      },
      {
        discountAmount: 6000,
        rentalsCount: 7,
        totalDiscountAmount: 42000,
      },
    ],
    statsByRule: [
      {
        ruleId: "018fa100-0000-7000-8000-000000000010",
        name: "Ride 2h discount",
        triggerType: "RIDING_DURATION",
        minRidingMinutes: 120,
        minBillableHours: 2,
        discountType: "FIXED_AMOUNT",
        discountValue: 2000,
        appliedCount: 20,
        totalDiscountAmount: 40000,
        source: "BILLING_RECORD_SNAPSHOT",
      },
    ],
    topAppliedRule: {
      ruleId: "018fa100-0000-7000-8000-000000000010",
      name: "Ride 2h discount",
      triggerType: "RIDING_DURATION",
      minRidingMinutes: 120,
      minBillableHours: 2,
      discountType: "FIXED_AMOUNT",
      discountValue: 2000,
      appliedCount: 20,
      inferredFrom: "BILLING_RECORD_SNAPSHOT",
    },
  },
});

export const AdminCouponUsageLogSchema = z.object({
  rentalId: z.uuidv7(),
  userId: z.uuidv7(),
  pricingPolicyId: z.uuidv7(),
  rentalStatus: CouponUsageLogRentalStatusSchema,
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime().nullable(),
  totalDurationMinutes: z.number().int().positive(),
  baseAmount: z.number().nonnegative(),
  prepaidAmount: z.number().nonnegative(),
  subscriptionApplied: z.boolean(),
  subscriptionDiscountAmount: z.number().nonnegative(),
  couponRuleId: z.uuidv7().nullable(),
  couponRuleName: z.string().nullable(),
  couponRuleMinRidingMinutes: z.number().int().nonnegative().nullable(),
  couponRuleDiscountType: CouponDiscountTypeSchema.nullable(),
  couponRuleDiscountValue: z.number().nonnegative().nullable(),
  couponDiscountAmount: z.number().positive(),
  totalAmount: z.number().nonnegative(),
  appliedAt: z.iso.datetime(),
  derivedTier: CouponUsageDerivedTierSchema.nullable(),
}).openapi("AdminCouponUsageLog", {
  example: {
    rentalId: "018fa100-0000-7000-8000-000000000201",
    userId: "018fa100-0000-7000-8000-000000000202",
    pricingPolicyId: "018fa100-0000-7000-8000-000000000203",
    rentalStatus: "COMPLETED",
    startTime: "2026-04-17T08:00:00.000Z",
    endTime: "2026-04-17T09:35:00.000Z",
    totalDurationMinutes: 95,
    baseAmount: 8000,
    prepaidAmount: 0,
    subscriptionApplied: false,
    subscriptionDiscountAmount: 0,
    couponRuleId: "018fa100-0000-7000-8000-000000000010",
    couponRuleName: "Ride 2h discount",
    couponRuleMinRidingMinutes: 120,
    couponRuleDiscountType: "FIXED_AMOUNT",
    couponRuleDiscountValue: 2000,
    couponDiscountAmount: 2000,
    totalAmount: 6000,
    appliedAt: "2026-04-17T09:35:10.000Z",
    derivedTier: "TIER_2H_4H",
  },
});

export const AdminCouponUsageLogsResponseSchema = z.object({
  data: z.array(AdminCouponUsageLogSchema),
  pagination: PaginationSchema,
}).openapi("AdminCouponUsageLogsResponse", {
  example: {
    data: [
      {
        rentalId: "018fa100-0000-7000-8000-000000000201",
        userId: "018fa100-0000-7000-8000-000000000202",
        pricingPolicyId: "018fa100-0000-7000-8000-000000000203",
        rentalStatus: "COMPLETED",
        startTime: "2026-04-17T08:00:00.000Z",
        endTime: "2026-04-17T09:35:00.000Z",
        totalDurationMinutes: 95,
        baseAmount: 8000,
        prepaidAmount: 0,
        subscriptionApplied: false,
        subscriptionDiscountAmount: 0,
        couponRuleId: "018fa100-0000-7000-8000-000000000010",
        couponRuleName: "Ride 2h discount",
        couponRuleMinRidingMinutes: 120,
        couponRuleDiscountType: "FIXED_AMOUNT",
        couponRuleDiscountValue: 2000,
        couponDiscountAmount: 2000,
        totalAmount: 6000,
        appliedAt: "2026-04-17T09:35:10.000Z",
        derivedTier: "TIER_2H_4H",
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
  "COUPON_RULE_INVALID_TIER",
  "COUPON_RULE_INVALID_ACTIVE_WINDOW",
  "COUPON_RULE_ACTIVE_TIER_CONFLICT",
  "COUPON_RULE_ALREADY_USED",
]).openapi("CouponRuleErrorCode");

export const CouponRuleErrorDetailSchema = z.object({
  code: CouponRuleErrorCodeSchema,
  ruleId: z.uuidv7().optional(),
  conflictingRuleId: z.uuidv7().optional(),
  minRidingMinutes: z.number().int().nonnegative().optional(),
  discountValue: z.number().int().positive().optional(),
  activeFrom: z.iso.datetime().optional(),
  activeTo: z.iso.datetime().optional(),
}).openapi("CouponRuleErrorDetail");

export const CouponRuleErrorResponseSchema = z.object({
  error: z.string(),
  details: CouponRuleErrorDetailSchema,
}).openapi("CouponRuleErrorResponse");

export const couponRuleErrorMessages = {
  COUPON_RULE_NOT_FOUND: "Coupon rule not found",
  COUPON_RULE_INVALID_TIER: "Coupon rule tier is not allowed",
  COUPON_RULE_INVALID_ACTIVE_WINDOW: "Coupon rule active window is invalid",
  COUPON_RULE_ACTIVE_TIER_CONFLICT:
    "An active coupon rule already exists for this riding duration tier",
  COUPON_RULE_ALREADY_USED: "Coupon rule has already been used",
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
export type AdminCouponStatsQuery = z.infer<typeof AdminCouponStatsQuerySchema>;
export type CouponStatsRange = z.infer<typeof CouponStatsRangeSchema>;
export type CouponStatsSummary = z.infer<typeof CouponStatsSummarySchema>;
export type CouponStatsByDiscountAmount = z.infer<
  typeof CouponStatsByDiscountAmountSchema
>;
export type CouponStatsByRule = z.infer<typeof CouponStatsByRuleSchema>;
export type CouponTopAppliedRule = z.infer<typeof CouponTopAppliedRuleSchema>;
export type AdminCouponStatsResponse = z.infer<
  typeof AdminCouponStatsResponseSchema
>;
export type CouponUsageDerivedTier = z.infer<
  typeof CouponUsageDerivedTierSchema
>;
export type AdminCouponUsageLogsQuery = z.infer<
  typeof AdminCouponUsageLogsQuerySchema
>;
export type AdminCouponUsageLog = z.infer<
  typeof AdminCouponUsageLogSchema
>;
export type AdminCouponUsageLogsResponse = z.infer<
  typeof AdminCouponUsageLogsResponseSchema
>;
export type CouponRuleErrorResponse = z.infer<
  typeof CouponRuleErrorResponseSchema
>;
