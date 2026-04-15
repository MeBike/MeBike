# Environment Impact Repair Job Guide

## Purpose

Repair missing Environment Impact jobs for completed rentals.

This command finds rentals that are already `COMPLETED` but do not have a row in
`environmental_impact_stats`, then enqueues an outbox job:

- `type`: `environment.impact.calculateRental`
- `payload`: `{ "version": 1, "rentalId": "<rental-id>" }`
- `dedupe_key`: `environment-impact:rental:<rental-id>`

The repair command only enqueues jobs. It does not calculate impact directly and
does not create `environmental_impact_stats` rows. The existing worker still owns
`EnvironmentImpactService.calculateFromRental(rentalId)`.

## When To Run

Run this command when completed rentals may be missing Environment Impact rows,
for example:

- The worker was stopped.
- A job failed or was lost before enqueue.
- The process crashed after rental completion.
- There was no active policy when an older rental completed.
- Completed rental data existed before the Environment module was enabled.
- Demo data was loaded with `pnpm seed:demo`.

The command does not require an active Environment policy to enqueue repair jobs.
If no active policy exists when the worker processes a job, the worker fails the
job clearly with the existing active-policy error.

For dev/demo databases, `pnpm seed:demo` creates one active Environment policy:
`Default Phase 1 Demo Policy`. This lets the worker calculate impact, but it does
not replace the repair command. Seeded completed rentals are inserted directly,
so the repair command is still needed to enqueue `environment.impact.calculateRental`
jobs for those rentals.

## Command

From `MeBike/apps/server`:

```bash
pnpm worker:environment-impact-repair
```

With CLI options:

```bash
pnpm worker:environment-impact-repair --limit 100
pnpm worker:environment-impact-repair --completedFrom 2026-04-01T00:00:00.000Z --completedTo 2026-04-30T23:59:59.999Z
pnpm worker:environment-impact-repair --limit 100 --completedFrom 2026-04-01T00:00:00.000Z --completedTo 2026-04-30T23:59:59.999Z
```

Equivalent environment variables:

```bash
ENVIRONMENT_REPAIR_LIMIT=100 pnpm worker:environment-impact-repair
ENVIRONMENT_REPAIR_COMPLETED_FROM=2026-04-01T00:00:00.000Z ENVIRONMENT_REPAIR_COMPLETED_TO=2026-04-30T23:59:59.999Z pnpm worker:environment-impact-repair
```

Options:

- `--limit`: maximum rentals to enqueue in one run. Default is `100`.
- `--completedFrom`: optional UTC datetime lower bound on `Rental.end_time`.
- `--completedTo`: optional UTC datetime upper bound on `Rental.end_time`.

Run the command repeatedly or by date windows for large repairs.

## Verify In pgAdmin

Find completed rentals missing impact:

```sql
SELECT r.id, r.user_id, r.status, r.end_time
FROM "Rental" r
LEFT JOIN environmental_impact_stats eis
  ON eis.rental_id = r.id
WHERE r.status = 'COMPLETED'
  AND eis.id IS NULL
ORDER BY r.end_time ASC;
```

Check outbox jobs:

```sql
SELECT id, type, dedupe_key, payload, status, attempts, last_error, created_at, updated_at
FROM job_outbox
WHERE type = 'environment.impact.calculateRental'
ORDER BY created_at DESC;
```

Check impact rows after the worker runs:

```sql
SELECT id, user_id, rental_id, policy_id, estimated_distance_km, co2_saved, calculated_at
FROM environmental_impact_stats
ORDER BY calculated_at DESC;
```

## Process Jobs

After enqueueing repair jobs, run the normal worker:

```bash
pnpm worker
```

If the system uses a separate outbox dispatch step, dispatch once first:

```bash
pnpm worker:dispatch-once
```

Then keep `pnpm worker` running so the `environment.impact.calculateRental` queue
can call `EnvironmentImpactService.calculateFromRental(rentalId)`.

Summary, history, and detail APIs read from `environmental_impact_stats`, so they
will reflect repaired rentals after the worker successfully creates impact rows.
