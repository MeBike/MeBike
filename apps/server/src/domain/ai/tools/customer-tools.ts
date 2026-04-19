import type { AiChatContext } from "@mebike/shared";

import type { CreateCustomerToolsArgs, CustomerToolName } from "./customer-tool-helpers";

import { createCustomerBikeTools } from "./customer-bike-tools";
import { createCustomerRentalTools } from "./customer-rental-tools";
import { createCustomerReservationTools } from "./customer-reservation-tools";
import { createCustomerStationTools } from "./customer-station-tools";
import { createCustomerWalletTools } from "./customer-wallet-tools";

const stationTools = [
  "getStationDetail",
  "searchStations",
  "getNearbyStations",
  "getStationAvailableBikes",
] as const satisfies readonly CustomerToolName[];

const bikeTools = [
  "getBikeDetail",
] as const satisfies readonly CustomerToolName[];

const returnSlotTools = [
  "getCurrentReturnSlot",
] as const satisfies readonly CustomerToolName[];

const locationTools = [
  "getNearbyStationsFromLocation",
] as const satisfies readonly CustomerToolName[];

export function getActiveCustomerTools(
  screen: AiChatContext["screen"] | null | undefined,
): CustomerToolName[] {
  switch (screen) {
    case "rental":
      return ["getCurrentRentalSummary", ...returnSlotTools, "getRentalDetail", ...locationTools, ...stationTools, ...bikeTools];
    case "reservation":
      return ["getReservationSummary", "getReservationDetail", ...locationTools, ...stationTools, ...bikeTools];
    case "station":
      return [...returnSlotTools, ...locationTools, ...stationTools, ...bikeTools];
    case "bike":
      return [...bikeTools, ...locationTools, ...stationTools];
    case "wallet":
      return ["getWalletSummary", "getWalletTransactionDetail", ...locationTools, ...stationTools];
    default:
      return [
        "getCurrentRentalSummary",
        ...returnSlotTools,
        "getRentalDetail",
        "getReservationSummary",
        "getReservationDetail",
        ...locationTools,
        ...stationTools,
        ...bikeTools,
        "getWalletSummary",
        "getWalletTransactionDetail",
      ];
  }
}

export function createCustomerTools(args: CreateCustomerToolsArgs) {
  return {
    ...createCustomerRentalTools(args),
    ...createCustomerReservationTools(args),
    ...createCustomerStationTools(args),
    ...createCustomerBikeTools(args),
    ...createCustomerWalletTools(args),
  } as const;
}

export type CustomerToolSet = ReturnType<typeof createCustomerTools>;
