
import { AuthProvider } from "@providers/auth-providers";
import Providers from "@providers/providers";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React from "react";
import RootNavigator from "./navigation/RootNavigator";

export default function App() {
  return (
    <Providers>
      <NavigationContainer>
        <AuthProvider>
          <StatusBar style="auto" />
          <RootNavigator />
        </AuthProvider>
      </NavigationContainer>
    </Providers>
  );
}
