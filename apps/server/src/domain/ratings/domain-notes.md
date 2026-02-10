Ratings Domain – Legacy Backend Findings & Rewrite Checklist

## Core CRUD / User-Facing Use Cases

- Create rating for a rental
  - Legacy: `POST /ratings/:rental_id`
  - Preconditions (enforced by `createRatingValidator` + controllers):
    - Authenticated user (`accessTokenValidator`).
    - `rental_id` is a valid ID and rental exists.
    - Rental status is `COMPLETED` (cannot rate active/cancelled rentals).
    - Rental belongs to the current user (cannot rate someone else’s rental).
    - Rental was completed **within the last 7 days**:
      - Legacy checks `rental.updated_at < now - 7 days` → rating expired.
    - There is no existing rating for this rental by this user:
      - Enforced by:
        - middleware (`ratings.findOne({ rental_id, user_id })`)
        - plus controller guard (`ratings.findOne({ rental_id })`) before `createRating`.
    - `rating` is an integer 1–5.
    - `reason_ids` is a non-empty array of valid `rating_reasons._id`.
    - Optional `comment` is string, max length 500.
  - Effects:
    - Insert one `ratings` document:
      - `user_id`, `rental_id`, `rating` (1–5).
      - `reason_ids` (array of ObjectId).
      - optional `comment`.
      - `created_at` / `updated_at` set to “local Vietnam time” in legacy (rewrite will use UTC).

- Get rating for a rental (current user or admin)
  - Legacy: `GET /ratings/:rental_id`
  - Behavior:
    - Loads `ratings` by `rental_id`.
    - If caller is **admin**, can see any rating.
    - If caller is **not admin**, filter by `user_id` = current user.
    - Joins `rating_reasons` to return `reason_details` (id, type, applies_to, messages).
    - Errors:
      - If no rating found → `404 RATING_NOT_FOUND`.

## Admin / Operational Use Cases

- Admin list all ratings
  - Legacy: `GET /ratings`
  - Filters via query (`GetRatingReqQuery`):
    - `user_id` (filter by user).
    - `rating` (score 1–5).
    - `reason_ids` (contains any of the given reason IDs).
  - Uses aggregation:
    - `$match` on filters.
    - `$lookup` `users` (attach `fullname`, `email`).
    - `$sort` by `created_at` desc.
    - Paginated response via `sendPaginatedAggregationResponse`.

- Get rating reasons (for building UI)
  - Legacy: `GET /ratings/rating-reasons`
  - Requires authentication (but not necessarily admin).
  - Optional filters:
    - `type` (e.g. POSITIVE/NEGATIVE).
    - `applies_to` (e.g. BIKE/STATION/APP).
  - Returns list of documents from `rating_reasons`:
    - Each has `_id`, `type`, `applies_to`, `messages` (free-form reasons text).

- Get rating detail (admin only)
  - Legacy: `GET /ratings/detail/:rating_id`
  - Aggregates:
    - Rating itself.
    - User info (id, fullname, email, phone, avatar).
    - Rental info (id, bike_id, start_time, end_time, total_price, status).
    - Bike info attached to rental (chip_id, status).
    - Start/end station info (name, address).
    - Reason details from `rating_reasons`.
  - Errors:
    - If no rating found → `404 RATING_NOT_FOUND`.

- Ratings by bike (admin)
  - Legacy: `GET /ratings/bike/:_id`
  - Computes for a given bike:
    - `average_rating` (avg `rating`).
    - `total_ratings` (count).
    - star breakdown:
      - `five_star_count` … `one_star_count`.
  - Implementation:
    - `$lookup` rentals by `rental_id`.
    - `$match` `rental_info.bike_id = bikeId`.
    - `$group` by `bike_id`.
  - If no ratings:
    - Returns zeros with `_id = bikeObjectId`.

- Ratings by station (admin)
  - Legacy: `GET /ratings/station/:_id`
  - Same aggregation shape as bike ratings, but:
    - `$match` `rental_info.start_station = stationId`.
  - If no ratings:
    - Returns zeros with `_id = stationObjectId`.

- App-wide rating (admin)
  - Legacy: `GET /ratings/app`
  - Aggregates across all ratings where any reason has `applies_to = "app"`.
  - Computes:
    - `average_rating`, `total_ratings`.
    - star breakdown 1–5.
  - If no ratings:
    - Returns all zeros.

## Data Model (Legacy Mongo)

- `ratings` collection:
  - `_id: ObjectId`
  - `user_id: ObjectId`
  - `rental_id: ObjectId`
  - `rating: number` (1–5)
  - `reason_ids: ObjectId[]` (refs `rating_reasons`)
  - `comment?: string`
  - `created_at: Date`
  - `updated_at: Date`

- `rating_reasons` collection:
  - `_id: ObjectId`
  - `type: string` (POSITIVE/NEGATIVE/…)
  - `applies_to: string` (BIKE/STATION/APP)
  - `messages: string[]` (human-readable texts).

- Invariants:
  - At most **one rating per rental per user** (middleware + service checks).
  - Rating only allowed on rentals with status `COMPLETED`.
  - Rating only allowed within 7 days of rental completion.
  - User can only rate their own rentals, unless admin.
  - Admin can read any rating.

## Cross-Domain Coupling

- Rentals:
  - Ratings refer to `rental_id`.
  - “Completed rental” check ensures ratings are feedback on finished rides.
  - Rating expiry uses `rental.updated_at` as approximate completion time.

- Users:
  - Ratings tied to `user_id` (owner).
  - Admin / non-admin branching uses `users.role`.

- Bikes:
  - Bike rating aggregates join rentals to `bikes` for per-bike stats.

- Stations:
  - Station rating aggregates join rentals to the `start_station` (legacy “station experience”).

- App:
  - App rating aggregates rating entries where any reason has `applies_to = "app"`.

## Rewrite Checklist (Ratings)

### 1. Domain Design (`apps/server/src/domain/ratings`)

- [x] Define `Rating` and `RatingReason` models decoupled from persistence.
- [ ] Define `RatingRepository`:
  - [x] `createRatingForRental`.
  - [ ] `findRatingByRentalAndUser`.
  - [x] `findRatingByRental` (admin).
  - [ ] `listRatings` with filters & pagination.
  - [ ] Aggregates: `getBikeRatingSummary`, `getStationRatingSummary`, `getAppRatingSummary`.
- [ ] Define domain errors:
  - [x] `RatingNotFound`.
  - [x] `RatingAlreadyExists`.
  - [x] `RatingExpired`.
  - [x] `CannotRateUncompletedRental`.
  - [x] `CannotRateOthersRental`.

### 2. Use-Cases

- [x] `createRatingUseCase(userId, rentalId, dto)`:
  - [x] Check rental belongs to user and is COMPLETED.
  - [x] Enforce 7-day expiry from completion.
  - [x] Enforce “one rating per rental per user”.
  - [x] Validate reasons exist (or delegate to repository layer).
- [x] `getRatingForRentalUseCase(rentalId, currentUser)` (admin vs user view) – v1 is “by rental id”.
- [ ] `listRatingsUseCase` (admin filters).
- [ ] `getRatingDetailUseCase(ratingId)` (admin).
- [ ] `getBikeRatingSummaryUseCase(bikeId)`.
- [ ] `getStationRatingSummaryUseCase(stationId)`.
- [ ] `getAppRatingSummaryUseCase()`.

### 3. Contracts & HTTP (later)

- [x] Add shared contracts under `packages/shared/src/contracts/server/ratings/*`:
  - [x] DTOs for rating create/get-by-rental.
  - [x] Error schemas for v1 create/get.
  - [ ] Aggregates (bike/station/app) and admin listing/detail routes.
- [x] Wire Hono routes in `apps/server/src/http/routes/ratings.ts`:
  - [x] User create + get-by-rental endpoints.
  - [ ] Admin listing/aggregates.

### 4. Simplifications vs Legacy

- [ ] Use UTC timestamps instead of manual time zone hacks.
- [ ] Encode “7-day expiry” and “one rating per rental per user” as domain logic with tests.
- [ ] Consider whether app/station/bike aggregates are needed for v1 of the rewrite, or can be postponed.\*\*\*
