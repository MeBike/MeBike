import { createStackNavigator } from "@react-navigation/stack";
import React from "react";

import type { RootStackParamList } from "../types/navigation";

import BikeDetailScreen from "../screen/BikeDetailScreen";
import BookingHistoryDetail from "../screen/booking-history-detail/booking-history-detail-screen";
import ChangePasswordScreen from "../screen/ChangePasswordScreen";
import CreateSOSRequestScreen from "../screen/CreateSOSRequestScreen";
import EmailVerificationScreen from "../screen/EmailVerification";
import FixedSlotTemplatesScreen from "../screen/fixed-slot-templates";
import FixedSlotDetailScreen from "../screen/FixedSlotDetailScreen";
import FixedSlotEditorScreen from "../screen/FixedSlotEditorScreen";
import ForgotPasswordScreen from "../screen/ForgotPassword";
import IntroScreen from "../screen/Intro";
import LoginScreen from "../screen/Login";
import MyWalletScreen from "../screen/my-wallet-screen";
import MySOSDetailScreen from "../screen/MySOSDetailScreen";
import MySOSScreen from "../screen/MySOSScreen";
import QRScannerScreen from "../screen/QRScannerScreen";
import RegisterScreen from "../screen/Register";
import RentalQrScreen from "../screen/RentalQrScreen";
import ReportDetailScreen from "../screen/ReportDetailScreen";
import ReportScreen from "../screen/ReportScreen";
import ReservationDetailScreen from "../screen/reservation-detail-screen";
import ReservationFlowScreen from "../screen/ReservationFlowScreen";
import ReservationScreen from "../screen/reservations";
import ResetPasswordFormScreen from "../screen/ResetPasswordForm";
import ResetPasswordOTPScreen from "../screen/ResetPasswordOTP";
import ResolveSOSFormScreen from "../screen/ResolveSOSFormScreen";
import ResolveSOSScreen from "../screen/ResolveSOSScreen";
import SOSAgentDetailScreen from "../screen/SOSAgentDetailScreen";
import StaffPhoneLookupScreen from "../screen/StaffPhoneLookupScreen";
import StaffRentalDetailScreen from "../screen/StaffRentalDetailScreen";
import StationDetailScreen from "../screen/station-detail";
import StationSelectScreen from "../screen/station-select";
import SubscriptionScreen from "../screen/subscription";
import SupportScreen from "../screen/SupportScreen";
import UpdateProfileScreen from "../screen/UpdateProfileScreen";
import WithdrawScreen from "../screen/withdraw-screen";
import MainTabNavigator from "./MainTabNavigator";

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
        name="Trạm"
        component={StationSelectScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="BookingHistoryDetail"
        component={BookingHistoryDetail}
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
        name="Support"
        component={SupportScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="ReportDetail"
        component={ReportDetailScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="Report"
        component={ReportScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="Withdraw"
        component={WithdrawScreen}
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
        name="ResolveSOSScreen"
        component={ResolveSOSScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="CreateSOSRequest"
        component={CreateSOSRequestScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="MySOS"
        component={MySOSScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="MySOSDetail"
        component={MySOSDetailScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="SOSAgentDetail"
        component={SOSAgentDetailScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="ResolveSOSForm"
        component={ResolveSOSFormScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default RootNavigator;
