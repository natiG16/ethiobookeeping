# Smoke-test a running stack (local Docker or VPS). Usage: .\scripts\smoke-test.ps1 [-BaseUrl http://localhost:4200]
param(
  [string]$BaseUrl = "http://localhost:4200"
)

$ErrorActionPreference = "Stop"
$base = $BaseUrl.TrimEnd("/")

function Test-Url($path, $expectStatus = 200) {
  $url = "$base$path"
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15
    if ($r.StatusCode -ne $expectStatus) {
      throw "Expected $expectStatus got $($r.StatusCode) for $url"
    }
    Write-Host "OK $url" -ForegroundColor Green
    return $r
  } catch {
    Write-Host "FAIL $url — $($_.Exception.Message)" -ForegroundColor Red
    throw
  }
}

Write-Host "Smoke tests against $base" -ForegroundColor Cyan
Test-Url "/" | Out-Null
$health = Test-Url "/api/health"
if ($health.Content -notmatch "UP") { throw "Health body missing UP" }
Test-Url "/payment-methods/cash.png" | Out-Null
# SPA route (batch income) should return index, not 404
Test-Url "/app/transactions/batch/income" | Out-Null
Write-Host "All smoke checks passed." -ForegroundColor Green
