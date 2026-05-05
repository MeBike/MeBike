import type {
  CustomerToolName,
  RentalToolsArgs,
} from "../shared/customer-tool-args";

import { createCustomerRentalQueryTools } from "./query-tools";
import { createCustomerRentalReturnSlotTools } from "./return-slot-tools";

export const customerRentalQueryToolNames = [
  "queryRentals",
  "getRentalDetail",
  "getRentalDetails",
] as const satisfies readonly CustomerToolName[];

export const customerReturnSlotToolNames = [
  "getCurrentReturnSlot",
] as const satisfies readonly CustomerToolName[];

export const customerReturnSlotMutationToolNames = [
  "createReturnSlot",
  "switchReturnSlot",
  "cancelReturnSlot",
] as const satisfies readonly CustomerToolName[];

export function createCustomerRentalTools(args: RentalToolsArgs) {
  return {
    ...createCustomerRentalQueryTools(args),
    ...createCustomerRentalReturnSlotTools(args),
  } as const;
}
