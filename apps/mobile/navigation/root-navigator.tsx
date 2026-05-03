import { createStackNavigator } from "@react-navigation/stack";
import React, { useEffect } from "react";

import { LoadingScreen } from "@components/LoadingScreen";
import { useAuthNext } from "@providers/auth-provider-next";

import type { RootStackParamList } from "../types/navigation";

import {
  AiAssistantScreen,
  BikeDetailScreen,
  BookingHistoryDetailScreen,
  ChangePasswordScreen,
  EmailVerificationScreen,
  EnvironmentImpactDetailScreen,
  EnvironmentImpactScreen,
  FixedSlotDetailScreen,
  FixedSlotEditorScreen,
  FixedSlotTemplatesScreen,
  ForgotPasswordScreen,
  IntroScreen,
  LoginScreen,
  MetroJourneyScreen,
  MyWalletScreen,
  QRScannerScreen,
  RegisterScreen,
  RentalQrScreen,
  ReservationDetailScreen,
  ReservationFlowScreen,
  ReservationScreen,
  ResetPasswordFormScreen,
  ResetPasswordOTPScreen,
  RidingOffersScreen,
  StaffBikeSwapDetailScreen,
  StaffBikeSwapListScreen,
  StaffPhoneLookupScreen,
  StaffRentalDetailScreen,
  StationDetailScreen,
  SubscriptionScreen,
  TechnicianIncidentDetailScreen,
  TechnicianIncidentListScreen,
  UpdateProfileScreen,
} from "../screen";
import StationSelectScreen from "../styles/StationSelect";
import MainTabNavigator from "./main-tab-navigator";
import { navigationRef } from "./navigation-ref";

const Stack = createStackNavigator<RootStackParamList>();

const standardScreenOptions = { headerShown: false, gestureEnabled: false } as const;
const assistantScreenOptions = { headerShown: false, gestureEnabled: true } as const;

function RootNavigator() {
  const { status, isAuthenticated } = useAuthNext();

  useEffect(() => {
    if (!isAuthenticated || !navigationRef.isReady()) {
      return;
    }

    if (navigationRef.getCurrentRoute()?.name !== "Login") {
      return;
    }

    navigationRef.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
  }, [isAuthenticated]);

  if (status === "loading") {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator initialRouteName={isAuthenticated ? "Main" : "StationSelectFlow"}>
      <Stack.Screen
        name="StationSelectFlow"
        component={StationSelectScreen}
        options={standardScreenOptions}
      />
      <Stack.Screen
        name="StationDetail"
        component={StationDetailScreen}
        options={standardScreenOptions}
      />
      <Stack.Screen
        name="BikeDetail"
        component={BikeDetailScreen}
        options={standardScreenOptions}
      />
      <Stack.Screen
        name="EmailVerification"
        component={EmailVerificationScreen}
        options={standardScreenOptions}
      />
      <Stack.Screen
        name="MetroJourney"
        component={MetroJourneyScreen}
        options={standardScreenOptions}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={standardScreenOptions}
      />
      <Stack.Screen
        name="Intro"
        component={IntroScreen}
        options={standardScreenOptions}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={standardScreenOptions}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={standardScreenOptions}
      />
      <Stack.Screen
        name="ResetPasswordOTP"
        component={ResetPasswordOTPScreen}
        options={standardScreenOptions}
      />
      <Stack.Screen
        name="ResetPasswordForm"
        component={ResetPasswordFormScreen}
        options={standardScreenOptions}
      />
      <Stack.Screen
        name="Subscriptions"
        component={SubscriptionScreen}
        options={standardScreenOptions}
      />
      {isAuthenticated
        ? (
            <>
              <Stack.Screen
                name="Main"
                component={MainTabNavigator}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="AiAssistant"
                component={AiAssistantScreen}
                options={assistantScreenOptions}
              />
              <Stack.Screen
                name="BookingHistoryDetail"
                component={BookingHistoryDetailScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="StaffRentalDetail"
                component={StaffRentalDetailScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="RentalQr"
                component={RentalQrScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="ChangePassword"
                component={ChangePasswordScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="UpdateProfile"
                component={UpdateProfileScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="MyWallet"
                component={MyWalletScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="Reservations"
                component={ReservationScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="RidingOffers"
                component={RidingOffersScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="ReservationDetail"
                component={ReservationDetailScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="ReservationFlow"
                component={ReservationFlowScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="EnvironmentImpact"
                component={EnvironmentImpactScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="EnvironmentImpactDetail"
                component={EnvironmentImpactDetailScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="FixedSlotTemplates"
                component={FixedSlotTemplatesScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="FixedSlotDetail"
                component={FixedSlotDetailScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="FixedSlotEditor"
                component={FixedSlotEditorScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="QRScanner"
                component={QRScannerScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="StaffPhoneLookup"
                component={StaffPhoneLookupScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="StaffBikeSwapList"
                component={StaffBikeSwapListScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="StaffBikeSwapDetail"
                component={StaffBikeSwapDetailScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="TechnicianIncidentList"
                component={TechnicianIncidentListScreen}
                options={standardScreenOptions}
              />
              <Stack.Screen
                name="TechnicianIncidentDetail"
                component={TechnicianIncidentDetailScreen}
                options={standardScreenOptions}
              />
            </>
          )
        : null}
    </Stack.Navigator>
  );
}

export default RootNavigator;
