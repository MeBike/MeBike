
import { AuthProvider } from "@providers/auth-providers";
import Providers from "@providers/providers";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React from "react";
import RootNavigator from "./navigation/RootNavigator";
import { BikeStatusStreamProvider } from "@providers/bike-status-stream-provider";

export default function App() {
  return (
    <Providers>
      <NavigationContainer>
        <AuthProvider>
          <BikeStatusStreamProvider>
            <StatusBar style="auto" />
            <RootNavigator />
          </BikeStatusStreamProvider>
        </AuthProvider>
      </NavigationContainer>
    </Providers>
  );
}
