# Production Hardening Runbook

## Current Priorities

1. Database backups must exist before every risky deploy.
2. Restores must be tested, not assumed.
3. Production migrations must be reviewed before deploy.
4. Destructive schema changes must be split into safe phases.

## Backups

Install VPS cron backup:

```bash
sudo mkdir -p /etc/mebike
sudo cp ops/postgres-backup.env.example /etc/mebike/postgres-backup.env
sudo chmod 600 /etc/mebike/postgres-backup.env
sudo editor /etc/mebike/postgres-backup.env
```

Find the current Postgres container before editing the env file:

```bash
docker ps --format '{{.Names}}' | grep '^postgres-'
```

Install cron:

```bash
sudo cp ops/mebike-postgres-backup.cron.example /etc/cron.d/mebike-postgres-backup
sudo editor /etc/cron.d/mebike-postgres-backup
```

The cron file runs the backup script every day at `02:15` server time and writes logs to `/var/log/mebike-postgres-backup.log`.

Create a backup manually:

```bash
sudo ENV_FILE=/etc/mebike/postgres-backup.env ./scripts/ops/postgres-backup.sh
```

Off-server copy still required. Local VPS backups protect against bad migrations, but not full VPS loss.

Good next step:

- sync `/var/backups/mebike/postgres` to S3, Backblaze B2, Cloudflare R2, or another server
- keep at least 14 daily backups
- keep at least 4 weekly backups if possible

## Restore Test

Test restore into a non-production DB:

```bash
sudo BACKUP_FILE=/var/backups/mebike/postgres/mebike-latest.dump \
  ENV_FILE=/etc/mebike/postgres-backup.env \
  TARGET_DB=mebike_restore_test \
  ./scripts/ops/postgres-restore.sh
```

Never restore over production unless incident response explicitly requires it:

```bash
sudo BACKUP_FILE=/var/backups/mebike/postgres/mebike-latest.dump \
  ENV_FILE=/etc/mebike/postgres-backup.env \
  TARGET_DB=mebike \
  CONFIRM_RESTORE=mebike \
  ./scripts/ops/postgres-restore.sh
```

## Migration Safety

Before deploy with Prisma migrations:

1. Read generated SQL under `apps/server/prisma/migrations/**/migration.sql`.
2. Create a fresh production backup.
3. Restore latest backup into `mebike_restore_test`.
4. Run `prisma migrate deploy` against the restored test DB.
5. Only deploy production after restored test DB migration succeeds.

Safe schema change pattern:

1. Add nullable column/table/index first.
2. Deploy code that writes both old and new shape if needed.
3. Backfill data.
4. Deploy code that reads the new shape.
5. Only later make column required or drop old data.

Avoid in one deploy:

- dropping columns or tables with production data
- renaming columns without backfill
- changing column type on large populated tables
- adding `NOT NULL` without default/backfill
- destructive `TRUNCATE`, `DELETE`, or raw SQL in migrations

## Rollback Rule

App rollback is easy. Database rollback is not.

Prefer roll-forward fixes. If data corruption happened, stop writers first, then restore from a known-good backup.

## Coolify Deploy Rule

Current `compose.coolify.yaml` runs `server-migrate` before `server`, `worker`, and `worker_iot`.

That is good because app processes do not start until migrations finish. It does not replace backup and restore testing.
