import { PricingPoliciesContracts } from "@mebike/shared";

export type PricingPoliciesRoutes = typeof import("@mebike/shared")["serverRoutes"]["pricingPolicies"];

export const {
  PricingPolicyErrorCodeSchema,
  pricingPolicyErrorMessages,
} = PricingPoliciesContracts;

export type PricingPolicy = PricingPoliciesContracts.PricingPolicy;
export type PricingPolicyDetail = PricingPoliciesContracts.PricingPolicyDetail;
export type PricingPolicyListResponse = PricingPoliciesContracts.PricingPolicyListResponse;
export type PricingPolicyErrorResponse = PricingPoliciesContracts.PricingPolicyErrorResponse;
