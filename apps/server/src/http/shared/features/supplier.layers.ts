import { Layer } from "effect";

import {
  SupplierRepositoryLive,
  SupplierServiceLive,
} from "@/domain/suppliers";

import { PrismaLive } from "../infra.layers";

export const SupplierReposLive = SupplierRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const SupplierServiceLayer = SupplierServiceLive.pipe(
  Layer.provide(SupplierReposLive),
);

export const SupplierDepsLive = Layer.mergeAll(
  SupplierReposLive,
  SupplierServiceLayer,
  PrismaLive,
);
