import { pricingPoliciesMutations } from "./mutations";
import { pricingPoliciesQueries } from "./queries";

export * from "./mutations";
export * from "./queries";
export * from "./shared";

export const pricingPoliciesRoutes = {
  ...pricingPoliciesQueries,
  ...pricingPoliciesMutations,
} as const;
