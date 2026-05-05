import {
  BikesContracts,
  RentalCountsResponseSchema,
  RentalSchema,
  RentalsContracts,
  ReservationDetailSchema,
  ReservationExpandedDetailSchema,
  StationsContracts,
  WalletDetailSchema,
  WalletTransactionDetailSchema,
} from "@mebike/shared";
import { z } from "zod";

const RentalSummaryItemSchema = RentalSchema.extend({
  startStationInfo: z.object({
    id: z.string().uuid(),
    name: z.string(),
    address: z.string(),
  }).nullable(),
  endStationInfo: z.object({
    id: z.string().uuid(),
    name: z.string(),
    address: z.string(),
  }).nullable(),
  endTimeDisplay: z.string().nullable().optional(),
  startTimeDisplay: z.string().nullable(),
  statusLabel: z.string(),
  totalPriceDisplay: z.string().nullable(),
  updatedAtDisplay: z.string().nullable(),
}).strict();

const ReservationSummaryItemSchema = ReservationDetailSchema.extend({
  createdAtDisplay: z.string().nullable(),
  endTimeDisplay: z.string().nullable().optional(),
  prepaidDisplay: z.string().nullable(),
  startTimeDisplay: z.string().nullable(),
  statusLabel: z.string(),
  updatedAtDisplay: z.string().nullable(),
}).strict();

const RentalDetailSchema = RentalSchema.extend({
  depositAmountDisplay: z.string().nullable(),
  startStationInfo: z.object({
    id: z.string().uuid(),
    name: z.string(),
    address: z.string(),
  }).nullable(),
  endStationInfo: z.object({
    id: z.string().uuid(),
    name: z.string(),
    address: z.string(),
  }).nullable(),
  endTimeDisplay: z.string().nullable().optional(),
  startTimeDisplay: z.string().nullable(),
  statusLabel: z.string(),
  totalPriceDisplay: z.string().nullable(),
  updatedAtDisplay: z.string().nullable(),
}).strict();

const ReservationExpandedDetailToolSchema = ReservationExpandedDetailSchema.extend({
  createdAtDisplay: z.string().nullable(),
  endTimeDisplay: z.string().nullable().optional(),
  prepaidDisplay: z.string().nullable(),
  startTimeDisplay: z.string().nullable(),
  statusLabel: z.string(),
  updatedAtDisplay: z.string().nullable(),
}).strict();

const WalletSummarySchema = WalletDetailSchema.extend({
  balanceDisplay: z.string().nullable(),
  availableBalanceDisplay: z.string().nullable(),
  createdAtDisplay: z.string().nullable(),
  reservedBalanceDisplay: z.string().nullable(),
  updatedAtDisplay: z.string().nullable(),
}).strict();

const WalletTransactionSummarySchema = WalletTransactionDetailSchema.extend({
  amountDisplay: z.string().nullable(),
  createdAtDisplay: z.string().nullable(),
  feeDisplay: z.string().nullable(),
}).strict();

const WalletTransactionDetailToolSchema = WalletTransactionDetailSchema.extend({
  amountDisplay: z.string().nullable(),
  createdAtDisplay: z.string().nullable(),
  feeDisplay: z.string().nullable(),
}).strict();

const StationReservationPolicySchema = z.object({
  canAcceptNewReservation: z.boolean(),
  requiredAvailableBikes: z.number().int().nonnegative(),
}).strict();

const StationAiDetailSchema = StationsContracts.StationReadSummarySchema.extend({
  reservationPolicy: StationReservationPolicySchema,
}).strict();

const NearbyStationAiSchema = StationsContracts.NearbyStationSchema.extend({
  reservationPolicy: StationReservationPolicySchema,
}).strict();

const LocationOriginSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
}).strict();

const BikeRentabilityReasonSchema = z.enum([
  "AVAILABLE",
  "BOOKED",
  "RESERVED",
  "BROKEN",
  "REDISTRIBUTING",
  "LOST",
  "DISABLED",
  "NO_STATION",
]);

const BikeAiDetailSchema = z.object({
  createdAtDisplay: z.string().nullable(),
  id: z.string().uuid(),
  bikeNumber: z.string(),
  stationId: z.string().uuid().nullable(),
  status: BikesContracts.BikeStatusSchema,
  statusLabel: z.string(),
  isRentable: z.boolean(),
  rentabilityReason: BikeRentabilityReasonSchema,
  rentabilityLabel: z.string(),
  createdAt: z.string().datetime(),
  updatedAtDisplay: z.string().nullable(),
  updatedAt: z.string().datetime(),
}).strict();

const ReturnSlotAiStationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string(),
}).strict();

const ReservationAiStationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string(),
}).strict();

const ReturnSlotAiDetailSchema = RentalsContracts.ReturnSlotReservationSchema.extend({
  createdAtDisplay: z.string().nullable(),
  reservedFromDisplay: z.string().nullable(),
  statusLabel: z.string(),
  station: ReturnSlotAiStationSchema.nullable(),
  updatedAtDisplay: z.string().nullable(),
}).strict();

const ReturnSlotActionFailureCodeSchema = z.enum([
  "INVALID_RENTAL_ID",
  "INVALID_STATION_ID",
  "MISSING_STATION_ID",
  "NO_ACTIVE_RENTAL",
  "STATION_NOT_FOUND",
  "RETURN_CAPACITY_UNAVAILABLE",
  "RETURN_SLOT_NOT_FOUND",
  "TEMPORARY_UNAVAILABLE",
]);

const ReturnSlotActionFailureKindSchema = z.enum([
  "validation",
  "business",
  "temporary",
]);

const ReturnSlotActionSuggestedActionSchema = z.enum([
  "check_current_rental",
  "choose_station_again",
  "search_stations",
  "choose_another_station",
  "check_current_return_slot",
  "retry_later",
]);

const ReturnSlotActionFailureSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: ReturnSlotActionFailureCodeSchema,
    kind: ReturnSlotActionFailureKindSchema,
    retryable: z.boolean(),
    suggestedAction: ReturnSlotActionSuggestedActionSchema,
    userMessage: z.string(),
  }).strict(),
}).strict();

const ReturnSlotActionSuccessSchema = z.object({
  ok: z.literal(true),
  rentalId: z.string().uuid(),
  returnSlot: ReturnSlotAiDetailSchema,
}).strict();

const ReserveBikeActionFailureCodeSchema = z.enum([
  "ACTIVE_RESERVATION_EXISTS",
  "BIKE_ALREADY_RESERVED",
  "BIKE_NOT_FOUND",
  "BIKE_NOT_FOUND_IN_STATION",
  "BIKE_IS_REDISTRIBUTING",
  "BIKE_IS_LOST",
  "BIKE_IS_DISABLED",
  "BIKE_NOT_AVAILABLE",
  "STATION_RESERVATION_AVAILABILITY_TOO_LOW",
  "WALLET_NOT_FOUND",
  "INSUFFICIENT_WALLET_BALANCE",
  "OVERNIGHT_OPERATIONS_CLOSED",
  "TEMPORARY_UNAVAILABLE",
]);

const CancelReservationActionFailureCodeSchema = z.enum([
  "NO_CANCELLABLE_RESERVATION",
  "RESERVATION_NOT_FOUND",
  "RESERVATION_CANNOT_BE_CANCELLED",
  "TEMPORARY_UNAVAILABLE",
]);

const ReserveBikeActionSuggestedActionSchema = z.enum([
  "choose_another_bike",
  "check_current_reservation",
  "top_up_wallet",
  "retry_later",
  "wait_until_operating_hours",
]);

const CancelReservationActionSuggestedActionSchema = z.enum([
  "check_current_reservation",
  "retry_later",
]);

const ReserveBikeActionFailureSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: ReserveBikeActionFailureCodeSchema,
    kind: ReturnSlotActionFailureKindSchema,
    retryable: z.boolean(),
    suggestedAction: ReserveBikeActionSuggestedActionSchema,
    userMessage: z.string(),
  }).strict(),
}).strict();

const CancelReservationActionFailureSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: CancelReservationActionFailureCodeSchema,
    kind: ReturnSlotActionFailureKindSchema,
    retryable: z.boolean(),
    suggestedAction: CancelReservationActionSuggestedActionSchema,
    userMessage: z.string(),
  }).strict(),
}).strict();

const ReservationActionSuccessSchema = z.object({
  bikeNumber: z.string().nullable(),
  createdAtDisplay: z.string().nullable(),
  endTimeDisplay: z.string().nullable(),
  prepaidDisplay: z.string().nullable(),
  reservation: ReservationDetailSchema,
  startTimeDisplay: z.string().nullable(),
  station: ReservationAiStationSchema.nullable(),
  statusLabel: z.string(),
  updatedAtDisplay: z.string().nullable(),
}).strict();

const ReserveBikeActionSuccessSchema = z.object({
  ok: z.literal(true),
  reservation: ReservationActionSuccessSchema,
}).strict();

const QueryRentalsScopeSchema = z.enum(["current", "recent", "all"]);
const RentalDetailReferenceSchema = z.enum(["current", "latest", "id"]);
const ReservationDetailReferenceSchema = z.enum(["latestPendingOrActive", "id"]);
const WalletTransactionDetailReferenceSchema = z.enum(["latest", "id"]);
const StationDetailReferenceSchema = z.enum(["id"]);
const BikeDetailReferenceSchema = z.enum(["id"]);
const ReturnSlotReferenceSchema = z.enum(["current", "latest", "id"]);

export const QueryRentalsToolOutputSchema = z.object({
  counts: RentalCountsResponseSchema.nullable(),
  rentals: z.array(RentalSummaryItemSchema),
  limit: z.number().int().positive(),
  scope: QueryRentalsScopeSchema,
  status: RentalsContracts.RentalStatusSchema.nullable(),
  totalMatching: z.number().int().nonnegative(),
}).strict();

export const ReservationSummaryToolOutputSchema = z.object({
  latestPendingOrActive: ReservationSummaryItemSchema.nullable(),
  reservations: z.array(ReservationSummaryItemSchema),
}).strict();

export const WalletSummaryToolOutputSchema = z.object({
  hasWallet: z.boolean(),
  wallet: WalletSummarySchema.nullable(),
  recentTransactions: z.array(WalletTransactionSummarySchema),
}).strict();

export const StationDetailToolOutputSchema = z.object({
  reference: StationDetailReferenceSchema,
  detail: StationAiDetailSchema.nullable(),
}).strict();

export const StationSearchToolOutputSchema = z.object({
  query: z.string(),
  stations: z.array(StationAiDetailSchema),
}).strict();

export const NearbyStationsToolOutputSchema = z.object({
  reference: StationDetailReferenceSchema,
  originStationId: z.string().uuid().nullable(),
  stations: z.array(NearbyStationAiSchema),
}).strict();

export const NearbyStationsFromLocationToolOutputSchema = z.object({
  hasLocation: z.boolean(),
  origin: LocationOriginSchema.nullable(),
  stations: z.array(NearbyStationAiSchema),
}).strict();

export const StationAvailableBikesToolOutputSchema = z.object({
  reference: StationDetailReferenceSchema,
  stationId: z.string().uuid().nullable(),
  availableBikeCount: z.number().int().nonnegative(),
  bikes: z.array(BikeAiDetailSchema),
}).strict();

export const RentalDetailToolOutputSchema = z.object({
  reference: RentalDetailReferenceSchema,
  detail: RentalDetailSchema.nullable(),
}).strict();

export const RentalDetailsToolOutputSchema = z.object({
  details: z.array(RentalDetailSchema),
  missingRentalIds: z.array(z.string().uuid()),
  requestedCount: z.number().int().nonnegative(),
  returnedCount: z.number().int().nonnegative(),
}).strict();

export const CurrentReturnSlotToolOutputSchema = z.object({
  reference: ReturnSlotReferenceSchema,
  hasActiveRental: z.boolean(),
  rentalId: z.string().uuid().nullable(),
  returnSlot: ReturnSlotAiDetailSchema.nullable(),
}).strict();

export const CreateReturnSlotToolOutputSchema = z.object({
  ok: z.literal(true),
  rentalId: z.string().uuid(),
  returnSlot: ReturnSlotAiDetailSchema,
}).strict().or(ReturnSlotActionFailureSchema);

export const CancelReturnSlotToolOutputSchema = z.object({
  ok: z.literal(true),
  rentalId: z.string().uuid(),
  returnSlot: ReturnSlotAiDetailSchema,
}).strict().or(ReturnSlotActionFailureSchema);

export const SwitchReturnSlotToolOutputSchema = ReturnSlotActionSuccessSchema.or(ReturnSlotActionFailureSchema);

export const ReservationDetailToolOutputSchema = z.object({
  reference: ReservationDetailReferenceSchema,
  detail: ReservationExpandedDetailToolSchema.nullable(),
}).strict();

export const ReserveBikeToolOutputSchema = ReserveBikeActionSuccessSchema.or(
  ReserveBikeActionFailureSchema,
);

export const CancelReservationToolOutputSchema = z.object({
  ok: z.literal(true),
  reservation: ReservationActionSuccessSchema,
}).strict().or(CancelReservationActionFailureSchema);

export const WalletTransactionDetailToolOutputSchema = z.object({
  reference: WalletTransactionDetailReferenceSchema,
  detail: WalletTransactionDetailToolSchema.nullable(),
}).strict();

export const BikeDetailToolOutputSchema = z.object({
  reference: BikeDetailReferenceSchema,
  detail: BikeAiDetailSchema.nullable(),
}).strict();
