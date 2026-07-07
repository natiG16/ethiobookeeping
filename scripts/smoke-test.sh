#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-http://localhost:4200}"
BASE_URL="${BASE_URL%/}"

echo "Smoke tests against $BASE_URL"

curl -fsS "$BASE_URL/" -o /dev/null
echo "OK $BASE_URL/"

body=$(curl -fsS "$BASE_URL/api/health")
echo "$body" | grep -q UP
echo "OK $BASE_URL/api/health"

curl -fsS "$BASE_URL/payment-methods/cash.png" -o /dev/null
echo "OK $BASE_URL/payment-methods/cash.png"

curl -fsS "$BASE_URL/app/transactions/batch/income" -o /dev/null
echo "OK $BASE_URL/app/transactions/batch/income"

echo "All smoke checks passed."
