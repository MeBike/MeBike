export const couponRuleQueryKeys = {
  all: () => ["coupon-rules"] as const,
  active: () => ["coupon-rules", "active"] as const,
};
