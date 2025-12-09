# Reservations Domain – Findings & Checklist (from legacy backend)

## Core Reservation Creation Use Cases

- Reserve bike (one-time option):
  - Inputs: `user_id`, `bike_id`, `station_id`, `start_time`.
  - Compute `end_time` using reservation duration helpers (`generateEndTime`, `getHoldHours`).
  - Prepaid amount from `PREPAID_VALUE` env, stored as `Decimal128`.
  - Create `Reservation` with:
    - `_id = reservationId`, status `Pending`, option `ONE_TIME`.
  - Create paired `Rental` with same `_id`:
    - `status = Reserved`, start_station, start_time.
  - Transactional effects:
    - Insert reservation and rental.
    - Update bike status to `Reserved`.
  - Post-transaction:
    - Schedule notification and expiration jobs.
    - Charge wallet for prepaid (`paymentReservation`).
    - Send IoT reservation command (`reserve`).

- Reserve with subscription:
  - Inputs: `user_id`, `bike_id`, `station_id`, `start_time`, `subscription_id`.
  - Create `Reservation` with prepaid = 0, option `SUBSCRIPTION`.
  - Create `Rental` as `Reserved` with subscription_id.
  - Transactional effects:
    - Insert reservation and rental.
    - Update bike status to `Reserved`.
    - Consume subscription usage (`subscriptionService.useOne`).
  - Post-transaction:
    - Schedule notification and expiration jobs.
    - IoT reservation command (`reserve`).

## Cancelling Reservations

- Cancel reservation (user or staff):
  - Inputs: `user_id`, `reservation`, `reason`.
  - Transaction:
    - Update reservation status to `Cancelled`, updated_at.
    - Update rental status to `Cancelled`, updated_at.
    - Restore bike status to `Available` (if bike_id exists).
    - Insert `RentalLog` for audit trail (changes + reason).
  - Refund logic (one-time reservations):
    - If not fixed-slot, not subscription, and reservation is still within refundable window,
      mark refundable and compute `refundAmount = prepaid`.
    - After transaction, call `walletService.refundReservation`.
  - IoT:
    - If bike has chip_id, send `IotReservationCommand.cancel`.

## Confirming Reservations → Active Rentals

- Confirm reservation (user):
  - Preconditions: user must own reservation.
  - Core (`confirmReservationCore`):
    - Load user & bike for context/validation.
    - Ensure rental with `_id = reservation._id` has `status = Reserved`.
    - Update rental:
      - `start_time = now`, `status = Rented`.
      - Propagate `fixed_slot_template_id` and `subscription_id` if present.
    - Update reservation:
      - `status = Active`, `updated_at = now`.
    - Update bike:
      - `status = Booked`, `updated_at = now`.
    - For staff confirmations, insert `RentalLog` with changes + reason.
  - Post:
    - If bike has chip, send IoT booking `claim` command.

- Confirm reservation (staff):
  - Same core logic, but:
    - Staff id is used for logging.
    - Used via `staffConfirmReservation`.

## Expiry & Notification

- Notify expiring reservations:
  - Use queues (`reservationNotifyQueue`) to send notifications before expiry.
  - Delay based on `EXPIRY_NOTIFY_MINUTES` env.
- Expire reservations:
  - Find all `Pending` reservations with `end_time < now`.
  - For each:
    - Mark reservation `Expired`.
    - Release bike (status → Available).
    - Log success/failure for each expired reservation.
  - Return total `expired_count`.
- Alternative delayed expiration (`scheduleDelayedExpiration`):
  - Sleep until delay, then check if reservation still pending and expire it, releasing bike.
  - Uses `expireReservationAndReleaseBike` helper.

## Reservation Queries & Reporting

- Reservation list (depends on user role):
  - For `Role.User`:
    - Filter by `user_id`, `status = Pending`.
  - For staff/admin:
    - Use admin filter builder (`buildAdminReservationFilter`) on query params.
- Reservation history:
  - For a user:
    - Filter by `user_id` and `status IN [Active, Cancelled, Expired]`.
    - Optional filter by a specific status.
    - Optional filter by `station_id`.
- Station reservations stats:
  - `getStationReservations`:
    - Aggregate reservation metrics per station id.
- Reservation report (`getReservationReport`):
  - Inputs: `startDate`, `endDate`, `groupBy` (Date, Month, Year).
  - Pipeline:
    - Group by derived period key.
    - Compute:
      - Total reservations.
      - Successful (Active + Expired with completed rental).
      - Cancelled.
      - Expired without completed rental.
      - Total prepaid revenue.
  - Derived metrics:
    - Success, cancel, expire rates (%) per period.
  - Output shape:
    - Keys depending on groupBy (`date` / `month` / `year`) + counts and percentages.

## Dispatching Bikes Between Stations

- Dispatch bikes between two stations (`dispatchSameStation`):
  - Inputs: `source_station_id`, `destination_station_id`, list of bike ids + preloaded bike docs.
  - Update bikes to new station and adjust statuses as defined in middleware/service.

## HTTP Endpoints (Legacy)

- Jobs / maintenance:
  - `POST /reservations/notify/expiring` – trigger notifications for expiring reservations.
  - `POST /reservations/mark-expired` – mark pending reservations as expired.
- User views:
  - `GET /reservations/history` – user reservation history.
  - `GET /reservations` – pending reservations for user; admin/staff filtered list.
- Creation:
  - `POST /reservations` – create reservation (one-time or subscription).
- Station-level stats:
  - `GET /reservations/:stationId/stats` – reservation stats per station (admin/staff).
- Confirmation/cancellation:
  - `POST /reservations/:id/confirm` – user confirm own reservation.
  - `POST /reservations/:id/cancel` – user cancel reservation.
  - `POST /reservations/:id/staff-confirm` – staff confirm reservation.
  - `POST /reservations/:id/staff-cancel` – staff cancel reservation.
- Dispatch:
  - `POST /reservations/dispatch` – dispatch bikes between two stations (admin).
- Reporting:
  - `GET /reservations/stats` – reservation report grouped by date/month/year (admin).
- Detail:
  - `GET /reservations/:id` – reservation detail.

## “God Service” Notes (What to Split in New Design)

Legacy `ReservationsService` mixes:

- Reservation lifecycle (create, cancel, confirm, expire).
- Rental lifecycle linkage (paired rentals with same id).
- Wallet payments and refunds for prepaid amounts.
- Subscription usage and integration.
- IoT commands for reserve/cancel/claim.
- Email sending via queues (confirmation emails).
- Queue scheduling for notifications and expirations.
- Reporting/analytics pipelines for reservation stats.

In the new domain-first design, this should be split into:

- Pure reservation domain module (rules, statuses, transitions).
- Reservation–rental linkage module.
- Payment/refund adapters (wallet).
- Subscription usage module.
- IoT adapter.
- Queue/notification scheduling module.
- Separate reporting/read-model module for reservation analytics.
