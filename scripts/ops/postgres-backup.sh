#!/usr/bin/env bash
set -euo pipefail

# Creates a logical Postgres backup from the running Docker container.
# Intended for VPS cron. Keep secrets in a root-owned env file, not in this script.

ENV_FILE="${ENV_FILE:-/etc/mebike/postgres-backup.env}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

BACKUP_DIR="${BACKUP_DIR:-/var/backups/mebike/postgres}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-}"
POSTGRES_USER="${POSTGRES_USER:-}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
POSTGRES_DB="${POSTGRES_DB:-}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

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
require_env POSTGRES_DB

if ! docker inspect "$POSTGRES_CONTAINER" >/dev/null 2>&1; then
  echo "Postgres container not found: ${POSTGRES_CONTAINER}" >&2
  exit 1
fi

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="${BACKUP_DIR}/${POSTGRES_DB}-${timestamp}.dump"
latest_file="${BACKUP_DIR}/${POSTGRES_DB}-latest.dump"

mkdir -p "$BACKUP_DIR"
umask 077

echo "Creating backup: ${backup_file}"
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$POSTGRES_CONTAINER" \
  pg_dump \
    --format=custom \
    --no-owner \
    --no-acl \
    --username="$POSTGRES_USER" \
    --dbname="$POSTGRES_DB" \
  > "$backup_file"

ln -sfn "$(basename "$backup_file")" "$latest_file"

echo "Verifying backup metadata"
docker exec -i "$POSTGRES_CONTAINER" pg_restore --list < "$backup_file" >/dev/null

echo "Pruning backups older than ${RETENTION_DAYS} days"
find "$BACKUP_DIR" -type f -name "${POSTGRES_DB}-*.dump" -mtime "+${RETENTION_DAYS}" -delete

echo "Backup complete: ${backup_file}"
