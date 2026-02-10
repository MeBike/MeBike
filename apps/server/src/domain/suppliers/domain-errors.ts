import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";
import type { SupplierStatus } from "generated/prisma/enums";

export class SupplierRepositoryError extends Data.TaggedError("SupplierRepositoryError")<
  WithGenericError
> {}
/**
 * Supplier not found by ID
 * Use case: GET/PUT/PATCH /suppliers/:id
 * Backend message: SUPPLIER_NOT_FOUND
 */
export class SupplierNotFound extends Data.TaggedError("SupplierNotFound")<{
  readonly id: string;
}> {}

/**
 * Supplier name already exists (unique constraint)
 * Use case: POST /suppliers, PUT /suppliers/:id
 * Backend message: SUPPLIER_NAME_DUPLICATED
 */
export class DuplicateSupplierName extends Data.TaggedError("DuplicateSupplierName")<{
  readonly name: string;
}> {}

/**
 * Invalid status value (not in SupplierStatus enum)
 * Use case: PATCH /suppliers/:id (change status)
 * Backend message: STATUS_INVALID
 */
export class InvalidSupplierStatus extends Data.TaggedError("InvalidSupplierStatus")<{
  readonly status: string;
  readonly allowed: readonly SupplierStatus[]; // THIS WAS ASS THE FUCK WHY THE FUCK LLM LOVE TO ASSET  STRING WHEN THE TYPE FOR IT EXISTI??
}> {}

/**
 * Phone number validation failed (must be 10 digits)
 * Use case: POST /suppliers, PUT /suppliers/:id
 * Backend message: PHONE_NUMBER_INVALID
 */
// NOTE:
// Low-level input validation (ID format, name/address/phone/fee shape)
// is handled at the HTTP contract layer via Zod + the global validation
// handler, so we intentionally do not model those as domain errors here.
