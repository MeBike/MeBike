import type { ReservationMode } from "@components/reservation-flow/ReservationModeToggle";
import type { RouteProp } from "@react-navigation/native";
// Common navigation hook types
import type { StackNavigationProp } from "@react-navigation/stack";

import type { ResolveSOSSchema } from "@/schema/sosSchema";

import type { Bike } from "./BikeTypes";
// Navigation Types for React Navigation
import type { Reservation } from "./reservation-types";

export type RootStackParamList = {
  "Booking": undefined;
  "Tôi": undefined;
  "Main": undefined;
  "Nhà": undefined;
  "Login": undefined;
  "Intro": undefined;
  "Register": undefined;
  "EmailVerification": { email: string };
  "StationDetail": { stationId: string };
  "Trạm": undefined;
  "Modal": undefined;
  "FormSheet": undefined;
  "TransparentModal": undefined;
  "Wallet": undefined;
  "BookingHistoryDetail": { bookingId: string };
  "BikeDetail": {
    bike: Bike;
    station: {
      id: string;
      name: string;
      address: string;
    };
  };
  "StaffRentalDetail": { rentalId: string };
  "StaffPhoneLookup": undefined;
  "RentalQr": { bookingId: string };
  "ChangePassword": undefined;
  "ForgotPassword": undefined;
  "ResetPasswordOTP": { email: string };
  "ResetPasswordForm": { email: string; otp: string };
  "UpdateProfile": undefined;
  "MyWallet": undefined;
  "Ví": undefined;
  "Subscriptions": undefined;
  "Xe": undefined;
  "Reservations": undefined;
  "ReservationDetail": {
    reservationId: string;
    reservation?: Reservation;
  };
  "SOS Dashboard": undefined;
  "ResolveSOSScreen": {
    sosId: string;
    solvable: boolean;
    onSubmit: (data: ResolveSOSSchema) => Promise<void>;
  };
  "CreateSOSRequest": {
    rentalId: string;
  };
  "MySOS": undefined;
  "MySOSDetail": {
    sosId: string;
  };
  "SOSAgentDetail": {
    sosId: string;
  };
  "ResolveSOSForm": {
    sosId: string;
    solvable: boolean;
  };
  "ReservationFlow": {
    stationId: string;
    stationName?: string;
    stationAddress?: string;
    bikeId?: string;
    bikeName?: string;
    initialMode?: ReservationMode;
    initialSubscriptionId?: string;
    lockPaymentSelection?: boolean;
  };
  "FixedSlotTemplates": {
    stationId?: string;
    stationName?: string;
  };
  "FixedSlotDetail": {
    templateId: string;
  };
  "FixedSlotEditor": {
    stationId?: string;
    stationName?: string;
    templateId?: string;
  };
  "TransactionDetail": { transactionId: string };
  "WithdrawDetail": { withdrawId: string };
  "Withdraw": undefined;
  "RefundDetail": { refundId: string };
  "Support": undefined;
  "ReportDetail": { reportId: string };
  "Report": {
    bike_id?: string;
    station_id?: string;
    rental_id?: string;
  };
  "QRScanner": undefined;
  "Công cụ": undefined;
};
export type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Nhà">;
export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, "Login">;
export type IntroScreenNavigationProp = StackNavigationProp<RootStackParamList, "Intro">;
export type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, "Register">;
export type StationDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, "StationDetail">;
export type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Tôi"
>;
export type WalletNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Wallet"
>;
export type BikeDetailNavigationProp = StackNavigationProp<
  RootStackParamList,
  "BikeDetail"
>;

export type BookingHistoryDetailNavigationProp = StackNavigationProp<
  RootStackParamList,
  "BookingHistoryDetail"
>;
export type ChangePasswordNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ChangePassword"
>;
export type ForgotPasswordNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ForgotPassword"
>;
export type UpdateProfileNavigationProp = StackNavigationProp<
  RootStackParamList,
  "UpdateProfile"
>;
export type MyWalletNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MyWallet"
>;
export type SubscriptionsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Subscriptions"
>;
export type StationDetailRouteProp = RouteProp<RootStackParamList, "StationDetail">;
export type ReservationsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Reservations"
>;
export type ReservationDetailNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ReservationDetail"
>;
export type ReservationFlowNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ReservationFlow"
>;
export type FixedSlotTemplatesNavigationProp = StackNavigationProp<
  RootStackParamList,
  "FixedSlotTemplates"
>;
export type FixedSlotDetailNavigationProp = StackNavigationProp<
  RootStackParamList,
  "FixedSlotDetail"
>;
export type FixedSlotEditorNavigationProp = StackNavigationProp<
  RootStackParamList,
  "FixedSlotEditor"
>;
export type ReservationDetailRouteProp = RouteProp<
  RootStackParamList,
  "ReservationDetail"
>;
export type ReservationFlowRouteProp = RouteProp<
  RootStackParamList,
  "ReservationFlow"
>;
export type FixedSlotDetailRouteProp = RouteProp<
  RootStackParamList,
  "FixedSlotDetail"
>;
export type FixedSlotEditorRouteProp = RouteProp<
  RootStackParamList,
  "FixedSlotEditor"
>;
export type FixedSlotTemplatesRouteProp = RouteProp<
  RootStackParamList,
  "FixedSlotTemplates"
>;
export type SupportScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Support"
>;
export type ReportDetailRouteProp = RouteProp<
  RootStackParamList,
  "ReportDetail"
>;
export type ReportDetailNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ReportDetail"
>;
export type ReportScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Report"
>;
