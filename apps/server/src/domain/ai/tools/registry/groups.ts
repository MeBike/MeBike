import type { AiChatContext } from "@mebike/shared";

import type { CustomerToolName } from "../shared/customer-tool-args";

import {
  customerBikeToolNamesWithReservation,
} from "../bikes/tools";
import {
  customerRentalQueryToolNames,
  customerReturnSlotMutationToolNames,
  customerReturnSlotToolNames,
} from "../rentals/tools";
import { customerReservationToolNames } from "../reservations/tools";
import {
  customerLocationToolNames,
  customerStationToolNames,
} from "../stations/tools";
import { customerWalletToolNames } from "../wallets/tools";

export function getActiveCustomerTools(
  screen: AiChatContext["screen"] | null | undefined,
): CustomerToolName[] {
  switch (screen) {
    case "rental":
      return [
        ...customerRentalQueryToolNames,
        ...customerReturnSlotToolNames,
        ...customerReturnSlotMutationToolNames,
        ...customerLocationToolNames,
        ...customerStationToolNames,
        ...customerBikeToolNamesWithReservation,
      ];
    case "reservation":
      return [
        ...customerReservationToolNames,
        ...customerLocationToolNames,
        ...customerStationToolNames,
        ...customerBikeToolNamesWithReservation,
      ];
    case "station":
      return [
        ...customerReturnSlotToolNames,
        ...customerReturnSlotMutationToolNames,
        ...customerLocationToolNames,
        ...customerStationToolNames,
        ...customerBikeToolNamesWithReservation,
      ];
    case "bike":
      return [...customerBikeToolNamesWithReservation, ...customerLocationToolNames, ...customerStationToolNames];
    case "wallet":
      return [...customerWalletToolNames, ...customerLocationToolNames, ...customerStationToolNames];
    default:
      return [
        ...customerRentalQueryToolNames,
        ...customerReturnSlotToolNames,
        ...customerReturnSlotMutationToolNames,
        ...customerReservationToolNames,
        ...customerLocationToolNames,
        ...customerStationToolNames,
        ...customerBikeToolNamesWithReservation,
        ...customerWalletToolNames,
      ];
  }
}
