#!/usr/bin/env bash
set -uo pipefail

docker compose --profile test build backend-tests frontend-tests

docker compose --profile test run --rm backend-tests
backend_status=$?

docker compose --profile test run --rm frontend-tests
frontend_status=$?

docker compose --profile test rm -fsv backend-tests frontend-tests >/dev/null 2>&1

echo "backend tests exit code: ${backend_status}"
echo "frontend tests exit code: ${frontend_status}"

if [ "${backend_status}" -ne 0 ] || [ "${frontend_status}" -ne 0 ]; then
  exit 1
fi

exit 0
