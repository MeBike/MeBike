import { NavigationContainer, type LinkingOptions } from "@react-navigation/native";
import { initStripe } from "@stripe/stripe-react-native";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { TamaguiProvider } from "tamagui";

import { AuthProviderNext } from "@providers/auth-provider-next";
import Providers from "@providers/providers";
import { RealtimeEventProvider } from "@providers/realtime-event-provider";
import { appFontSources } from "@theme/typography";

import { runSharedContractsSmokeTest } from "./debug/shared-contract-smoke";
import { log } from "./lib/log";
import { STRIPE_PUBLISHABLE_KEY, STRIPE_URL_SCHEME } from "./lib/stripe";
import { navigationRef } from "./navigation/navigation-ref";
import RootNavigator from "./navigation/root-navigator";
import tamaguiConfig from "./tamagui.config";
import type { RootStackParamList } from "./types/navigation";

void SplashScreen.preventAutoHideAsync().catch(() => {
  // ignore repeated calls during fast refresh
});

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [`${STRIPE_URL_SCHEME}://`],
  config: {
    screens: {
      MyWallet: "wallet",
    },
  },
};

const FONT_LOAD_TIMEOUT_MS = 3500;

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
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const loadFonts = async () => {
      try {
        const fontLoad = Font.loadAsync(appFontSources).catch((error) => {
          log.error("Failed to load app fonts", { error: String(error) });
        });

        const timeout = new Promise<void>((resolve) => {
          timeoutId = setTimeout(() => {
            log.warn("Continuing without app fonts after startup timeout", {
              timeoutMs: FONT_LOAD_TIMEOUT_MS,
            });
            resolve();
          }, FONT_LOAD_TIMEOUT_MS);
        });

        await Promise.race([fontLoad, timeout]);
      }
      finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

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
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <Providers>
        <NavigationContainer linking={linking} ref={navigationRef}>
          <AuthProviderNext>
            <RealtimeEventProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </RealtimeEventProvider>
          </AuthProviderNext>
        </NavigationContainer>
      </Providers>
    </TamaguiProvider>
  );
}
