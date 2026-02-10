import { z } from "../../../zod";

export const SupplierStatusSchema = z.enum(["ACTIVE", "INACTIVE", "TERMINATED"]);

export type SupplierStatus = z.infer<typeof SupplierStatusSchema>;
