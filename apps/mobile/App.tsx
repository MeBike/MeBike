import { AuthProviderNext } from "@providers/auth-provider-next";
import { BikeStatusStreamProvider } from "@providers/bike-status-stream-provider";
import Providers from "@providers/providers";
import { PushNotificationsProvider } from "@providers/push-notifications-provider";
import { NavigationContainer } from "@react-navigation/native";
import { initStripe } from "@stripe/stripe-react-native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";

import { runSharedContractsSmokeTest } from "./debug/shared-contract-smoke";
import { STRIPE_PUBLISHABLE_KEY, STRIPE_URL_SCHEME } from "./lib/stripe";
import { log } from "./lib/log";
import RootNavigator from "./navigation/RootNavigator";

export default function App() {
  useEffect(() => {
    log.warn("App mounted", { __DEV__ });

    if (__DEV__ && process.env.EXPO_PUBLIC_SHARED_SMOKE === "true") {
      void runSharedContractsSmokeTest();
    }

    if (__DEV__ && !STRIPE_PUBLISHABLE_KEY) {
      log.warn("Missing EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY; PaymentSheet is disabled");
    }

    if (STRIPE_PUBLISHABLE_KEY) {
      void initStripe({
        publishableKey: STRIPE_PUBLISHABLE_KEY,
        urlScheme: STRIPE_URL_SCHEME,
      });
    }
  }, []);

  return (
    <Providers>
      <NavigationContainer>
        <AuthProviderNext>
          <PushNotificationsProvider>
            <BikeStatusStreamProvider>
              <StatusBar style="auto" />
              <RootNavigator />
            </BikeStatusStreamProvider>
          </PushNotificationsProvider>
        </AuthProviderNext>
      </NavigationContainer>
    </Providers>
  );
}
