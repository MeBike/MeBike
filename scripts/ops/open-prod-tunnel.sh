#!/usr/bin/env bash

set -euo pipefail

SSH_HOST="${MEBIKE_SSH_HOST:-}"
STACK_PREFIX="${MEBIKE_STACK_PREFIX:-ua60yxcend5bm577cvs1rqii}"
LOCAL_PG_PORT="${MEBIKE_LOCAL_PG_PORT:-15432}"
LOCAL_REDIS_PORT="${MEBIKE_LOCAL_REDIS_PORT:-16379}"
PREFERRED_IP_PREFIX="${MEBIKE_DOCKER_IP_PREFIX:-10.0.3.}"
SSH_BASE=(ssh)

if [[ -z "$SSH_HOST" ]]; then
  printf 'MEBIKE_SSH_HOST is required. Example: export MEBIKE_SSH_HOST="user@host"\n' >&2
  exit 1
fi

resolve_container_ips() {
  ${SSH_BASE[@]} "$SSH_HOST" "STACK_PREFIX='$STACK_PREFIX' PREFERRED_IP_PREFIX='$PREFERRED_IP_PREFIX' bash -s" <<'EOF'
set -euo pipefail

pick_ip() {
  local container_name="$1"
  local preferred_ip_prefix="$2"
  local fallback_ip=""

  while IFS=' ' read -r _network_name ip_address; do
    [[ -n "${ip_address:-}" ]] || continue

    if [[ -z "$fallback_ip" ]]; then
      fallback_ip="$ip_address"
    fi

    case "$ip_address" in
      "$preferred_ip_prefix"*)
        printf '%s\n' "$ip_address"
        return 0
        ;;
    esac
  done < <(docker inspect --format '{{range $k, $v := .NetworkSettings.Networks}}{{println $k $v.IPAddress}}{{end}}' "$container_name")

  if [[ -n "$fallback_ip" ]]; then
    printf '%s\n' "$fallback_ip"
    return 0
  fi

  return 1
}

postgres_container="$(docker ps --filter "name=postgres-${STACK_PREFIX}-" --format '{{.Names}}')"
redis_container="$(docker ps --filter "name=redis-${STACK_PREFIX}-" --format '{{.Names}}')"

if [[ -z "$postgres_container" || -z "$redis_container" ]]; then
  exit 1
fi

postgres_ip="$(pick_ip "$postgres_container" "$PREFERRED_IP_PREFIX")"
redis_ip="$(pick_ip "$redis_container" "$PREFERRED_IP_PREFIX")"

printf 'postgres %s\n' "$postgres_ip"
printf 'redis %s\n' "$redis_ip"
EOF
}

ip_output="$(resolve_container_ips)"
postgres_ip="$(printf '%s\n' "$ip_output" | grep '^postgres ' | cut -d' ' -f2)"
redis_ip="$(printf '%s\n' "$ip_output" | grep '^redis ' | cut -d' ' -f2)"

if [[ -z "$postgres_ip" || -z "$redis_ip" ]]; then
  printf 'Could not resolve current Postgres/Redis IPs from %s.\n' "$SSH_HOST" >&2
  exit 1
fi

printf 'Opening tunnel via %s\n' "$SSH_HOST"
printf '  Postgres: 127.0.0.1:%s -> %s:5432\n' "$LOCAL_PG_PORT" "$postgres_ip"
printf '  Redis:    127.0.0.1:%s -> %s:6379\n' "$LOCAL_REDIS_PORT" "$redis_ip"

printf '\n'
printf 'Run this command:\n'
printf 'ssh -N \\\n'
printf '  -L 127.0.0.1:%s:%s:5432 \\\n' "$LOCAL_PG_PORT" "$postgres_ip"
printf '  -L 127.0.0.1:%s:%s:6379 \\\n' "$LOCAL_REDIS_PORT" "$redis_ip"
printf '  %s\n' "$SSH_HOST"
