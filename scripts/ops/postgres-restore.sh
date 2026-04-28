#!/usr/bin/env bash
set -euo pipefail

# Restores a logical Postgres backup into a target database inside the running
# Postgres Docker container. By default this refuses to restore over production.
# Intended for manual incident response or restore tests, not automatic cron.

ENV_FILE="${ENV_FILE:-/etc/mebike/postgres-backup.env}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

BACKUP_FILE="${BACKUP_FILE:-}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-}"
POSTGRES_USER="${POSTGRES_USER:-}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
TARGET_DB="${TARGET_DB:-mebike_restore_test}"
CONFIRM_RESTORE="${CONFIRM_RESTORE:-}"

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "${name} is required. Set it in ${ENV_FILE} or as an environment variable." >&2
    exit 1
  fi
}

require_env POSTGRES_CONTAINER
require_env POSTGRES_USER
require_env POSTGRES_PASSWORD

if ! docker inspect "$POSTGRES_CONTAINER" >/dev/null 2>&1; then
  echo "Postgres container not found: ${POSTGRES_CONTAINER}" >&2
  exit 1
fi

if [[ -z "$BACKUP_FILE" ]]; then
  echo "BACKUP_FILE is required" >&2
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

if [[ "$TARGET_DB" == "mebike" && "$CONFIRM_RESTORE" != "mebike" ]]; then
  echo "Refusing to restore over production DB without CONFIRM_RESTORE=mebike" >&2
  exit 1
fi

echo "Verifying backup metadata"
docker exec -i "$POSTGRES_CONTAINER" pg_restore --list < "$BACKUP_FILE" >/dev/null

echo "Recreating target database: ${TARGET_DB}"
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$POSTGRES_CONTAINER" \
  psql --username="$POSTGRES_USER" --dbname=postgres \
  --command="SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${TARGET_DB}';" >/dev/null

docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$POSTGRES_CONTAINER" \
  dropdb --if-exists --username="$POSTGRES_USER" "$TARGET_DB"

docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$POSTGRES_CONTAINER" \
  createdb --username="$POSTGRES_USER" "$TARGET_DB"

echo "Restoring backup into: ${TARGET_DB}"
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" "$POSTGRES_CONTAINER" \
  pg_restore \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    --username="$POSTGRES_USER" \
    --dbname="$TARGET_DB" \
  < "$BACKUP_FILE"

echo "Restore complete: ${TARGET_DB}"
