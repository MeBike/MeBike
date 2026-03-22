# Suppliers Domain – Notes & Checklist

## Intent (Legacy parity)

Suppliers are an admin/staff-managed domain:

- Manage supplier records (name, contact, contract fee, status).
- Associate bikes with suppliers and produce supplier-level bike status stats.

## Admin/Staff TODOs (Rewrite Gaps)

- [x] Admin/staff authz for supplier endpoints (role guard + contract `security`).
- [ ] Supplier CRUD completeness:
  - [x] Create supplier.
  - [x] Update supplier.
  - [x] Status update (ACTIVE/INACTIVE/TERMINATED).
  - [ ] Clarify “delete” semantics (soft delete is currently `TERMINATED`; confirm legacy expectations).
- [ ] Supplier uniqueness/invariants:
  - [ ] Confirm which fields are unique (name only today) and align contract + DB indexes.
  - [ ] Decide behavior when re-activating a TERMINATED supplier.
- [ ] Supplier analytics:
  - [x] Supplier bike counts by status (implemented).
  - [ ] Supplier performance analytics (legacy-equivalent if needed): rentals/revenue per supplier, broken rate, maintenance counts.
- [ ] Supplier ↔ bikes admin ops:
  - [ ] Endpoints for listing bikes by supplier, and reassignment flows.
  - [ ] Guardrails for reassignment (e.g., cannot reassign booked/rented bikes).

## Rewrite Progress Checklist (Suppliers)

### 1. Domain (`apps/server/src/domain/suppliers`)

- [x] Domain model (`SupplierRow`, filter/sort, stats).
- [x] Repository (Prisma) for list/get/create/update/status + stats groupBy.
- [x] Service validates allowed status values.
- [x] Use-cases wrap service calls.

### 2. Contracts (`packages/shared/src/contracts/server/suppliers/*`)

- [x] Define supplier error codes (not found, duplicate name, invalid status).
- [x] Define supplier models + pagination schemas.
- [x] Define routes:
  - [x] List / detail.
  - [x] Create / update / status update / delete.
  - [x] Stats endpoints.

### 3. HTTP (`apps/server/src/http/routes/suppliers.ts`)

- [x] Ensure admin/staff middleware is enforced consistently.
- [x] Map domain errors → shared supplier error codes (no ad-hoc strings).
