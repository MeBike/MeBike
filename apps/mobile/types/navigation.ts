import type { RouteProp } from "@react-navigation/native";
// Common navigation hook types
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Navigation Types for React Navigation
import type { Reservation } from "./reservation-types";

export type RootStackParamList = {
  Booking: undefined;
  Tôi: undefined;
  Main: undefined;
  Nhà: undefined;
  Login: undefined;
  Intro: undefined;
  Register: undefined;
  EmailVerification: { email: string };
  StationDetail: { stationId: string };
  Trạm: undefined;
  Modal: undefined;
  FormSheet: undefined;
  TransparentModal: undefined;
  Wallet: undefined;
  BookingHistoryDetail: { bookingId: string };
  StaffRentalDetail: { rentalId: string };
  RentalQr: { bookingId: string };
  ChangePassword: undefined;
  ForgotPassword: undefined;
  ResetPasswordOTP: { email: string };
  ResetPasswordForm: { email: string; otp: string };
  UpdateProfile: undefined;
  MyWallet: undefined;
  Ví: undefined;
  Subscriptions: undefined;
  Xe: undefined;
  Reservations: undefined;
  ReservationDetail: {
    reservationId: string;
    reservation?: Reservation;
  };
  ReservationFlow: {
    stationId: string;
    stationName?: string;
    stationAddress?: string;
    bikeId?: string;
    bikeName?: string;
  };
  FixedSlotTemplates: {
    stationId?: string;
    stationName?: string;
  };
  FixedSlotDetail: {
    templateId: string;
  };
  FixedSlotEditor: {
    stationId?: string;
    stationName?: string;
    templateId?: string;
  };
  TransactionDetail: { transactionId: string };
  WithdrawDetail: { withdrawId: string };
  Withdraw: undefined;
  RefundDetail: { refundId: string };
  Support: undefined;
  ReportDetail: { reportId: string };
  Report: {
    bike_id?: string;
    station_id?: string;
    rental_id?: string;
  };
  QRScanner: undefined;
  "Công cụ": undefined;
};
export type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Nhà">;
export type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;
export type IntroScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Intro">;
export type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Register">;
export type StationDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "StationDetail">;
export type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Tôi"
>;
export type WalletNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Wallet"
>;

export type BookingHistoryDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "BookingHistoryDetail"
>;
export type ChangePasswordNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ChangePassword"
>;
export type ForgotPasswordNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ForgotPassword"
>;
export type UpdateProfileNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "UpdateProfile"
>;
export type MyWalletNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MyWallet"
>;
export type SubscriptionsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Subscriptions"
>;
export type StationDetailRouteProp = RouteProp<RootStackParamList, "StationDetail">;
export type ReservationsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Reservations"
>;
export type ReservationDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ReservationDetail"
>;
export type ReservationFlowNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ReservationFlow"
>;
export type FixedSlotTemplatesNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "FixedSlotTemplates"
>;
export type FixedSlotDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "FixedSlotDetail"
>;
export type FixedSlotEditorNavigationProp = NativeStackNavigationProp<
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
export type SupportScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Support"
>;
export type ReportDetailRouteProp = RouteProp<
  RootStackParamList,
  "ReportDetail"
>;
export type ReportDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ReportDetail"
>;
export type ReportScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Report"
>;
