# Rental, Reservation, Pricing, and Deposit Implementation Notes

This document captures what has been implemented so far in the MeBike backend around reservation lifecycle, rental lifecycle, pricing policy integration, wallet deposit holds, and the key product/engineering decisions made along the way.

It is intentionally longer and more explicit than the smaller decision notes so future work can start from the actual chosen behavior instead of guessing from older spec text or redesign SQL noise.

## Status

- Reservation and rental core flow is functionally implemented for the current product direction.
- Pricing policy is now part of runtime behavior, not just schema.
- Deposit is now a real wallet hold for rentals, not only a minimum-balance check.
- Late return after cutoff now forfeits deposit according to the current text spec interpretation.
- Several redesign SQL fields/states were intentionally rejected or deferred because they did not match current product rules.

## Big product decisions we made

### 1. Reservation is bike-specific for the current product

- A normal one-time reservation locks a concrete bike.
- We did not switch reservation to a pure station-slot model.
- Reservation does **not** create a fake placeholder rental row.
- The real rental is created only when pickup/confirmation happens.

Why:

- This matches the current product direction we explicitly chose during implementation.
- It avoids inventing a fake `RESERVED` rental lifecycle.
- It keeps reservation and rental as two distinct phases.

### 2. User does not finalize rental

- User can express return intent by creating a return slot.
- User cannot directly end/finalize a rental.
- Staff/admin confirmation is the real physical handover event.

Why:

- The text spec clearly says staff or agency confirms receipt before the system closes the rental.
- User self-end would make the physical return confirmation meaningless.

### 3. Return slot is a logical return-place hold, not a second reservation

- A return slot belongs to one active rental.
- A rental may have only one active return slot at a time.
- Changing the station replaces the old active return slot.
- No 30-minute expiry was implemented for the current version.
- No worker-based auto-expire logic was implemented.

Why:

- This is the chosen product interpretation for now.
- It reduces station overflow risk without inventing unnecessary time-expiry behavior.

### 4. Operator-confirmed return closes the rental

- Staff/admin confirmed return is the source of truth.
- Rental remains `RENTED` until operator confirmation.
- On confirmation:
  - return confirmation is recorded
  - return slot becomes `USED`
  - bike returns to the station
  - pricing is finalized
  - deposit is handled
  - rental becomes `COMPLETED`

### 5. Pricing policy is snapped, not looked up live later

- Reservation snapshots a `pricingPolicyId`.
- Rental snapshots a `pricingPolicyId`.
- Reservation prepaid amount is stored as resolved money on the reservation.
- Rental final billing uses the snapped policy, not whatever active policy exists later.

Why:

- If policy A is active at reservation/rental creation time, later activation of policy B must not reprice existing flows.
- We also updated the redesign SQL to include `reservations.pricing_policy_id` so that reservation -> pickup under policy A remains explicit in design docs.

### 6. Deposit is for the rental, not for the reservation

- Reservation creation charges only the reservation prepaid fee.
- Deposit is created as a wallet hold when the rental actually starts:
  - direct rental start
  - reservation confirmation that creates the rental

Why:

- The text spec says reservation requires a small prepaid amount, but renting requires the larger deposit threshold.
- This keeps reservation cheaper and lets deposit apply only when a rental really begins.

### 7. Late return rule currently follows the text spec, not the old env penalty model

- Current rule: after `23:00`, deposit is not refunded.
- We did **not** carry forward the old `RENTAL_PENALTY_HOURS` + `RENTAL_PENALTY_AMOUNT` env behavior into the new policy-driven late-return path.
- We also did **not** create extra late penalty rows yet.

Why:

- The text spec explicitly says deposit is not refunded after `23:00`.
- The older env penalty rule is a legacy implementation detail and does not clearly match the current spec wording.

### 8. Exact cutoff interpretation

- `<= 23:00:00` local business time is treated as on-time.
- `> 23:00:00` local business time is treated as late.
- Current implementation uses `Asia/Ho_Chi_Minh` business time semantics.

## What is implemented

## Reservation lifecycle

### Current flow

1. User creates reservation.
2. System resolves active pricing policy.
3. System charges `reservationFee` from that policy.
4. Reservation is created with:
   - bike-specific hold
   - `pricingPolicyId`
   - resolved prepaid amount
5. Bike becomes `RESERVED`.
6. No rental exists yet.

### Reservation confirmation / pickup

1. User confirms the reservation at pickup time.
2. System validates reservation is still pending and usable.
3. System uses the reservation's snapped policy.
4. System checks wallet can cover the deposit amount from that policy.
5. System creates rental.
6. System creates a rental deposit wallet hold.
7. System sets `rental.depositHoldId`.
8. Reservation becomes `FULFILLED`.

### Failure behavior at pickup

If the user has a reservation but no longer has enough wallet balance when pickup happens:

- confirmation fails
- rental is not created
- bike booking is rolled back
- reservation remains not fulfilled
- user must top up wallet before pickup can succeed

This is already implemented and tested.

## Rental lifecycle

### Direct rental start

1. User chooses an available bike.
2. System resolves active pricing policy.
3. System checks wallet can cover `depositRequired`.
4. System creates rental with snapped `pricingPolicyId`.
5. System creates `RENTAL_DEPOSIT` wallet hold.
6. System reserves wallet balance.
7. System writes `rental.depositHoldId`.

### Reservation -> rental start

1. Reservation is confirmed.
2. Rental is created using the reservation's snapped policy.
3. System creates `RENTAL_DEPOSIT` wallet hold.
4. Wallet reserved balance increases.
5. Rental becomes the active ride.

### Return flow

1. User creates return slot for a station.
2. User arrives at station.
3. Staff/admin confirms return.
4. System validates:
   - rental still active
   - active return slot exists
   - station matches return slot
5. System records return confirmation.
6. System finalizes billing.
7. System updates bike station/location.
8. System finalizes the return slot as `USED`.
9. System handles deposit release or forfeiture.
10. Rental becomes `COMPLETED`.

## Return slot capacity meaning

Current capacity formula is effectively:

- `available return slots = station.capacity - totalBikes - activeReturnSlots`

Important consequence:

- when a return slot becomes `USED`, it no longer counts as an active reservation of space
- but the bike has now physically occupied the slot
- so in practice the station does **not** gain a new empty spot from that transition

This is correct for the current model.

## Pricing policy runtime integration

### What policy now controls

- `reservationFee`
- `depositRequired`
- base rental charge via `baseRate` and `billingUnitMinutes`
- late return cutoff via `lateReturnCutoff`

### What policy does not yet control in runtime

- `overtimeRate` is present in schema but not used yet
- scheduled activation via `activeFrom` / `activeTo` is not used yet
- penalty-hours / penalty-amount are not part of the current policy model

### Active policy strategy

Current implementation uses a simple first-pass model:

- exactly one active pricing policy is expected
- runtime fails loudly if there are zero active policies
- runtime fails loudly if there are multiple active policies
- `activeFrom` / `activeTo` are currently ignored for policy selection

This was chosen deliberately to keep the rollout small and deterministic.

### Policy immutability implication

Current implementation preserves "policy A survives later active-policy change to B" by snapping `pricingPolicyId`.

However, that alone does **not** protect against mutating policy A in place.

Therefore the intended operational rule should be:

- pricing policies should be treated as immutable versions
- do not edit policy A in place after it has been used
- create a new policy row instead

## Wallet and deposit behavior

## What was changed in wallet holds

Current wallet hold system was generalized from withdrawal-only to multi-purpose holds.

Implemented schema direction:

- `withdrawalId` is nullable
- `rentalId` exists
- `WalletHoldReason` now includes `RENTAL_DEPOSIT`
- `forfeitedAt` exists
- statuses remain:
  - `ACTIVE`
  - `RELEASED`
  - `SETTLED`

We intentionally did **not** add:

- `EXPIRED`
- `FORFEITED` status
- `expiresAt`

Why:

- those require additional lifecycle rules we have not committed to yet
- we did not want fake states without real runtime behavior

## Deposit hold lifecycle now

### On rental start

- create `RENTAL_DEPOSIT` hold
- increase `wallet.reservedBalance`
- attach hold to rental via `depositHoldId`

### On on-time return

- release deposit hold
- decrease `wallet.reservedBalance`
- do not debit wallet balance for the deposit
- mark billing record `depositForfeited = false`

### On late return after cutoff

- rental still completes normally
- bike still returns to the station
- return slot still becomes `USED`
- deposit hold is not released
- reserved balance is released first
- actual wallet balance is debited by the held deposit amount
- hold is marked settled + forfeited
- billing record sets `depositForfeited = true`

## What the system does **not** do on late return yet

- no extra `RentalPenalty` row
- no extra flat penalty amount
- no overtime-based penalty amount
- no separate `FORFEITED` hold status

The current late-return implementation is intentionally the smallest rule that matches the text spec.

## Seed/default values currently chosen

Current default seeded pricing policy values now align more closely with the text spec:

- reservation fee default: `2000`
- deposit required default: `500000`

This applies to:

- runtime seed
- demo seed path
- test seed helper
- test pricing policy factory default

## Validation and tests added

## Unit tests

Pricing unit tests cover:

- reservation fee resolution
- deposit required resolution
- billing-unit rounding
- active policy repository behavior
- no active policy failure
- multiple active policy failure
- late cutoff boundary helper (`23:00:00` vs `23:00:01`)

## Integration tests

Coverage includes:

- reservation prepaid from pricing policy
- reservation confirmation creates rental with snapped policy
- reservation confirmation creates rental deposit hold
- direct rental start creates deposit hold
- deposit hold release on normal return
- deposit forfeiture after late cutoff
- wallet hold repository create/release/forfeit behavior
- pricing policy A snapshot survives later active-policy change to B
- rental-end HTTP flow still behaves correctly through operator confirmation

## Key redesign/spec adjustments we made

During this work we explicitly cleaned up several redesign SQL mismatches so docs better reflect actual chosen behavior.

### Removed from redesign SQL

- `unlock_method`
- rental `RETURN_PENDING`
- rental `DISPUTED`
- return-slot `expires_at`
- return-slot `EXPIRED`

### Added to redesign SQL

- `reservations.pricing_policy_id`

Why these changes were made:

- they better match the chosen product direction
- they remove redesign-only noise we explicitly do not want to implement right now
- they keep design docs closer to the actual runtime model

## What is intentionally still not done

The following are still deferred and should **not** be mistaken for bugs in the current bucket unless product scope changes again.

- `overtimeRate` runtime logic
- scheduled policy activation with `activeFrom` / `activeTo`
- `RentalPenaltyType.LATE_RETURN` row creation
- any extra flat/hour-based late penalty model
- richer wallet transaction audit fields (`before_balance`, `after_balance`, etc.)
- reservation `ACTIVE` removal / fixed-slot cleanup
- station operational redesign (`pickup_slot_limit`, `return_slot_limit`, etc.)
- return-slot auto-expiry worker behavior

## Recommended interpretation of current business behavior

If someone asks "how does the system behave now?", the clean answer is:

1. user reserves a specific bike or starts directly
2. reservation charges prepaid, not deposit
3. deposit hold is created only when rental actually starts
4. user sets return intent with a return slot
5. staff/admin confirms physical return
6. rental closes only on operator confirmation
7. on-time return releases deposit
8. after-23:00 confirmed return forfeits deposit
9. no extra late penalty amount is applied yet

## Practical next bucket after this

If more work is needed later, the next logical slices are:

1. optional cleanup: remove reservation `ACTIVE` / fixed-slot leftovers
2. optional pricing enhancement: implement `overtimeRate` if truly needed
3. optional accounting enhancement: create explicit `RentalPenalty` rows for late return
4. optional wallet enhancement: richer transaction audit fields

For the current agreed scope, reservation + rental + core pricing + deposit hold + late cutoff forfeiture are effectively done.
