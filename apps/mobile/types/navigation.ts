import type { AiChatContext } from "@mebike/shared";
import type { RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";

import type { BikeSummary } from "@/contracts/server";
// Common navigation hook types
import type { ReservationMode } from "@components/reservation-flow/ReservationModeToggle";

// Navigation Types for React Navigation
import type { Reservation } from "./reservation-types";

export type StationSelectionMode = "rental-return-slot" | "rental-bike-swap";

export type StationSelectionContext = {
  selectionMode: StationSelectionMode;
  rentalId: string;
  currentReturnStationId?: string;
  currentBikeSwapStationId?: string;
};

export type RootStackParamList = {
  "Booking": undefined;
  "Tôi": undefined;
  "Main": undefined;
  "Login": undefined;
  "Intro": undefined;
  "Register": undefined;
  "EmailVerification": { email: string };
  "StationDetail": { stationId: string } & Partial<StationSelectionContext>;
  "Trạm": Partial<StationSelectionContext> | undefined;
  "StationSelectFlow": Partial<StationSelectionContext> | undefined;
  "Modal": undefined;
  "FormSheet": undefined;
  "TransparentModal": undefined;
  "Wallet": undefined;
  "AiAssistant": {
    context?: AiChatContext | null;
  } | undefined;
  "BookingHistoryDetail": { bookingId: string };
  "BikeDetail": {
    bike: BikeSummary;
    station: {
      id: string;
      name: string;
      address: string;
    };
  };
  "StaffRentalDetail": { rentalId: string };
  "StaffPhoneLookup": undefined;
  "StaffBikeSwapList": undefined;
  "StaffBikeSwapDetail": { bikeSwapRequestId: string };
  "TechnicianIncidentList": undefined;
  "TechnicianIncidentDetail": { incidentId: string };
  "RentalQr": { bookingId: string };
  "ChangePassword": undefined;
  "ForgotPassword": undefined;
  "ResetPasswordOTP": { email: string };
  "ResetPasswordForm": { resetToken: string };
  "UpdateProfile": undefined;
  "MyWallet": undefined;
  "MetroJourney": undefined;
  "RidingOffers": undefined;
  "Ví": undefined;
  "Subscriptions": undefined;
  "Xe": undefined;
  "Reservations": undefined;
  "ReservationDetail": {
    reservationId: string;
    reservation?: Reservation;
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
  "EnvironmentImpact": undefined;
  "EnvironmentImpactDetail": {
    rentalId: string;
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
  "RefundDetail": { refundId: string };
  "QRScanner": undefined;
  "Công cụ": undefined;
};
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
export type AiAssistantNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AiAssistant"
>;
export type AiAssistantRouteProp = RouteProp<
  RootStackParamList,
  "AiAssistant"
>;
export type BikeDetailNavigationProp = StackNavigationProp<
  RootStackParamList,
  "BikeDetail"
>;

export type BookingHistoryDetailNavigationProp = StackNavigationProp<
  RootStackParamList,
  "BookingHistoryDetail"
>;
export type BookingHistoryDetailRouteProp = RouteProp<
  RootStackParamList,
  "BookingHistoryDetail"
>;
export type StaffRentalDetailNavigationProp = StackNavigationProp<
  RootStackParamList,
  "StaffRentalDetail"
>;
export type StaffPhoneLookupNavigationProp = StackNavigationProp<
  RootStackParamList,
  "StaffPhoneLookup"
>;
export type StaffBikeSwapListNavigationProp = StackNavigationProp<
  RootStackParamList,
  "StaffBikeSwapList"
>;
export type StaffBikeSwapDetailNavigationProp = StackNavigationProp<
  RootStackParamList,
  "StaffBikeSwapDetail"
>;
export type TechnicianIncidentListNavigationProp = StackNavigationProp<
  RootStackParamList,
  "TechnicianIncidentList"
>;
export type TechnicianIncidentDetailNavigationProp = StackNavigationProp<
  RootStackParamList,
  "TechnicianIncidentDetail"
>;
export type StaffRentalDetailRouteProp = RouteProp<
  RootStackParamList,
  "StaffRentalDetail"
>;
export type StaffBikeSwapDetailRouteProp = RouteProp<
  RootStackParamList,
  "StaffBikeSwapDetail"
>;
export type TechnicianIncidentDetailRouteProp = RouteProp<
  RootStackParamList,
  "TechnicianIncidentDetail"
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
export type MetroJourneyNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MetroJourney"
>;
export type RidingOffersNavigationProp = StackNavigationProp<
  RootStackParamList,
  "RidingOffers"
>;
export type SubscriptionsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Subscriptions"
>;
export type StationDetailRouteProp = RouteProp<RootStackParamList, "StationDetail">;
export type StationSelectRouteProp
  = | RouteProp<RootStackParamList, "Trạm">
    | RouteProp<RootStackParamList, "StationSelectFlow">;
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
export type EnvironmentImpactNavigationProp = StackNavigationProp<
  RootStackParamList,
  "EnvironmentImpact"
>;
export type EnvironmentImpactDetailNavigationProp = StackNavigationProp<
  RootStackParamList,
  "EnvironmentImpactDetail"
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
export type EnvironmentImpactDetailRouteProp = RouteProp<
  RootStackParamList,
  "EnvironmentImpactDetail"
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
