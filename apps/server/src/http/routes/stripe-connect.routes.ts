import type { StripeContracts } from "@mebike/shared";

import {
  serverRoutes,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  WalletsContracts,
} from "@mebike/shared";
import { Effect, Match } from "effect";

import { withLoggedCause } from "@/domain/shared";
import { startStripeConnectOnboardingUseCase } from "@/domain/wallets/withdrawals";
import { withWithdrawalDeps } from "@/http/shared/providers";

export function registerStripeConnectRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const stripeRoutes = serverRoutes.stripe;
  const { walletErrorMessages, WalletErrorCodeSchema } = WalletsContracts;

  app.openapi(stripeRoutes.startStripeConnectOnboarding, async (c) => {
    const userId = c.var.currentUser?.userId ?? null;
    if (!userId) {
      return c.json({
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      }, 401);
    }

    const body = c.req.valid("json");

    const eff = withLoggedCause(
      withWithdrawalDeps(
        startStripeConnectOnboardingUseCase({
          userId,
          returnUrl: body.returnUrl,
          refreshUrl: body.refreshUrl,
        }),
      ),
      "POST /v1/stripe/connect/onboarding/start",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<StripeContracts.StripeConnectOnboardingResponse, 200>({
          data: {
            accountId: right.accountId,
            onboardingUrl: right.onboardingUrl,
          },
        }, 200)),
      Match.tag("Left", ({ left }) => Match.value(left).pipe(
        Match.tag("InvalidWithdrawalRequest", () =>
          c.json<WalletsContracts.WalletErrorResponse, 400>({
            error: walletErrorMessages.WITHDRAWAL_INVALID_REQUEST,
            details: { code: WalletErrorCodeSchema.enum.WITHDRAWAL_INVALID_REQUEST },
          }, 400)),
        Match.tag("StripeConnectNotEnabled", () =>
          c.json<WalletsContracts.WalletErrorResponse, 503>({
            error: "Stripe Connect is not enabled for this Stripe account",
            details: { code: WalletErrorCodeSchema.enum.WITHDRAWAL_INTERNAL_ERROR },
          }, 503)),
        Match.orElse(() =>
          c.json<WalletsContracts.WalletErrorResponse, 500>({
            error: walletErrorMessages.WITHDRAWAL_INTERNAL_ERROR,
            details: { code: WalletErrorCodeSchema.enum.WITHDRAWAL_INTERNAL_ERROR },
          }, 500)),
      )),
      Match.exhaustive,
    );
  });
}
