import { Data } from "effect";

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
  readonly allowed: readonly string[];
}> {}

/**
 * Phone number validation failed (must be 10 digits)
 * Use case: POST /suppliers, PUT /suppliers/:id
 * Backend message: PHONE_NUMBER_INVALID
 */
export class InvalidPhoneNumber extends Data.TaggedError("InvalidPhoneNumber")<{
  readonly phoneNumber: string;
}> {}

/**
 * Contract fee validation failed (must be decimal with 1-2 places)
 * Use case: POST /suppliers, PUT /suppliers/:id
 * Backend message: FEE_IN_VALID
 */
export class InvalidContractFee extends Data.TaggedError("InvalidContractFee")<{
  readonly fee: number;
}> {}

/**
 * Supplier ID format is invalid (not a valid MongoDB ObjectId)
 * Use case: Any endpoint with :id param
 * Backend message: SUPPLIER_ID_IN_VALID
 */
export class InvalidSupplierId extends Data.TaggedError("InvalidSupplierId")<{
  readonly id: string;
}> {}

/**
 * Supplier name validation failed
 * Use case: POST /suppliers, PUT /suppliers/:id
 * Backend messages: NAME_IS_REQUIRED, NAME_IN_VALID, NAME_TOO_LONG
 */
export class InvalidSupplierName extends Data.TaggedError("InvalidSupplierName")<{
  readonly name?: string;
  readonly reason: "required" | "invalid_type" | "too_long";
}> {}

/**
 * Supplier address validation failed
 * Use case: POST /suppliers, PUT /suppliers/:id
 * Backend messages: ADDRESS_IN_VALID, ADDRESS_TOO_LONG
 */
export class InvalidSupplierAddress extends Data.TaggedError("InvalidSupplierAddress")<{
  readonly address?: string;
  readonly reason: "invalid_type" | "too_long";
}> {}
