import type { AiChatContext } from "@mebike/shared";

import type { BikeQueryService } from "@/domain/bikes";
import type {
  RentalCommandService,
  RentalService,
} from "@/domain/rentals";
import type {
  ReservationCommandService,
  ReservationQueryService,
} from "@/domain/reservations";
import type { StationQueryService } from "@/domain/stations";
import type { WalletQueryService } from "@/domain/wallets/services/queries/wallet-query.service";

export type CreateCustomerToolsArgs = {
  readonly bikeQueryService: BikeQueryService;
  readonly context: AiChatContext | null;
  readonly rentalCommandService: RentalCommandService;
  readonly reservationCommandService: ReservationCommandService;
  readonly reservationQueryService: ReservationQueryService;
  readonly rentalService: RentalService;
  readonly stationQueryService: StationQueryService;
  readonly userId: string;
  readonly walletService: WalletQueryService;
};

export type CustomerToolName
  = | "queryRentals"
    | "getRentalDetails"
    | "getCurrentReturnSlot"
    | "createReturnSlot"
    | "switchReturnSlot"
    | "cancelReturnSlot"
    | "getRentalDetail"
    | "getReservationSummary"
    | "getReservationDetail"
    | "cancelReservation"
    | "reserveBike"
    | "getStationDetail"
    | "searchStations"
    | "getNearbyStationsFromLocation"
    | "getNearbyStations"
    | "getStationAvailableBikes"
    | "getBikeDetail"
    | "getWalletSummary"
    | "getWalletTransactionDetail";

export type RentalQueryToolsArgs = Pick<
  CreateCustomerToolsArgs,
  "rentalService" | "stationQueryService" | "userId"
>;

export type RentalReturnSlotToolsArgs = Pick<
  CreateCustomerToolsArgs,
  "rentalCommandService" | "rentalService" | "stationQueryService" | "userId"
>;

export type RentalToolsArgs = RentalQueryToolsArgs & RentalReturnSlotToolsArgs;

export type ReservationToolsArgs = Pick<
  CreateCustomerToolsArgs,
  | "bikeQueryService"
  | "reservationCommandService"
  | "reservationQueryService"
  | "stationQueryService"
  | "userId"
>;

export type StationToolsArgs = Pick<
  CreateCustomerToolsArgs,
  "bikeQueryService" | "context" | "stationQueryService"
>;

export type BikeToolsArgs = Pick<CreateCustomerToolsArgs, "bikeQueryService">;

export type WalletToolsArgs = Pick<
  CreateCustomerToolsArgs,
  "userId" | "walletService"
>;
