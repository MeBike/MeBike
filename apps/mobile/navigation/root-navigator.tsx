import { createStackNavigator } from "@react-navigation/stack";
import React from "react";

import type { RootStackParamList } from "../types/navigation";

import {
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
  MyWalletScreen,
  QRScannerScreen,
  RegisterScreen,
  RentalQrScreen,
  ReservationDetailScreen,
  ReservationFlowScreen,
  ReservationScreen,
  ResetPasswordFormScreen,
  ResetPasswordOTPScreen,
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

const Stack = createStackNavigator<RootStackParamList>();

function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Main">
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="Intro"
        component={IntroScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="EmailVerification"
        component={EmailVerificationScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="StationDetail"
        component={StationDetailScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="BikeDetail"
        component={BikeDetailScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="StationSelectFlow"
        component={StationSelectScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="BookingHistoryDetail"
        component={BookingHistoryDetailScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="StaffRentalDetail"
        component={StaffRentalDetailScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="RentalQr"
        component={RentalQrScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="ResetPasswordOTP"
        component={ResetPasswordOTPScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="ResetPasswordForm"
        component={ResetPasswordFormScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="UpdateProfile"
        component={UpdateProfileScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="MyWallet"
        component={MyWalletScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="Subscriptions"
        component={SubscriptionScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="Reservations"
        component={ReservationScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="ReservationDetail"
        component={ReservationDetailScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="ReservationFlow"
        component={ReservationFlowScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="EnvironmentImpact"
        component={EnvironmentImpactScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="EnvironmentImpactDetail"
        component={EnvironmentImpactDetailScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="FixedSlotTemplates"
        component={FixedSlotTemplatesScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="FixedSlotDetail"
        component={FixedSlotDetailScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="FixedSlotEditor"
        component={FixedSlotEditorScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="StaffPhoneLookup"
        component={StaffPhoneLookupScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="StaffBikeSwapList"
        component={StaffBikeSwapListScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="StaffBikeSwapDetail"
        component={StaffBikeSwapDetailScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="TechnicianIncidentList"
        component={TechnicianIncidentListScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="TechnicianIncidentDetail"
        component={TechnicianIncidentDetailScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

export default RootNavigator;
