import { AuthProviderNext } from "@providers/auth-provider-next";
import { AuthProvider } from "@providers/auth-providers";
import { BikeStatusStreamProvider } from "@providers/bike-status-stream-provider";
import Providers from "@providers/providers";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";

import { runSharedContractsSmokeTest } from "./debug/shared-contract-smoke";
import { log } from "./lib/log";
import RootNavigator from "./navigation/RootNavigator";

export default function App() {
  useEffect(() => {
    log.warn("App mounted", { __DEV__ });

    if (__DEV__ && process.env.EXPO_PUBLIC_SHARED_SMOKE === "true") {
      void runSharedContractsSmokeTest();
    }
  }, []);

  return (
    <Providers>
      <NavigationContainer>
        <AuthProviderNext>
          <AuthProvider>
            <BikeStatusStreamProvider>
              <StatusBar style="auto" />
              <RootNavigator />
            </BikeStatusStreamProvider>
          </AuthProvider>
        </AuthProviderNext>
      </NavigationContainer>
    </Providers>
  );
}
