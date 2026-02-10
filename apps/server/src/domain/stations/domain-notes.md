# Stations Domain – Findings & Checklist (from legacy backend)

## Core Use Cases

- Create a station (name, address, coordinates, capacity as string).
- Update a station (partial updates; capacity normalized to string).
- Delete a station with safety checks (fail if bikes or rentals exist).
- Get station details by ID, including:
  - Bike counts per status (Available, Booked, Broken, Reserved, Maintained, Unavailable).
  - Total bikes and empty slots (capacity − total bikes).
  - Average rating and total ratings (via rentals → ratings).

## Discovery & Proximity

- List stations with filters:
  - Filter by `name`, `address`, `latitude`, `longitude`, `capacity`.
  - Include bike status counts and ratings in the result.
- Get nearby stations by coordinates:
  - Based on `latitude`, `longitude`, `maxDistance`, with pagination.
- Get nearest available bike:
  - Given coordinates (and optional max distance), return nearest AVAILABLE bike + station.

## Analytics & Health

- Station statistics over time (`getStationStats`):
  - Inputs: station id, date range (`from`, `to`, flexible parsing: dd-mm-yyyy or ISO).
  - Outputs:
    - Rentals: total count, total revenue, total duration, avg duration.
    - Returns: total count.
    - Current bike status snapshot and empty slots.
    - Reports: counts per report type for that station.
    - Utilization:
      - Available minutes vs used minutes, utilization rate (%).
- All stations revenue (`getAllStationsRevenue`):
  - Per station: rentals, revenue, total & avg duration.
  - Includes formatted duration strings and currency strings.
- Bike revenue per station (`getBikeRevenueByStation`):
  - Aggregate revenue per bike under each station for a period.
- Highest revenue station (`getHighestRevenueStation`):
  - Identify the top station by revenue in a time window.
- Station alerts (`getStationAlerts`):
  - Overloaded stations (> 90% capacity used).
  - Underloaded stations (< configurable threshold% available bikes).
  - Stations with high broken rate (> 10% broken bikes).
  - Stations with high emptiness (> 50% empty slots).

## HTTP Endpoints (Legacy)

- `GET /stations/:id/rentals` – rentals at a station (staff/admin).
- `GET /stations/:id/stats` – station stats (admin).
- `GET /stations/alerts` – overloaded/underloaded/broken/empty (admin/staff).
- `GET /stations/revenue` – revenue for all stations (admin).
- `GET /stations/bike-revenue` – bike revenue per station (admin).
- `GET /stations/highest-revenue` – station with highest revenue (admin).
- `POST /stations` – create station (admin).
- `GET /stations/nearby` – nearby stations by lat/lng (public).
- `GET /stations/nearest-available-bike` – nearest available bike by location (public).
- `GET /stations` – list stations (currently public, comments say “logged-in users”).
- `GET /stations/:_id` – station detail.
- `PUT /stations/:_id` – update station (admin).
- `DELETE /stations/:_id` – delete station (admin).

## “God Service” Notes (What to Split in New Design)

Legacy `StationsService` mixes:

- Domain modeling:
  - Station capacity semantics, bike status counts, ratings.
- Reporting/analytics:
  - Heavy aggregation pipelines for stats, revenue reports, alerts.
- Formatting concerns:
  - Human-friendly duration strings and currency strings.
- Date parsing & validation:
  - Repeated `parseDate` logic (dd-mm-yyyy vs ISO), plus validation of ranges.

In the new domain-first design, this should be split into:

- `stations` domain model + invariants (no DB, no formatting).
- `stations` read models / analytics module (pure queries + DTOs).
- Time & formatting helpers (separate, shared utilities).

---

## Rewrite Progress Checklist (Stations)

### 1. Shared Contracts (`packages/shared/src/contracts/server/stations/*`)

- [x] Define core models (`StationSummary`, stats, revenue, alerts, nearest bike).
- [x] Define station-specific error codes and details.
- [x] Define shared error envelope (`ServerErrorResponse`) and station error response.
- [x] Define station query routes with OpenAPI metadata.
- [ ] Define station mutation routes (create/update/delete station).
- [ ] Define contract route for station rentals (`GET /v1/stations/{stationId}/rentals`) if kept in v2.
- [x] Ensure all station routes use ISO-8601 date strings at the boundary.

### 2. HTTP Contracts Wiring (`apps/server/src/http/app.ts`)

- [x] Expose `serverOpenApi` via `/docs/openapi.json`.
- [x] Mount Scalar UI at `/docs` and verify “Stations” tag group appears.
- [x] Register all station routes with `app.openapi` using stub implementations.
- [ ] Replace stubs with real handlers that call station use-cases.

### 3. Stations Domain Design (`apps/server/src/domain/stations`)

- [ ] Define station domain types (entities/value objects) decoupled from persistence.
- [ ] Define repository interfaces for:
  - [ ] Stations (lookup, list, create/update/delete).
  - [ ] Bikes at station (counts by status, nearest available bike).
  - [ ] Station analytics/read models (stats, revenue, alerts).
- [ ] Define use-cases (aligned with legacy routes + contracts):
  - [ ] `listStations` – list stations with filters (name, address, coords, capacity).
  - [ ] `getStation` – station detail including bike status counts, ratings snapshot.
  - [ ] `getStationStats` – stats for a station in a date range.
  - [ ] `getAllStationsRevenue` – revenue summary for all stations.
  - [ ] `getBikeRevenueByStation` – revenue per bike for each station.
  - [ ] `getHighestRevenueStation` – top station by revenue in a period.
  - [ ] `getNearbyStations` – nearby stations by lat/lng (+ pagination).
  - [ ] `getNearestAvailableBike` – nearest AVAILABLE bike for coordinates.
  - [ ] `getStationAlerts` – overloaded / underloaded / broken / empty alerts.
  - [ ] `getStationRentals` – rentals at a given station (admin/staff view).
  - [ ] `createStation` – admin station creation with validation.
  - [ ] `updateStation` – admin station update (with invariants).
  - [ ] `deleteStation` – admin station delete with safety checks (no bikes/rentals).

### 4. Infrastructure & Persistence

- [ ] Map repositories to Prisma/Postgres schemas.
- [ ] Implement query layer for:
  - [ ] Current bikes per station.
  - [ ] Rentals/returns aggregation per station.
  - [ ] Revenue and utilization metrics.
  - [ ] Alerts thresholds (overloaded/underloaded/broken/empty).

### 5. Error Mapping & Validation

- [x] Decide station domain error codes and their meaning.
- [ ] Map domain errors → HTTP errors using `StationErrorDetailSchema`.
- [ ] Add unit tests for:
  - [ ] Date range validation.
  - [ ] Station not found / no available bike cases.

### 6. Testing & Verification

- [ ] Unit tests for station use-cases (pure domain).
- [ ] Integration tests for HTTP layer (Hono handlers) hitting in-memory or test DB.
- [ ] Cross-check new responses against legacy backend where behavior should match.
