import type { CreateCustomerToolsArgs } from "../shared/customer-tool-args";

import { createCustomerBikeTools } from "../bikes/tools";
import { createCustomerRentalTools } from "../rentals/tools";
import { createCustomerReservationTools } from "../reservations/tools";
import { createCustomerStationTools } from "../stations/tools";
import { createCustomerWalletTools } from "../wallets/tools";

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
