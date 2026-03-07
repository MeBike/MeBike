export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export const STRIPE_URL_SCHEME = "mebike";

export const STRIPE_RETURN_URL = `${STRIPE_URL_SCHEME}://stripe-redirect`;

export function hasStripePublishableKey() {
  return STRIPE_PUBLISHABLE_KEY.length > 0;
}
