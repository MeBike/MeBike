import { NavigationContainer } from "@react-navigation/native";
import { initStripe } from "@stripe/stripe-react-native";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { TamaguiProvider } from "tamagui";

import { AuthProviderNext } from "@providers/auth-provider-next";
import { BikeStatusStreamProvider } from "@providers/bike-status-stream-provider";
import Providers from "@providers/providers";
import { PushNotificationsProvider } from "@providers/push-notifications-provider";
import { appFontSources } from "@theme/typography";

import { runSharedContractsSmokeTest } from "./debug/shared-contract-smoke";
import { log } from "./lib/log";
import { STRIPE_PUBLISHABLE_KEY, STRIPE_URL_SCHEME } from "./lib/stripe";
import RootNavigator from "./navigation/RootNavigator";
import tamaguiConfig from "./tamagui.config";

void SplashScreen.preventAutoHideAsync().catch(() => {
  // ignore repeated calls during fast refresh
});

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

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

  useEffect(() => {
    let isMounted = true;

    const loadFonts = async () => {
      try {
        await Font.loadAsync(appFontSources);
      }
      catch (error) {
        log.error("Failed to load app fonts", { error: String(error) });
      }
      finally {
        if (isMounted) {
          setFontsLoaded(true);
        }
        void SplashScreen.hideAsync().catch(() => {
          // ignore repeated calls during fast refresh
        });
      }
    };

    void loadFonts();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <Providers>
        <NavigationContainer>
          <AuthProviderNext>
            <PushNotificationsProvider>
              <BikeStatusStreamProvider>
                <StatusBar style="dark" />
                <RootNavigator />
              </BikeStatusStreamProvider>
            </PushNotificationsProvider>
          </AuthProviderNext>
        </NavigationContainer>
      </Providers>
    </TamaguiProvider>
  );
}
