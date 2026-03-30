#!/usr/bin/env sh

set -eu

TEST_DATABASE_URL="${TEST_DATABASE_URL:-postgresql://mebike:mebike@127.0.0.1:5432/mebike_test_template}" \
  pnpm exec vitest run --config vitest.int.config.ts --mode test "$@"
