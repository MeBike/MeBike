# Reservation ↔ Rental Integration Audit (2026-01-07)

## What’s implemented (current behavior)

- `reserveBikeUseCase` (one-time + subscription):
  - Blocks overlapping holds for the user and for the bike (time-aware `PENDING` window).
  - Also blocks if the user has any latest `PENDING|ACTIVE` reservation.
  - Creates `Reservation(PENDING)` and a paired `Rental(RESERVED)` with the same id (`rental.id = reservation.id`).
  - For ONE_TIME: debits wallet prepaid inside the DB transaction.
  - For SUBSCRIPTION: consumes 1 subscription usage inside the DB transaction, prepaid = 0.
  - Atomically sets bike `AVAILABLE -> RESERVED`.
  - Enqueues outbox jobs for near-expiry notify + expiry.

- `confirmReservationUseCase`:
  - Transitions `Reservation: PENDING -> ACTIVE`.
  - Transitions `Rental: RESERVED -> RENTED`.
  - Atomically sets bike `RESERVED -> BOOKED`.

- `cancelReservationUseCase`:
  - Transitions `Reservation: PENDING -> CANCELLED`.
  - Transitions `Rental: RESERVED -> CANCELLED`.
  - Atomically sets bike `RESERVED -> AVAILABLE`.
  - Refunds ONE_TIME prepaid outside the tx (best-effort), idempotent via wallet tx hash.

- Reservation expiry worker (`ReservationExpireHold`):
  - If reservation is `PENDING` and `endTime < now`: marks `EXPIRED`, cancels reserved rental, releases bike, sends email.

## Gaps vs legacy domain-notes (integration missing pieces)

1) Reservation never gets finalized after rental ends
- After confirmation, reservation becomes `ACTIVE`.
- There is no code to transition `ACTIVE -> terminal` when `endRentalUseCase` completes the rental.
- Side effect: `ACTIVE` reservations can block future reservations indefinitely (`ActiveReservationExists` checks `PENDING|ACTIVE`).

2) End-rental does not apply reservation prepaid deduction
- Legacy: final charge is `max(0, originPrice - reservation.prepaid)`.
- Current rentals end flow has TODOs and does not look up reservation by `rentalId` (which equals `reservationId` in this design).

3) Confirm does not enforce hold window
- `confirmPendingInTx` checks only `status === PENDING`.
- It does not fail when `endTime <= now` (so delayed expiry jobs can allow confirming an already-expired hold).

4) Fixed-slot assignment is not aligned with legacy subscription usage
- `assignFixedSlotReservationsUseCase` does not consume subscription usage (legacy had bulk usage consume).
- It also uses `Effect.runPromise(...)` inside `client.$transaction(...)`, which is a known Effect env footgun.

## Proposed integration plan (no code yet)

1) Decide reservation terminal status after a completed rental
- Option A: reuse `EXPIRED` as “closed/completed” (minimal schema changes, semantics are muddy).
- Option B: add `COMPLETED` reservation status (cleaner, requires schema + contract updates).

2) Finalize reservation in `endRentalUseCase`
- In the same DB tx that completes the rental:
  - If `Reservation` exists with id = `rentalId`:
    - Apply prepaid deduction to the computed rental charge.
    - Transition reservation `ACTIVE -> terminal`.

3) Enforce hold validity on confirm
- In `confirmPendingInTx`:
  - If `endTime` exists and `endTime <= now`, fail (new domain error or mapped transition error).

4) Fixed-slot parity decision
- Decide whether fixed-slot reserves consume subscription usages in the rewrite.
- If yes: implement bulk consume semantics or redesign to reuse the same “useOne” rules.
- Refactor fixed-slot tx to `runPrismaTransaction` style (avoid `runPromise` inside `$transaction`).
