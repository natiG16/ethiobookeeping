# Run backend + frontend tests (starts PostgreSQL via Docker Compose for backend)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "=== PostgreSQL for integration tests ===" -ForegroundColor Cyan
Push-Location $root
docker compose up -d postgres
$deadline = (Get-Date).AddMinutes(2)
do {
    $healthy = docker inspect --format='{{.State.Health.Status}}' ethiobooks-db 2>$null
    if ($healthy -eq "healthy") { break }
    Start-Sleep -Seconds 2
} while ((Get-Date) -lt $deadline)
if ($healthy -ne "healthy") {
    Write-Error "PostgreSQL did not become healthy. Start Docker Desktop and run: docker compose up -d postgres"
}
Pop-Location

Write-Host "=== Backend tests ===" -ForegroundColor Cyan
Push-Location "$root\backend"
mvn -q test
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "=== Frontend unit tests ===" -ForegroundColor Cyan
Push-Location "$root\web"
npm run test:ci
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "=== Production frontend build ===" -ForegroundColor Cyan
Push-Location "$root\web"
npm run build:prod
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "All checks passed." -ForegroundColor Green
