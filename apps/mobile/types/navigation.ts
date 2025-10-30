import type { RouteProp } from "@react-navigation/native";
// Common navigation hook types
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Navigation Types for React Navigation
import type { Reservation } from "./ReservationTypes";

export type RootStackParamList = {
  Booking: undefined;
  Tôi: undefined;
  Main: undefined;
  Nhà: undefined;
  Login: undefined;
  Intro: undefined;
  Register: undefined;
  StationDetail: { stationId: string };
  Trạm: undefined;
  Modal: undefined;
  FormSheet: undefined;
  TransparentModal: undefined;
  Wallet: undefined;
  BookingHistoryDetail: { bookingId: string };
  ChangePassword: undefined;
  ForgotPassword: undefined;
  UpdateProfile: undefined;
  MyWallet: undefined;
  Xe: undefined;
  Reservations: undefined;
  ReservationDetail: {
    reservationId: string;
    reservation?: Reservation;
  };
  Support: undefined; 
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
export type StationDetailRouteProp = RouteProp<RootStackParamList, "StationDetail">;
export type ReservationsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Reservations"
>;
export type ReservationDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ReservationDetail"
>;
export type ReservationDetailRouteProp = RouteProp<
  RootStackParamList,
  "ReservationDetail"
>;
export type SupportScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Support"
>;
