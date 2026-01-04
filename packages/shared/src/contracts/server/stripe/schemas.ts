import { z } from "../../../zod";

export const StripeConnectOnboardingRequestSchema = z.object({
  returnUrl: z.string().url(),
  refreshUrl: z.string().url(),
}).openapi("StripeConnectOnboardingRequest");

export const StripeConnectOnboardingResponseSchema = z.object({
  data: z.object({
    accountId: z.string().min(1),
    onboardingUrl: z.string().url(),
  }),
}).openapi("StripeConnectOnboardingResponse");

export type StripeConnectOnboardingRequest = z.infer<typeof StripeConnectOnboardingRequestSchema>;
export type StripeConnectOnboardingResponse = z.infer<typeof StripeConnectOnboardingResponseSchema>;
