import type { Prisma as PrismaTypes } from "generated/prisma/client";
import type { SupplierStatus } from "generated/prisma/types";

import type { DuplicateSupplierName } from "./domain-errors";

export type SupplierDecimal = PrismaTypes.Decimal;

export type SupplierRow = {
  id: string;
  name: string;
  address: string | null;
  phoneNumber: string | null;
  contractFee: SupplierDecimal | null;
  status: SupplierStatus;
  updatedAt: Date;
};

export type SupplierFilter = {
  name?: string;
  status?: SupplierStatus;
};

export type SupplierSortField = "name" | "status" | "updatedAt";

export type CreateSupplierInput = {
  name: string;
  address?: string | null;
  phoneNumber?: string | null;
  contractFee?: SupplierDecimal | null;
  status?: SupplierStatus;
};

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

export type SupplierError = DuplicateSupplierName;

export type SupplierBikeStats = {
  supplierId: string;
  supplierName: string;
  totalBikes: number;
  available: number;
  booked: number;
  broken: number;
  reserved: number;
  maintained: number;
  unavailable: number;
};
