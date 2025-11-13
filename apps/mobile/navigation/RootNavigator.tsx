
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import MainTabNavigator from "./MainTabNavigator";
import BookingHistoryDetail from "../screen/BookingHistoryDetail";
import ChangePasswordScreen from "../screen/ChangePasswordScreen";
import EmailVerificationScreen from "../screen/EmailVerification";
import FixedSlotDetailScreen from "../screen/FixedSlotDetailScreen";
import FixedSlotEditorScreen from "../screen/FixedSlotEditorScreen";
import FixedSlotTemplatesScreen from "../screen/FixedSlotTemplatesScreen";
import ForgotPasswordScreen from "../screen/ForgotPassword";
import IntroScreen from "../screen/Intro";
import LoginScreen from "../screen/Login";
import MyWalletScreen from "../screen/my-wallet-screen";
import RegisterScreen from "../screen/Register";
import ReportScreen from "../screen/ReportScreen";
import ReportDetailScreen from "../screen/ReportDetailScreen";
import ReservationDetailScreen from "../screen/reservation-detail-screen";
import ReservationScreen from "../screen/reservation-screen";
import ReservationFlowScreen from "../screen/ReservationFlowScreen";
import RentalQrScreen from "../screen/RentalQrScreen";
import StaffRentalDetailScreen from "../screen/StaffRentalDetailScreen";
import ResetPasswordFormScreen from "../screen/ResetPasswordForm";
import ResetPasswordOTPScreen from "../screen/ResetPasswordOTP";
import StationDetailScreen from "../screen/StationDetail";
import BikeDetailScreen from "../screen/BikeDetailScreen";
import StationSelectScreen from "../styles/StationSelect";
import SubscriptionScreen from "../screen/SubscriptionScreen";
import SupportScreen from "../screen/SupportScreen";
import UpdateProfileScreen from "../screen/UpdateProfileScreen";
import WithdrawScreen from "../screen/withdraw-screen";
import QRScannerScreen from "../screen/QRScannerScreen";
import { RootStackParamList } from "../types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

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
    </Stack.Navigator>
  );
}

export default RootNavigator;
