import { Effect } from "effect";

import type {
  CreateSupplierInput,
  SupplierFilter,
  SupplierRow,
  SupplierSortField,
  UpdateSupplierInput,
} from "../models";

import { SupplierServiceTag } from "../services/supplier.service";

export function listSuppliersUseCase(args: {
  filter: SupplierFilter;
  pageReq: import("@/domain/shared/pagination").PageRequest<SupplierSortField>;
}) {
  return Effect.gen(function* () {
    const svc = yield* SupplierServiceTag;
    return yield* svc.listSuppliers(args.filter, args.pageReq);
  });
}

export function getSupplierDetailsUseCase(id: string) {
  return Effect.gen(function* () {
    const svc = yield* SupplierServiceTag;
    return yield* svc.getSupplierById(id);
  });
}

export function createSupplierUseCase(data: CreateSupplierInput) {
  return Effect.gen(function* () {
    const svc = yield* SupplierServiceTag;
    return yield* svc.createSupplier(data);
  });
}

export function updateSupplierUseCase(id: string, patch: UpdateSupplierInput) {
  return Effect.gen(function* () {
    const svc = yield* SupplierServiceTag;
    return yield* svc.updateSupplier(id, patch);
  });
}

export function updateSupplierStatusUseCase(id: string, status: SupplierRow["status"]) {
  return Effect.gen(function* () {
    const svc = yield* SupplierServiceTag;
    return yield* svc.updateSupplierStatus(id, status);
  });
}

export function getAllSupplierStatsUseCase() {
  return Effect.gen(function* () {
    const svc = yield* SupplierServiceTag;
    return yield* svc.getAllStats();
  });
}

export function getSupplierStatsUseCase(id: string) {
  return Effect.gen(function* () {
    const svc = yield* SupplierServiceTag;
    return yield* svc.getSupplierStats(id);
  });
}
