# Rentals Domain – Findings & Checklist (from legacy backend)

## Core Rental Lifecycle Use Cases

- Create rental session (user):
  - Preconditions: verified user, wallet balance check (middleware).
  - Inputs: `user_id`, `start_station`, `bike`, optional `subscription_id`.
  - Effects:
    - Insert `Rental` with status `Rented`, start time.
    - Update bike status to `Booked`.
    - If subscription used, consume usage via subscription service.
    - Trigger IoT booking command (`book`) for the bike.
- Create rental session (staff):
  - Staff selects user and bike; same core workflow.
- Create rental session from SOS:
  - Align bike’s station with SOS station if needed.
  - Start rental session as above.
- Create rental from card tap:
  - Inputs: `chip_id`, `card_uid`.
  - Delegates to `cardTapService.handleCardTap` for mode + rental.

## Ending & Cancelling Rentals

- End rental (user):
  - Validate user is owner of rental.
  - End at current time and station, run core end logic + post-end side effects.
- End rental (admin/staff):
  - Inputs: end station, end time, optional reason.
  - Validate end_time ≤ now and ≥ start_time.
  - Reuse core end logic (but with explicit end time/station) + post-end side effects.
- Cancel rental (admin/staff):
  - Mark rental as `Cancelled`, set `end_time` & `end_station`.
  - Update bike station and status (e.g. back to `Available`).
  - Insert rental audit log with reason.

## Pricing, Subscriptions & Penalties (Key “God Logic”)

- Duration computation:
  - `generateDuration(start, end)` → minutes (ceil).
  - `durationHours = minutes / 60`.
- Base pricing:
  - `generateTotalPrice(minutes)`:
    - Reads `PRICE_PER_30_MINS` from env.
    - Rounds up to 30-minute units (`halfHourUnit`).
    - `total = pricePer30Min * halfHourUnit`.
- Subscription integration:
  - If rental tied to subscription:
    - Compute required usage count: `ceil(durationHours / HOURS_PER_USED)` with `HOURS_PER_USED` from env.
    - Unlimited max_usages:
      - `usageToAdd = requiredUsages`, totalPrice = 0.
    - Limited max_usages:
      - Determine how many usages remain vs required.
      - Use remaining usages; compute extra hours beyond coverage.
      - Price extra minutes with `generateTotalPrice`.
      - Track `extra_hours`, `total_sub_usages`.
    - Update subscription usage_count accordingly.
- Reservation prepaid handling:
  - Find reservation by rental `_id` and mark it expired.
  - Compute:
    - `origin_price` = full price for rental.
    - `prepaid` = reservation.prepaid.
    - `total_price = max(0, origin_price - prepaid)`.
    - Mark rental as coming from reservation (`is_reservation` flags).
- Penalty rules:
  - If `durationHours > PENALTY_HOURS`:
    - Add `PENALTY_AMOUNT` to total price.
    - Record `penalty_amount` in result.

## Post-End Side Effects

- Wallet charging:
  - If `endedRental.total_price > 0`, call `walletService.paymentRental` with description and rental id.
- Rental logs:
  - Insert `RentalLog` for admin/staff changes, including `reason` and changed fields.
- IoT & pub/sub:
  - After end:
    - If bike has chip_id:
      - If status `Available` → IoT booking command `release`.
      - If status `Broken` → IoT state command `broken`.
    - Publish bike status to Redis channel `bike_status_updates`.
    - Enqueue pending bike status for the user (for real-time updates).

## Rental Queries & Analytics

- User-facing:
  - List my rentals with filters (start_station, end_station, status).
  - List my current rentals (`status = Rented`).
  - Count my rentals by status (default Completed).
  - Get my rental detail (with joined display info).
- Staff/admin:
  - General rental list with optional station/status filters.
  - Rentals by specific user id.
  - Active rentals by phone number.
  - Rental detail and admin update (change status, price, end station/time, reason).

## Metrics & Dashboards

- Revenue over time (`getRentalRevenue`):
  - Group by date / month / year, returning:
    - Total revenue, total rentals per period.
- Station activity (`getStationActivity`):
  - For a date range (and optional station):
    - Rentals count, returns count, total usage hours.
    - Bike count per station.
    - Total available hours (bikes × hours in range).
    - Usage rate = totalUsageHours / totalAvailableHours, capped at 1.
- Reservation statistics (`getReservationsStatistic`):
  - Time-series of reservations:
    - total, successful, cancelled, expired, rates; uses ReservationStatus.
- Dashboard summary:
  - Today’s revenue summary and rental-per-hour stats.
- Rental summary:
  - Count rentals by status (Rented, Completed, Cancelled, Reserved).
  - Revenue today, revenue this month, plus comparison to previous periods.

## HTTP Endpoints (Legacy)

- Creation:
  - `POST /rentals/staff-create` – staff create rental.
  - `POST /rentals/sos/:sosId` – rental from SOS.
  - `POST /rentals` – user create rental.
  - `POST /rentals/card-rental` – card tap rental.
- Ending/cancelling:
  - `PUT /rentals/me/:id/end` – user end own rental.
  - `PUT /rentals/:id/end` – admin/staff end rental.
  - `POST /rentals/:id/cancel` – admin/staff cancel rental.
- “My rentals”:
  - `GET /rentals/me` – my rentals.
  - `GET /rentals/me/current` – my current rentals.
  - `GET /rentals/me/counts` – my rental counts by status.
  - `GET /rentals/me/:id` – my rental detail.
- Admin/staff:
  - `GET /rentals` – list rentals.
  - `GET /rentals/:id` – rental detail.
  - `PUT /rentals/:id` – update rental.
  - `GET /rentals/users/:userId` – rentals by user.
  - `GET /rentals/by-phone/:number/active` – active rentals by phone.
- Metrics:
  - `GET /rentals/dashboard-summary` – dashboard summary.
  - `GET /rentals/summary` – rental summary.
  - `GET /rentals/stats/revenue` – revenue stats.
  - `GET /rentals/stats/station-activity` – station activity stats.
  - `GET /rentals/stats/reservations` – reservation stats (time series).

## “God Service” Notes (What to Split in New Design)

Legacy `RentalsService` combines:

- Core lifecycle (create/end/cancel).
- Pricing and penalty rules (env-driven).
- Subscription usage and integration.
- Reservation prepaid integration.
- Wallet payment logic.
- IoT commands and Redis pub/sub.
- Analytics/reporting (revenue, station activity, dashboard).

In the new domain-first design this should be split into, for example:

- Pure rental lifecycle + pricing module (no IO).
- Subscription usage module.
- Reservation linkage module.
- Wallet adapter, IoT adapter, pubsub adapter (in infrastructure).
- Separate reporting/read-model module for analytics and dashboard queries.
