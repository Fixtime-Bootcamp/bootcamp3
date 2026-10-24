$ErrorActionPreference = "Continue"

docker compose --profile test build backend-tests frontend-tests

docker compose --profile test run --rm backend-tests
$backendStatus = $LASTEXITCODE

docker compose --profile test run --rm frontend-tests
$frontendStatus = $LASTEXITCODE

docker compose --profile test rm -fsv backend-tests frontend-tests | Out-Null

Write-Output "backend tests exit code: $backendStatus"
Write-Output "frontend tests exit code: $frontendStatus"

if ($backendStatus -ne 0 -or $frontendStatus -ne 0) {
    exit 1
}

exit 0
