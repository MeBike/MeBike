import { suppliersMutations } from "./mutations";
import { suppliersQueries } from "./queries";

export * from "./mutations";
export * from "./queries";
export * from "./shared";

export const suppliersRoutes = {
  ...suppliersQueries,
  ...suppliersMutations,
} as const;
