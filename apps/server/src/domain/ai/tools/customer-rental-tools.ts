import type { CreateCustomerToolsArgs } from "./customer-tool-helpers";

import { createCustomerRentalQueryTools } from "./customer-rental-query-tools";
import { createCustomerRentalReturnSlotTools } from "./customer-rental-return-slot-tools";

export function createCustomerRentalTools(args: CreateCustomerToolsArgs) {
  return {
    ...createCustomerRentalQueryTools(args),
    ...createCustomerRentalReturnSlotTools(args),
  } as const;
}
