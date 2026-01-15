# Bikes Domain – Findings & Checklist (from legacy backend)

## Rewrite status (apps/server, verified)

Implemented HTTP endpoints live in `apps/server/src/http/routes/bikes.ts`:

- User-facing: list bikes, bike detail
- Admin/Staff: update bike, report broken bike, soft delete bike
- Analytics: overall stats, highest revenue bike, per-bike activity stats, per-bike rental history

Known gaps vs legacy `apps/backend/src/routes/bikes.routes.ts`:

- `POST /bikes` (create bike) exists in legacy but is not implemented in the rewrite routes yet.
- Legacy also has `/bikes/stats/rental-overview`; verify whether this is required or already covered by the rewrite stats endpoints.

## Bike Status State Machine (Legacy + IoT Firmware)

Bike status values align between:

- Legacy backend enum `apps/backend/src/constants/enums.ts` (`BikeStatus.*`)
- IoT firmware operational states `apps/iot/include/globals.h` (`STATE_*`)

### States

- `AVAILABLE` / `STATE_AVAILABLE`: Bike ready for rent/use.
- `RESERVED` / `STATE_RESERVED`: Bike held for pre-booking (reservation created / fixed-slot assignment).
- `BOOKED` / `STATE_BOOKED`: Bike currently rented / active usage.
- `BROKEN` / `STATE_BROKEN`: Bike is broken.
- `MAINTAINED` / `STATE_MAINTAINED`: Bike under maintenance.
- `UNAVAILABLE` / `STATE_UNAVAILABLE`: Bike offline / soft-deleted / not available for normal flows.

### Core transitions (observed behavior)

- `AVAILABLE -> RESERVED`
  - Trigger: reservation created (one-time/subscription) or fixed-slot daily assignment.
  - Legacy: `apps/backend/src/services/reservations.services.ts` sets bike status `Reserved`.
  - IoT: accepts `reservation` command `"reserve"` only when currently `AVAILABLE` (`apps/iot/src/handlers/CommandHandler.cpp:237`).
- `RESERVED -> AVAILABLE`
  - Trigger: reservation cancelled or expired.
  - Legacy: `cancelReservation` and `expireReservationAndReleaseBike` set bike status `Available` (`apps/backend/src/services/reservations.services.ts`).
  - IoT: accepts `reservation` command `"cancel"` only when currently `RESERVED` (`apps/iot/src/handlers/CommandHandler.cpp:255`).
- `RESERVED -> BOOKED`
  - Trigger: reservation confirmed (claim/start).
  - Legacy: `confirmReservationCore` sets bike status `Booked` and sends booking `"claim"` (`apps/backend/src/services/reservations.services.ts`).
  - IoT: booking `"claim"/"claimed"` is accepted when currently `RESERVED` (`apps/iot/src/handlers/CommandHandler.cpp:184`).
- `AVAILABLE -> BOOKED`
  - Trigger: start rental directly (no prior reservation).
  - Legacy: `createRentalSession` sets bike status `Booked` and sends booking `"book"` (`apps/backend/src/services/rentals.services.ts`).
  - IoT: booking `"book"` accepted when `AVAILABLE` (also allowed when `RESERVED`) (`apps/iot/src/handlers/CommandHandler.cpp:166`).
- `BOOKED -> AVAILABLE`
  - Trigger: end rental successfully.
  - Legacy: end-rental path updates bike to `Available`, then sends IoT booking `"release"` when bike is `Available` (`apps/backend/src/services/rentals.services.ts`).
- `BOOKED -> BROKEN`
  - Trigger: end rental with a “broken” outcome (or user reports broken while renting).
  - Legacy: user `report-broken` sets bike `Broken`; end-rental can also result in `Broken` and then sends IoT state `"broken"` (`apps/backend/src/services/rentals.services.ts`).

### Notes / invariants worth preserving in the rewrite

- Reservation/hold is a distinct state (`RESERVED`) and is allowed only from `AVAILABLE` on the device.
- Booking/rental (`BOOKED`) can start from either `AVAILABLE` or `RESERVED`.
- Expiry/cancel must release `RESERVED -> AVAILABLE` (and should be idempotent).

## Core Use Cases

- Create bike (admin):
  - Inputs: `chip_id`, `station_id`, optional initial `status`, `supplier_id`.
  - Validations:
    - `chip_id` required and unique across bikes.
    - `station_id` must exist.
    - `supplier_id` must exist.
- Get bikes list (public in current code; comments suggest role-based filtering):
  - Filters: `station_id`, `status`, `supplier_id`, `chip_id` (partial match).
  - Pagination: `page` + `limit` (offset).
  - Enrichment:
    - Joins rentals → ratings to compute `average_rating` and `total_ratings` for each bike.
  - Role notes (legacy intent, currently commented out):
    - Guests/users: only see `BikeStatus.Available`.
    - Staff/admin: can see all statuses.
- Get bike detail by id:
  - Same rating enrichment as list.
- Report broken bike (user):
  - Preconditions:
    - User must currently be renting the bike (`rentals` has `status = Rented` for `(user_id, bike_id)`).
  - Effect:
    - Update bike status → `Broken`.
- Admin/staff update bike (`admin-update/:id`):
  - Can update: `status`, `station_id`, `supplier_id`, `chip_id`.
  - Important invariants for moving stations:
    - Cannot change `station_id` if bike status is `Booked` (in use).
    - Cannot change `station_id` if there is a pending reservation for the bike.
  - Chip id uniqueness enforced (cannot collide with another bike).
- Soft delete bike (admin):
  - Does not remove row; sets status to `Unavailable`.
  - Guardrails:
    - Cannot delete if bike has an active rental (`Rented`).
    - Cannot delete if bike has a pending reservation.

## Analytics & Reporting (Admin/Staff)

- Overall bike status stats (`GET /bikes/stats`):
  - Returns counts grouped by bike status.
- Rental overview (`GET /bikes/stats/rental-overview`):
  - Counts:
    - total active bikes (`status != Unavailable`)
    - rented bikes (`status == Booked`)
    - percentage rented
- Bike stats by id (`GET /bikes/:id/stats`):
  - Aggregates rentals for the bike:
    - total rentals, total revenue, total duration minutes
  - Adds total reports count for that bike.
- Bike rental history (`GET /bikes/:id/rental-history`):
  - Completed rentals only; sorted by end time desc.
  - Joins user and stations; returns a paginated `data` + `pagination`.
- Bike activity stats (`GET /bikes/:id/activity-stats`):
  - Derived metrics:
    - total minutes active (sum of completed rental durations)
    - total reports (damage/dirty types)
    - uptime percentage (estimated minutes used / estimated available minutes since created_at)
    - monthly stats for last ~12 months (rentals_count, minutes_active, revenue)
- Highest revenue bike (`GET /bikes/highest-revenue`):
  - Finds bike with max total revenue among completed rentals.
  - Returns bike chip id and station info.

## Core Data Models (Legacy Persistence Shapes)

### Bike (Mongo `bikes` collection)

Fields (from `apps/backend/src/models/schemas/bike.schema.ts`):

- `_id`: ObjectId
- `chip_id`: string
- `station_id?`: ObjectId | null
  - Note: comment says “null when bike is rented”; rental flow sets status to `Booked` but does not null station_id in rentals service.
- `status`: BikeStatus (`CÓ SẴN` | `ĐANG ĐƯỢC THUÊ` | `BỊ HỎNG` | `ĐÃ ĐẶT TRƯỚC` | `ĐANG BẢO TRÌ` | `KHÔNG CÓ SẴN`)
- `supplier_id?`: ObjectId | null
- `created_at`, `updated_at`: Date

Derived fields added by read queries (not stored):

- `average_rating`: number
- `total_ratings`: number

## HTTP Endpoints (Legacy)

Routes are defined in `apps/backend/src/routes/bikes.routes.ts`:

- CRUD / lifecycle:
  - `POST /bikes` – create (admin).
  - `GET /bikes` – list (pagination + filters; auth is currently commented out).
  - `GET /bikes/:_id` – detail (public; validates bike exists).
  - `PATCH /bikes/report-broken/:_id` – user reports broken (must be renting).
  - `PATCH /bikes/admin-update/:_id` – admin/staff update.
  - `DELETE /bikes/:_id` – soft delete (admin).
- Rental lookups:
  - `GET /bikes/:_id/rentals` – rentals for bike (admin/staff; paginated).
  - `GET /bikes/:_id/rental-history` – completed rental history (admin/staff; custom pagination payload).
- Stats:
  - `GET /bikes/stats` – counts by status (admin).
  - `GET /bikes/stats/rental-overview` – total vs rented percentage (admin/staff).
  - `GET /bikes/:_id/stats` – aggregated rental stats + reports count (admin).
  - `GET /bikes/:_id/activity-stats` – activity stats (admin/staff).
  - `GET /bikes/highest-revenue` – highest revenue bike (admin).

## “God Service” Notes (What to Split in New Design)

Legacy `BikesService` mixes:

- Core CRUD + invariants (station move restrictions).
- Analytics/reporting pipelines (rental history/activity stats/revenue).
- Ratings enrichment (via rentals → ratings).

In the new domain-first design this should be split into:

- Bike domain model + invariants (pure, no DB).
- Bike read models (list/detail projections, rating aggregates).
- Bike analytics module (rental history/activity stats/highest revenue).

---

## Rewrite Progress Checklist (Bikes)

## Admin/Staff TODOs (Rewrite Gaps)

- [ ] Admin/staff authz for admin endpoints (role guard + contract `security`).
- [ ] Admin list bikes with “all statuses” view (separate from public list semantics).
- [ ] Bike CRUD completeness:
  - [ ] `createBike` (admin).
  - [ ] `adminUpdateBike` invariants cross-domain (pending reservations + active rentals) enforced transactionally.
  - [ ] “Soft delete” semantics clarified (status vs deleted flag).
- [ ] Admin analytics endpoints (legacy had many):
  - [x] Counts by status, rental overview.
  - [x] Per-bike stats, rental history, activity stats, highest-revenue bike.
- [ ] Admin operational endpoints:
  - [ ] Mark maintained/unavailable/broken explicitly (vs only “report broken” user flow).
  - [ ] Bulk moves / bulk status updates (optional).

### 1. Shared Contracts (`packages/shared/src/contracts/server/bikes/*`)

- [x] Define core models (BikeSummary, BikeDetail, BikeStatus, bike-with-rating fields).
- [x] Define bike error codes (not found, invalid state, chip conflict, station/supplier not found, cannot move/delete constraints).
- [x] Define shared error envelope (`ServerErrorResponse`) and bike error response.
- [x] Define query routes with OpenAPI metadata (list, detail, stats, rental history).
- [x] Define mutation routes with OpenAPI metadata (create, admin-update, report-broken, delete).
- [x] Decide how to represent `BikeStatus` in rewrite (English enum values: AVAILABLE, BOOKED, BROKEN, RESERVED, MAINTAINED, UNAVAILABLE).

### 2. HTTP Wiring (`apps/server/src/http`)

- [x] Register bike routes with `app.openapi` using stubs.
- [x] Replace stubs with real handlers calling bike use-cases.

### 3. Bikes Domain (`apps/server/src/domain/bikes`)

- [x] Define domain types (BikeId, ChipId, StationId, SupplierId, BikeStatus).
- [x] Repository interfaces:
  - [x] Bikes (create/update/delete, findById, list).
  - [ ] Ratings aggregates (avg/total per bike).
  - [x] Rentals read models (history/stats).
  - [ ] Reservations lookup (pending reservations for invariants).
  - [ ] Reports aggregates (counts per bike).
- [x] Use-cases:
  - [x] `listBikes` (filters + pagination + role-based visibility).
  - [x] `getBike` (detail).
  - [ ] `createBike` (admin).
  - [x] `adminUpdateBike` (station move invariants, chip uniqueness).
  - [x] `reportBrokenBike` (must be renting).
  - [x] `deleteBike` (soft delete; active rental/reservation guards).
  - [x] `getBikeStats` / `getBikeStatsById`.
  - [x] `getBikeRentalHistory` / `getBikeActivityStats`.
  - [x] `getHighestRevenueBike`.

### 4. Infrastructure & Concurrency

- [ ] Implement station move/delete invariants transactionally in Postgres.
- [ ] Decide how to compute ratings aggregates efficiently (materialized view vs query).
- [ ] Align bike status updates with IoT / pubsub strategy (if needed).

### 5. Tests

- [ ] Unit tests for invariants (cannot move while booked/reserved; cannot delete while rented/reserved).
- [x] Integration tests for list/detail projections and stats queries.
