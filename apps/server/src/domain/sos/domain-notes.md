# SOS Domain – Findings (from legacy backend)

## Summary

In the legacy backend, SOS is a distinct domain centered around an `SosAlert` aggregate with:

- Its own state machine (`PENDING → ASSIGNED → EN_ROUTE → RESOLVED|UNSOLVABLE|REJECTED`, plus `CANCELLED`).
- Role-based access rules (USER vs STAFF vs SOS agent).
- Strong cross-domain coupling into Rentals settlement rules (notably the `UNSOLVABLE` path).

This should remain a first-class domain in the rewrite, with explicit integration points into Rentals/Bikes/Subscriptions.

## Aggregate

Legacy persistence uses `sos_alerts` with key fields:

- `rental_id` (required, SOS is always tied to a rental)
- `requester_id` (user who requested SOS)
- `sos_agent_id` (assigned SOS staff)
- `replaced_bike_id` (optional replacement bike)
- `status` (`SosAlertStatus`)
- `issue`, `location`, `agent_notes`, `photos`, `reason`
- `resolved_at`, `created_at`, `updated_at`

## State Machine (Legacy)

Statuses:

- `PENDING` (created by user)
- `ASSIGNED` (staff assigns an SOS agent + replacement bike)
- `EN_ROUTE` (SOS agent confirms they are going)
- Terminal statuses:
  - `RESOLVED` (solvable at scene; rental can continue)
  - `UNSOLVABLE` (cannot fix at scene; rental cannot continue)
  - `REJECTED` (agent rejects request)
- `CANCELLED` (request cancelled by requester/staff while pending)

Key transitions enforced by request validation:

- `PENDING → ASSIGNED` (staff only)
- `ASSIGNED → EN_ROUTE` (assigned SOS agent only)
- `EN_ROUTE → RESOLVED|UNSOLVABLE|REJECTED` (assigned SOS agent only)
- `PENDING → CANCELLED` (requester or staff)

## Authorization Rules (Legacy)

- STAFF can view all SOS requests (for tracking/ops).
- USER can only view/cancel their own SOS requests.
- SOS agent:
  - Can only access SOS requests assigned to them (`sos_agent_id = me`)
  - Cannot list/view `PENDING` or `CANCELLED` requests.

## Cross-Domain Integrations (Legacy)

### Rentals end-settlement coupling

When ending a rental, legacy checks for an `UNSOLVABLE` SOS alert for that rental.

- If `UNSOLVABLE` exists:
  - User is not charged for the rental.
  - If rental used a subscription, subscription usage is refunded (decrement usage count).
  - Bike status becomes `BROKEN` (instead of returning to `AVAILABLE`).

This is a major behavioral invariant and should be explicitly modeled in the rewrite (likely in an end-rental workflow use-case that composes Rentals + SOS + Wallet + Subscriptions + Bikes).

### “Start rental from SOS” flow

Legacy supports staff starting a new rental from an SOS request:

- Endpoint: `POST /rentals/sos/:sosId`
- Precondition: SOS status must be `UNSOLVABLE`.
- Uses `replaced_bike_id` from SOS request and the original rental’s `start_station`.
- If the replacement bike’s station differs from the station used to start, legacy adjusts bike station before starting the new rental.

## Rewrite Notes / TODOs

- Decide the rewrite’s source of truth for SOS request creation:
  - User-initiated only during an active rental, or allow staff creation too?
- Add explicit “integration API” from SOS to Rentals:
  - `findUnsolvableByRentalId(rentalId)` (or similar).
  - Keep this read-only for most flows; state transitions remain in SOS domain.
- Decide “invalid payload / invalid transition” policies in workers/HTTP:
  - Transition validation should live in domain logic, not only in HTTP route validation.
